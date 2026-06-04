<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
     *   - Format apapun selama mengandung angka db_id di dalamnya
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

        // ── 3. Cari Order di Database ─────────────────────────────────────────
        $order = Order::find($db_order_id);

        if (!$order) {
            Log::error('Midtrans Webhook: Order tidak ditemukan di database', [
                'order_id_raw' => $order_id_raw,
                'db_order_id'  => $db_order_id,
            ]);
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Ambil relasi payment jika sudah ada
        $payment = Payment::where('order_id', $order->id)->first();

        // Simpan status saat ini sebagai baseline
        $orderStatus   = $order->status_pesanan;
        $paymentStatus = $payment ? $payment->status_pembayaran : 'pending';

        // ── 4. Peta Status: transaction_status Midtrans → status internal ─────
        //
        //  Referensi: https://docs.midtrans.com/reference/transaction-status
        //
        //  capture    → kartu kredit berhasil di-capture (fraud check OK)
        //  settlement → pembayaran dikonfirmasi masuk (QRIS, VA, dll)
        //  pending    → menunggu aksi pelanggan (VA belum ditransfer, dll)
        //  deny       → ditolak oleh bank / fraud detection
        //  expire     → melewati batas waktu pembayaran
        //  cancel     → dibatalkan oleh merchant atau pelanggan

        switch ($transaction) {
            case 'capture':
                // Hanya berlaku untuk credit_card
                if ($type === 'credit_card') {
                    if ($fraud === 'challenge') {
                        // Perlu verifikasi manual di dashboard Midtrans
                        $paymentStatus = 'pending';
                    } else {
                        $paymentStatus = 'lunas';
                        $orderStatus   = 'diproses';
                    }
                }
                break;

            case 'settlement':
                // Pembayaran berhasil dikonfirmasi (QRIS, VA, GoPay, dll)
                $paymentStatus = 'lunas';
                $orderStatus   = 'diproses';
                break;

            case 'pending':
                // Pelanggan belum menyelesaikan pembayaran (VA belum ditransfer)
                $paymentStatus = 'pending';
                // Jangan ubah status order — biarkan tetap 'menunggu_pembayaran'
                break;

            case 'deny':
            case 'expire':
            case 'cancel':
                $paymentStatus = 'gagal';
                $orderStatus   = 'batal';

                // --- RESTOCK LOGIC ---
                // Pastikan order yang belum dibatalkan sebelumnya yang di-restock
                // untuk menghindari restock ganda jika Midtrans mengirim webhook berulang
                if ($order->status_pesanan !== 'batal') {
                    foreach ($order->orderItems as $item) {
                        Menu::where('id', $item->menu_id)->increment('stok', $item->jumlah);
                    }
                    Log::info('Midtrans Webhook: Restock item berhasil karena pesanan batal/expired', ['order_id' => $order->id]);
                }
                break;

            default:
                // Status tidak dikenal — log saja, jangan ubah data
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
        // Midtrans menghentikan retry hanya jika menerima HTTP 2xx.
        // Jika response bukan 2xx, Midtrans akan retry hingga 7x dalam 24 jam.
        return response()->json(['message' => 'OK']);
    }
}
