<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * PaymentCallbackController — Webhook handler untuk notifikasi Midtrans.
 *
 * Controller ini TIDAK diakses oleh user/browser. Ia hanya dipanggil
 * oleh server Midtrans melalui HTTP POST ke endpoint /api/payment-callback.
 *
 * Tugas utama:
 * 1. Memvalidasi payload notifikasi dari Midtrans (signature verification).
 * 2. Memetakan transaction_status Midtrans ke status internal aplikasi.
 * 3. Mengembalikan stok menu (restock) jika pembayaran gagal/expired.
 * 4. Mengembalikan HTTP 200 agar Midtrans tidak melakukan retry.
 */
class PaymentCallbackController extends Controller
{
    /**
     * Endpoint Webhook Midtrans.
     *
     * Menerima notifikasi POST dari server Midtrans dan memperbarui
     * status pesanan & pembayaran di database secara otomatis.
     *
     * Format order_id yang didukung (fleksibel, tidak perlu whitelist):
     *   - 'ORDER-{db_id}-{timestamp}'   → pesanan online Customer
     *   - 'KASIR-{db_id}-{timestamp}'   → pesanan offline POS Kasir
     *   - '{db_id}'                      → format tanpa prefix (fallback)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function callback(Request $request)
    {
        // ── 1. Konfigurasi & Inisialisasi Midtrans Notification ──────────────
        \Midtrans\Config::$serverKey    = env('MIDTRANS_SERVER_KEY');
        \Midtrans\Config::$isProduction = env('MIDTRANS_IS_PRODUCTION', false);

        try {
            // Class Notification otomatis membaca payload POST dan
            // memvalidasi Signature Key dari Midtrans secara internal.
            $notif = new \Midtrans\Notification();
        } catch (\Exception $e) {
            Log::error('Midtrans Webhook: Gagal memvalidasi notifikasi', [
                'error' => $e->getMessage(),
            ]);
            // HTTP 400 → Midtrans TIDAK akan retry jika 4xx
            return response()->json(['message' => 'Invalid payload or signature'], 400);
        }

        $transaction  = $notif->transaction_status;
        $type         = $notif->payment_type;
        $order_id_raw = $notif->order_id;
        $fraud        = $notif->fraud_status;

        // ── 2. PARSING ORDER ID — Regex Fleksibel ────────────────────────────
        //
        //  Strategi: Ekstrak ANGKA PERTAMA dari string order_id menggunakan
        //  regex, tanpa bergantung pada whitelist prefix atau posisi index.
        //
        //  Contoh nilai $order_id_raw dan hasil parsing:
        //  ┌─────────────────────────────┬──────────────┐
        //  │ order_id_raw (dari Midtrans)│ db_order_id  │
        //  ├─────────────────────────────┼──────────────┤
        //  │ ORDER-18-1780074387         │ 18           │
        //  │ KASIR-42-1780098123         │ 42           │
        //  │ POS-7-1780099999            │ 7            │
        //  │ 99                          │ 99           │
        //  │ TRX-ORDER-123-9999          │ 123          │
        //  └─────────────────────────────┴──────────────┘
        //
        //  Pola /\D*(\d+)/ artinya:
        //    \D* → lewati karakter non-digit apapun di awal (prefix bebas)
        //    (\d+) → tangkap satu atau lebih digit → ini adalah db_order_id

        $db_order_id = null;

        if (preg_match('/\D*(\d+)/', $order_id_raw, $matches)) {
            $db_order_id = (int) $matches[1];
        }

        if (!$db_order_id) {
            Log::error('Midtrans Webhook: Tidak ada angka ID yang dapat diekstrak dari order_id', [
                'order_id_raw' => $order_id_raw,
            ]);
            return response()->json(['message' => 'Invalid Order ID format'], 400);
        }

        // Deteksi sumber transaksi dari prefix untuk keperluan logging
        $orderIdUpper = strtoupper($order_id_raw);
        if (str_contains($orderIdUpper, 'KASIR')) {
            $sumber = 'POS Kasir (Offline)';
        } elseif (str_contains($orderIdUpper, 'ORDER')) {
            $sumber = 'Online Customer';
        } else {
            $sumber = 'Unknown (no prefix)';
        }

        Log::info('Midtrans Webhook: Notifikasi diterima', [
            'sumber'       => $sumber,
            'order_id_raw' => $order_id_raw,
            'db_order_id'  => $db_order_id,
            'trx_status'   => $transaction,
        ]);

        // ── 3. Cari Order di Database dengan Pessimistic Lock ─────────────────
        // Gunakan DB Transaction + lockForUpdate untuk mencegah race condition
        // jika Midtrans mengirim webhook duplikat secara bersamaan
        return DB::transaction(function () use ($db_order_id, $order_id_raw, $transaction, $type, $fraud, $sumber) {
            
            $order = Order::lockForUpdate()->find($db_order_id);

            if (!$order) {
                Log::error('Midtrans Webhook: Order tidak ditemukan di database', [
                    'order_id_raw' => $order_id_raw,
                    'db_order_id'  => $db_order_id,
                ]);
                return response()->json(['message' => 'Order not found'], 404);
            }

            // Ambil relasi payment jika sudah ada
            $payment = Payment::lockForUpdate()->where('order_id', $order->id)->first();

            // Simpan status saat ini sebagai baseline
            $orderStatus   = $order->status_pesanan;
            $paymentStatus = $payment ? $payment->status_pembayaran : 'pending';

            // --- SECURITY FIX: STATE MACHINE PENCEGAHAN LINTAS STATUS ---
            // Cegah webhook (yang mungkin telat datang) membangkitkan pesanan yang sudah final
            if (in_array($orderStatus, ['batal', 'selesai'])) {
                Log::info('Midtrans Webhook: Diabaikan karena pesanan sudah final (batal/selesai)', [
                    'order_id'       => $order->id,
                    'status_pesanan' => $orderStatus
                ]);
                return response()->json(['message' => 'Order is already in final state']);
            }

            // ── 4. Peta Status: transaction_status Midtrans → status internal ─────
            switch ($transaction) {
                case 'capture':
                    if ($type === 'credit_card') {
                        if ($fraud === 'challenge') {
                            $paymentStatus = 'pending';
                        } else {
                            $paymentStatus = 'lunas';
                            $orderStatus   = 'diproses';
                        }
                    }
                    break;

                case 'settlement':
                    $paymentStatus = 'lunas';
                    $orderStatus   = 'diproses';
                    break;

                case 'pending':
                    $paymentStatus = 'pending';
                    break;

                case 'deny':
                case 'expire':
                case 'cancel':
                    $paymentStatus = 'gagal';
                    $orderStatus   = 'batal';

                    // --- RESTOCK LOGIC ---
                    // Karena sudah di dalam lockForUpdate, pengecekan ini kebal dari race condition
                    if ($order->status_pesanan !== 'batal') {
                        foreach ($order->orderItems as $item) {
                            Menu::where('id', $item->menu_id)->increment('stok', $item->jumlah);
                        }
                        Log::info('Midtrans Webhook: Restock item berhasil karena pesanan batal/expired', ['order_id' => $order->id]);
                    }
                    break;

                default:
                    Log::warning('Midtrans Webhook: transaction_status tidak dikenal', [
                        'transaction_status' => $transaction,
                        'order_id_raw'       => $order_id_raw,
                    ]);
                    break;
            }

            // ── 5. Simpan Pembaruan ke Database ───────────────────────────────────
            $order->update(['status_pesanan' => $orderStatus]);

            if ($payment) {
                $payment->update(['status_pembayaran' => $paymentStatus]);
            }

            Log::info('Midtrans Webhook: Status berhasil diperbarui', [
                'order_id_raw'        => $order_id_raw,
                'db_order_id'         => $db_order_id,
                'sumber'              => $sumber,
                'transaction_status'  => $transaction,
                'order_status_baru'   => $orderStatus,
                'payment_status_baru' => $paymentStatus,
            ]);

            // ── 6. Response HTTP 200 — WAJIB ─────────────────────────────────────
            return response()->json(['message' => 'OK']);
        }); // Tutup DB::transaction
    }
}
