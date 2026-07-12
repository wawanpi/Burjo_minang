<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * OrderManagementController — Mengelola daftar pesanan dan perubahan status.
 *
 * Controller ini digunakan oleh Kasir dan Owner untuk melihat pesanan masuk,
 * mengubah status pesanan, dan mencetak nota/struk.
 */
class OrderManagementController extends Controller
{
    /**
     * Menampilkan daftar pesanan hari ini beserta pesanan menggantung dari hari sebelumnya.
     *
     * Pesanan "menggantung" adalah pesanan yang statusnya masih 'menunggu_pembayaran'
     * atau 'diproses' dari hari-hari sebelumnya yang belum dituntaskan.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Auto-Cancel Dinamis untuk Pesanan Kasir (Digital) yang menggantung > 5 menit.
        //
        // Bug #6 (race condition): tiap pembatalan dibungkus DB::transaction +
        // lockForUpdate dan memeriksa ulang status di dalam lock, agar pesanan
        // yang baru saja dilunasi via webhook Midtrans tidak ikut dibatalkan.
        $expiredOrderIds = Order::whereHas('payment', function($q) {
                $q->where('metode_pembayaran', '!=', 'Tunai');
            })
            ->where('status_pesanan', 'menunggu_pembayaran')
            ->where('created_at', '<', Carbon::now()->subMinutes(5))
            ->pluck('id');

        foreach ($expiredOrderIds as $expiredId) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($expiredId) {
                $expOrder = Order::with(['payment', 'orderItems'])
                    ->lockForUpdate()
                    ->find($expiredId);

                if (!$expOrder || $expOrder->status_pesanan !== 'menunggu_pembayaran') {
                    return;
                }

                $expOrder->update(['status_pesanan' => 'batal']);
                if ($expOrder->payment) {
                    $expOrder->payment->update(['status_pembayaran' => 'gagal']);
                }
                // Kembalikan stok menu
                foreach ($expOrder->orderItems as $item) {
                    \App\Models\Menu::where('id', $item->menu_id)->increment('stok', $item->jumlah);
                }
            });
        }

        $status = $request->input('status');

        // ─── 1. Pesanan Hari Ini ───
        $pesanan_hari_ini = Order::query()
            ->with(['user' => fn ($q) => $q->withTrashed(), 'orderItems.menu' => fn ($q) => $q->withTrashed(), 'payment'])
            ->where(function ($query) {
                // Termasuk pesanan dengan waktu_pengambilan hari ini atau sebelumnya, ATAU yang tidak punya waktu spesifik
                $query->whereDate('waktu_pengambilan', '<=', Carbon::today())
                      ->orWhereNull('waktu_pengambilan');
            })
            ->where(function ($query) {
                $query
                    ->whereDate('created_at', Carbon::today())
                    ->orWhereIn('status_pesanan', ['menunggu_pembayaran', 'diproses']);
            })
            ->when($status, function ($query, $status) {
                $query->where('status_pesanan', $status);
            })
            ->latest('tanggal_pesan')
            ->paginate(15, ['*'], 'page_hari_ini')
            ->withQueryString();

        // ─── 2. Pesanan Pre-Order (PO) Mendatang ───
        $pesanan_po_mendatang = Order::query()
            ->with(['user' => fn ($q) => $q->withTrashed(), 'orderItems.menu' => fn ($q) => $q->withTrashed(), 'payment'])
            ->whereDate('waktu_pengambilan', '>', Carbon::today())
            ->whereIn('status_pesanan', ['menunggu_pembayaran', 'diproses'])
            ->when($status, function ($query, $status) {
                $query->where('status_pesanan', $status);
            })
            ->latest('tanggal_pesan')
            ->paginate(15, ['*'], 'page_po')
            ->withQueryString();

        return Inertia::render('Kasir/Orders/Index', [
            'pesanan_hari_ini'     => OrderResource::collection($pesanan_hari_ini),
            'pesanan_po_mendatang' => OrderResource::collection($pesanan_po_mendatang),
            'filters'              => ['status' => $status],
        ]);
    }

    /**
     * Memperbarui status pesanan secara manual oleh kasir.
     *
     * Terdapat beberapa validasi keamanan (security gate):
     * 1. Mencegah rollback status yang sudah lunas/selesai.
     * 2. Mencegah kasir mengubah status pembayaran digital yang masih pending
     *    (hanya webhook Midtrans yang boleh).
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Order         $order
     * @return \Illuminate\Http\RedirectResponse
     */
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
        
        // 2. SECURITY: Pencegahan Manipulasi Kasir pada Pembayaran Digital
        // Jika metode pembayaran BUKAN Tunai, kasir sama sekali tidak boleh mengutak-atik status jika masih menunggu_pembayaran.
        // Status ini HANYA boleh diubah oleh Webhook Midtrans (PaymentCallbackController).
        if ($order->payment && $order->payment->metode_pembayaran !== 'Tunai' && $currentStatus === 'menunggu_pembayaran') {
            return redirect()
                ->back()
                ->with('error', 'Aksi ditolak (403)! Pembayaran digital (QRIS/Transfer Bank) sedang diproses oleh sistem Midtrans. Tunggu notifikasi otomatis.');
        }

        // [FIX HIGH] Jika pesanan dibatalkan dan status sebelumnya bukan batal, kembalikan stok!
        if ($newStatus === 'batal' && $currentStatus !== 'batal') {
            foreach ($order->orderItems as $item) {
                \App\Models\Menu::where('id', $item->menu_id)->increment('stok', $item->jumlah);
            }
            // Jika ada payment, tandai gagal
            if ($order->payment) {
                $order->payment->update(['status_pembayaran' => 'gagal']);
            }
        }

        $order->update(['status_pesanan' => $newStatus]);

        // Jika pesanan selesai dan ada payment, tandai lunas
        if ($newStatus === 'selesai' && $order->payment) {
            $order->payment->update(['status_pembayaran' => 'lunas']);
        }

        return redirect()
            ->back()
            ->with('success', 'Status pesanan berhasil diperbarui.');
    }

    /**
     * Menampilkan halaman cetak nota/struk untuk thermal printer.
     *
     * Menggunakan Inertia::render agar konsisten dengan stack TSX.
     * Data kasir yang sedang login ikut dikirim untuk dicetak di struk.
     *
     * @param  \App\Models\Order  $order
     * @return \Inertia\Response
     */
    public function printNota(Order $order)
    {
        $order->load(['user' => fn ($q) => $q->withTrashed(), 'orderItems.menu' => fn ($q) => $q->withTrashed(), 'payment']);

        return Inertia::render('Kasir/Orders/Nota', [
            'order' => $order,
            'kasir' => auth()->user(), // Kasir / Owner yang sedang login
        ]);
    }

    /**
     * Cetak struk thermal (Blade ringan, auto-print).
     */
    public function printStruk(Order $order)
    {
        $order->load(['user' => fn ($q) => $q->withTrashed(), 'orderItems.menu' => fn ($q) => $q->withTrashed(), 'payment']);

        return view('kasir.struk', [
            'order' => $order,
            'kasir' => auth()->user(),
        ]);
    }
}
