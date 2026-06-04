<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentCallbackController extends Controller
{
    /**
     * Endpoint Webhook Midtrans
     */
    public function callback(Request $request)
    {
        // Konfigurasi kunci rahasia Midtrans
        \Midtrans\Config::$serverKey = env('MIDTRANS_SERVER_KEY');
        \Midtrans\Config::$isProduction = env('MIDTRANS_IS_PRODUCTION', false);

        try {
            // 1. Inisialisasi Midtrans Notification
            // Class ini otomatis menangkap payload POST dari Midtrans dan memvalidasi Signature Key-nya
            $notif = new \Midtrans\Notification();
        } catch (\Exception $e) {
            Log::error('Midtrans Webhook Error: ' . $e->getMessage());
            // Beri respon bad request jika signature/payload tidak valid
            return response()->json(['message' => 'Invalid payload or signature'], 400);
        }

        $transaction = $notif->transaction_status;
        $type = $notif->payment_type;
        $order_id_raw = $notif->order_id;
        $fraud = $notif->fraud_status;

        // 2. LOGIKA KRUSIAL (Order ID Parsing)
        // Midtrans menerima order_id seperti 'ORDER-18-1780074387'
        // Kita pecah dengan explode() berdasarkan tanda strip '-' 
        $parts = explode('-', $order_id_raw);
        
        // Ambil indeks ke-1 (angka 18) untuk mencari Order di Database
        $db_order_id = isset($parts[1]) ? $parts[1] : null;

        if (!$db_order_id) {
            Log::error('Midtrans Webhook: Format Order ID tidak valid (' . $order_id_raw . ')');
            return response()->json(['message' => 'Invalid Order ID format'], 400);
        }

        // Cari pesanan di Database
        $order = Order::find($db_order_id);
        if (!$order) {
            Log::error('Midtrans Webhook: Pesanan tidak ditemukan dengan ID: ' . $db_order_id);
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Cari relasi pembayaran jika ada
        $payment = Payment::where('order_id', $order->id)->first();

        $orderStatus = $order->status_pesanan;
        $paymentStatus = $payment ? $payment->status_pembayaran : 'pending';

        // 3. Update Status Berdasarkan $notif->transaction_status
        if ($transaction == 'capture') {
            if ($type == 'credit_card') {
                if ($fraud == 'challenge') {
                    $paymentStatus = 'pending';
                } else {
                    $paymentStatus = 'lunas';
                    $orderStatus = 'diproses';
                }
            }
        } else if ($transaction == 'settlement') {
            // Uang sukses masuk / berhasil dibayar
            $paymentStatus = 'lunas';
            $orderStatus = 'diproses';
            
        } else if ($transaction == 'pending') {
            // Menunggu pembayaran
            $paymentStatus = 'pending';
            
        } else if (in_array($transaction, ['deny', 'expire', 'cancel'])) {
            // Pembayaran dibatalkan, ditolak, atau kadaluwarsa
            $paymentStatus = 'gagal';
            $orderStatus = 'batal';
        }

        // Simpan pembaruan status ke dalam Database
        $order->update(['status_pesanan' => $orderStatus]);
        if ($payment) {
            $payment->update(['status_pembayaran' => $paymentStatus]);
        }

        Log::info('Midtrans Webhook: Status Pesanan Berhasil Diperbarui', [
            'order_id_midtrans'  => $order_id_raw,
            'order_id_database'  => $db_order_id,
            'transaction_status' => $transaction,
            'order_status'       => $orderStatus
        ]);

        // 4. Response Wajib
        // Wajib me-return HTTP 200 OK agar Midtrans menghentikan pengiriman ulang (retry webhook)
        return response()->json(['message' => 'Success']);
    }
}
