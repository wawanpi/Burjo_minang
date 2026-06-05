<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderManagementController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status');

        $orders = Order::query()
            ->with(['user:id,name,email,no_hp', 'orderItems.menu:id,nama_menu,harga', 'payment'])
            // ── Scope: Hari Ini + Pesanan Menggantung (dari hari sebelumnya) ──
            ->where(function ($query) {
                $query
                    // Pesanan yang dibuat hari ini
                    ->whereDate('created_at', Carbon::today())
                    // ATAU pesanan dari hari sebelumnya yang statusnya masih aktif/belum selesai
                    ->orWhereIn('status_pesanan', ['menunggu_pembayaran', 'diproses']);
            })
            ->when($status, function ($query, $status) {
                $query->where('status_pesanan', $status);
            })
            ->latest('tanggal_pesan')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Orders/Index', [
            'orders'  => \App\Http\Resources\OrderResource::collection($orders),
            'filters' => ['status' => $status],
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status_pesanan' => ['required', 'in:menunggu_pembayaran,diproses,selesai,batal'],
        ]);

        $newStatus = $validated['status_pesanan'];
        $currentStatus = $order->status_pesanan;
        $paymentStatus = $order->payment ? $order->payment->status_pembayaran : null;

        // --- BACKEND SECURITY VALIDATION ---
        // 1. Cegah perubahan kembali ke menunggu_pembayaran jika sudah lunas / selesai
        if ($newStatus === 'menunggu_pembayaran') {
            if ($currentStatus === 'selesai' || $paymentStatus === 'lunas') {
                return redirect()
                    ->back()
                    ->with('error', 'Aksi ilegal! Status transaksi yang sudah lunas tidak dapat dimanipulasi.');
            }
        }
        
        // 2. Jika tipe online dan status sedang menunggu_pembayaran, dilarang langsung bypass ke diproses/selesai secara manual
        if ($order->tipe_pesanan === 'online' && $currentStatus === 'menunggu_pembayaran') {
            if ($newStatus === 'diproses' || $newStatus === 'selesai') {
                return redirect()
                    ->back()
                    ->with('error', 'Aksi ilegal! Transaksi online menunggu validasi payment gateway.');
            }
        }

        // 3. SECURITY BUG FIX: Pencegahan Manipulasi Kasir pada Pembayaran Digital
        // Jika metode pembayaran BUKAN Tunai, kasir sama sekali tidak boleh mengutak-atik status jika masih menunggu_pembayaran.
        // Status ini HANYA boleh diubah oleh Webhook Midtrans (PaymentCallbackController).
        if ($order->payment && $order->payment->metode_pembayaran !== 'Tunai' && $currentStatus === 'menunggu_pembayaran') {
            return redirect()
                ->back()
                ->with('error', 'Aksi ditolak (403)! Pembayaran digital (QRIS/Transfer Bank) sedang diproses oleh sistem Midtrans. Tunggu notifikasi otomatis.');
        }

        $order->update(['status_pesanan' => $newStatus]);

        // Jika pesanan selesai dan ada payment, tandai lunas
        if ($newStatus === 'selesai' && $order->payment) {
            $order->payment->update(['status_pembayaran' => 'lunas']);
        }

        // Jika pesanan dibatalkan dan ada payment, tandai gagal
        if ($newStatus === 'batal' && $order->payment) {
            $order->payment->update(['status_pembayaran' => 'gagal']);
        }

        return redirect()
            ->back()
            ->with('success', 'Status pesanan berhasil diperbarui.');
    }

    public function printNota(Order $order)
    {
        $order->load(['user:id,name,email,no_hp', 'orderItems.menu:id,nama_menu,harga', 'payment']);

        return Inertia::render('Orders/Nota', [
            'order' => $order,
            'kasir' => auth()->user(), // Kasir / Owner yang sedang login
        ]);
    }
}
