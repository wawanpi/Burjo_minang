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
        // Auto-Cancel Dinamis untuk Pesanan Kasir (Digital) yang menggantung > 5 menit
        $expiredOrders = Order::with(['payment', 'orderItems'])
            ->whereHas('payment', function($q) {
                $q->where('metode_pembayaran', '!=', 'Tunai');
            })
            ->where('status_pesanan', 'menunggu_pembayaran')
            ->where('created_at', '<', Carbon::now()->subMinutes(5))
            ->get();

        if ($expiredOrders->count() > 0) {
            foreach ($expiredOrders as $expOrder) {
                $expOrder->update(['status_pesanan' => 'batal']);
                if ($expOrder->payment) {
                    $expOrder->payment->update(['status_pembayaran' => 'gagal']);
                }
                // Kembalikan stok menu
                foreach ($expOrder->orderItems as $item) {
                    \App\Models\Menu::where('id', $item->menu_id)->increment('stok', $item->jumlah);
                }
            }
        }

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

        return Inertia::render('Kasir/Orders/Index', [
            'orders'  => OrderResource::collection($orders),
            'filters' => ['status' => $status],
        ]);
    }

    /**
     * Memperbarui status pesanan secara manual oleh kasir.
     *
     * Terdapat beberapa validasi keamanan (security gate):
     * 1. Mencegah rollback status yang sudah lunas/selesai.
     * 2. Mencegah bypass status pesanan online yang masih menunggu Midtrans.
     * 3. Mencegah kasir mengubah status pembayaran digital yang masih pending.
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
        $order->load(['user:id,name,email,no_hp', 'orderItems.menu:id,nama_menu,harga', 'payment']);

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
        $order->load(['user:id,name', 'orderItems.menu:id,nama_menu,harga', 'payment']);

        return view('kasir.struk', [
            'order' => $order,
            'kasir' => auth()->user(),
        ]);
    }
}
