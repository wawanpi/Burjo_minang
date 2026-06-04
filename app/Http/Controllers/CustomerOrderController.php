<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CustomerOrderController extends Controller
{
    /**
     * Menampilkan halaman menu pemesanan online untuk pelanggan
     */
    public function index()
    {
        // Ambil menu dengan rating rata-rata
        $menus = Menu::withAvg('reviews', 'rating')
                     ->withCount('reviews')
                     ->latest()
                     ->get();

        $kategoriList = Menu::select('kategori')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori');

        return Inertia::render('Customer/Menu', [
            'menus'        => $menus,
            'kategoriList' => $kategoriList,
        ]);
    }

    /**
     * Memproses checkout pesanan dari keranjang sesuai dengan form baru di Menu.tsx
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.menu_id'       => ['required', 'exists:menus,id'],
            'items.*.jumlah'        => ['required', 'integer', 'min:1'],
            'items.*.harga'         => ['required', 'numeric', 'min:0'],
            'tipe_pesanan'          => ['required', 'in:dine_in,take_away'],
            'waktu_pengambilan'     => ['nullable', 'string'], // type time format H:i
            'metode_pembayaran'     => ['required', 'in:Transfer Bank,QRIS'],
        ]);

        // Hitung total
        $totalHarga = 0;
        foreach ($validated['items'] as $item) {
            $totalHarga += $item['harga'] * $item['jumlah'];
        }

        // Format waktu pengambilan (jam kedatangan hari ini)
        $waktuPengambilan = null;
        if (!empty($validated['waktu_pengambilan'])) {
            $waktuPengambilan = Carbon::createFromFormat('H:i', $validated['waktu_pengambilan'])->setDate(
                now()->year, now()->month, now()->day
            );
            // Jika jam yang dipilih sudah lewat hari ini, mungkin maksudnya besok, 
            // tapi untuk restoran biasanya hari ini.
            if ($waktuPengambilan->isPast()) {
                // Jangan error, tetap set aja sebagai target waktu.
            }
        }

        // Validasi stok sebelum memproses pesanan (pengaman ganda backend)
        foreach ($validated['items'] as $item) {
            $menu = Menu::find($item['menu_id']);
            if (!$menu || $menu->stok < $item['jumlah']) {
                $namaMenu = $menu ? $menu->nama_menu : 'Menu tidak ditemukan';
                return redirect()->back()->with('error', "Mohon maaf, stok {$namaMenu} tidak mencukupi.");
            }
        }

        DB::beginTransaction();
        try {
            // Buat Order
            $order = Order::create([
                'user_id'           => auth()->id(),
                'total_harga'       => $totalHarga,
                'status_pesanan'    => 'menunggu_pembayaran',
                'tanggal_pesan'     => now(),
                'tipe_pesanan'      => $validated['tipe_pesanan'],
                'waktu_pengambilan' => $waktuPengambilan,
            ]);

            // Buat Order Items & kurangi stok menu
            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id'  => $item['menu_id'],
                    'jumlah'   => $item['jumlah'],
                    'harga'    => $item['harga'],
                    'subtotal' => $item['harga'] * $item['jumlah'],
                ]);

                // Kurangi stok menu di database
                Menu::where('id', $item['menu_id'])->decrement('stok', $item['jumlah']);
            }

            // Buat Payment awal (Pending)
            $payment = Payment::create([
                'order_id'          => $order->id,
                'metode_pembayaran' => $validated['metode_pembayaran'],
                'status_pembayaran' => 'pending',
            ]);

            DB::commit();

            // ── Integrasi Midtrans Snap: Generate Payment URL ───────────
            \Midtrans\Config::$serverKey    = env('MIDTRANS_SERVER_KEY');
            \Midtrans\Config::$isProduction = env('MIDTRANS_IS_PRODUCTION', false);
            \Midtrans\Config::$isSanitized  = true;
            \Midtrans\Config::$is3ds        = true;

            // Buat item details untuk Midtrans
            $itemDetails = [];
            foreach ($validated['items'] as $item) {
                $menuData = Menu::find($item['menu_id']);
                $itemDetails[] = [
                    'id'       => (string) $item['menu_id'],
                    'price'    => (int) $item['harga'],
                    'quantity' => (int) $item['jumlah'],
                    'name'     => $menuData ? substr($menuData->nama_menu, 0, 50) : 'Menu #' . $item['menu_id'],
                ];
            }

            // Menentukan enabled_payments berdasarkan pilihan user
            $enabledPayments = [];
            if ($validated['metode_pembayaran'] === 'QRIS') {
                $enabledPayments = ['gopay', 'shopeepay', 'other_qris'];
            } else if ($validated['metode_pembayaran'] === 'Transfer Bank') {
                $enabledPayments = ['bank_transfer', 'echannel', 'permata_va', 'bca_va', 'bni_va', 'bri_va'];
            }

            $params = [
                'transaction_details' => [
                    'order_id'     => 'ORDER-' . $order->id . '-' . time(),
                    'gross_amount' => (int) $order->total_harga,
                ],
                'customer_details' => [
                    'first_name' => auth()->user()->name,
                    'email'      => auth()->user()->email ?? null,
                ],
                'item_details' => $itemDetails,
                // Batasi UI Midtrans sesuai pilihan pembayaran
                'enabled_payments' => $enabledPayments,
                // Custom Expiry 5 Menit
                'custom_expiry' => [
                    'start_time' => now()->format('Y-m-d H:i:s O'),
                    'unit'       => 'minute',
                    'duration'   => 5,
                ],
            ];

            try {
                $snapTransaction = \Midtrans\Snap::createTransaction($params);
                $paymentUrl = $snapTransaction->redirect_url;
                $snapToken  = $snapTransaction->token;

                // Simpan data transaksi ke tabel payments
                $payment->update([
                    'payment_url'    => $paymentUrl,
                    'payment_token'  => $snapToken,
                    'transaction_id' => $params['transaction_details']['order_id'],
                ]);

                // Redirect pelanggan langsung ke halaman pembayaran Midtrans Snap
                // Pastikan menggunakan Inertia::location untuk navigasi eksternal
                return Inertia::location($paymentUrl);
            } catch (\Exception $midtransError) {
                Log::error('Midtrans Snap Creation Failed', [
                    'order_id' => $order->id,
                    'error'    => $midtransError->getMessage(),
                ]);

                // Kembalikan response dengan pesan error yang jelas alih-alih redirect diam-diam
                return redirect()->back()->with('error', 'Gagal menghubungi Payment Gateway: ' . $midtransError->getMessage());
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal memproses pesanan: ' . $e->getMessage());
        }
    }

    /**
     * Menampilkan tab Pesanan Aktif dan Riwayat Pesanan
     */
    public function orders(Request $request)
    {
        // 1. Auto-Cancel Dinamis: Batalkan pesanan 'menunggu_pembayaran' yang umurnya > 5 menit
        $expiredOrders = Order::where('user_id', auth()->id())
            ->where('status_pesanan', 'menunggu_pembayaran')
            ->where('created_at', '<', now()->subMinutes(5))
            ->get();

        if ($expiredOrders->count() > 0) {
            foreach ($expiredOrders as $expOrder) {
                $expOrder->update(['status_pesanan' => 'batal']);
                
                // Kembalikan stok menu jika pesanan dibatalkan otomatis
                foreach ($expOrder->orderItems as $item) {
                    Menu::where('id', $item->menu_id)->increment('stok', $item->jumlah);
                }
            }
        }

        $tab = $request->input('tab', 'aktif'); // 'aktif' atau 'riwayat'

        $baseQuery = Order::with(['orderItems.menu', 'payment', 'orderItems.menu.reviews' => function($q) {
                $q->where('user_id', auth()->id());
            }])
            ->where('user_id', auth()->id());

        if ($tab === 'aktif') {
            $baseQuery->whereIn('status_pesanan', ['menunggu_pembayaran', 'diproses']);
        } else {
            $baseQuery->whereIn('status_pesanan', ['selesai', 'batal']);
        }

        $orders = $baseQuery->latest('tanggal_pesan')->get();

        // Transform data
        $transformedOrders = $orders->map(function ($order) {
            $sisaMenit = null;
            if ($order->waktu_pengambilan && $order->status_pesanan === 'diproses') {
                $sisaMenit = (int) round(now()->diffInMinutes(Carbon::parse($order->waktu_pengambilan), false));
            }

            return [
                'id'                 => $order->id,
                'total_harga'        => (float) $order->total_harga,
                'status_pesanan'     => $order->status_pesanan,
                'tanggal_pesan'      => $order->tanggal_pesan ? \Carbon\Carbon::parse($order->tanggal_pesan)->toISOString() : null,
                'tipe_pesanan'       => $order->tipe_pesanan,
                'waktu_pengambilan'  => $order->waktu_pengambilan ? \Carbon\Carbon::parse($order->waktu_pengambilan)->toISOString() : null,
                'sisa_menit'         => $sisaMenit,
                'payment'            => $order->payment ? [
                    'metode_pembayaran' => $order->payment->metode_pembayaran,
                    'status_pembayaran' => $order->payment->status_pembayaran,
                    'payment_url'       => $order->payment->payment_url,
                ] : null,
                'order_items'        => $order->orderItems->map(function ($item) {
                    $hasReview = $item->menu && $item->menu->reviews->count() > 0;
                    return [
                        'id'       => $item->id,
                        'menu_id'  => $item->menu_id,
                        'jumlah'   => $item->jumlah,
                        'subtotal' => (float) $item->subtotal,
                        'menu'     => $item->menu ? [
                            'id'        => $item->menu->id,
                            'nama_menu' => $item->menu->nama_menu,
                            'harga'     => (float) $item->menu->harga,
                            'kategori'  => $item->menu->kategori,
                            'gambar'    => $item->menu->gambar,
                        ] : null,
                        'has_review' => $hasReview
                    ];
                }),
                'can_review' => $order->status_pesanan === 'selesai' && $order->orderItems->contains(function ($item) {
                    return $item->menu && $item->menu->reviews->where('user_id', auth()->id())->isEmpty();
                })
            ];
        });

        return Inertia::render('Customer/Orders', [
            'orders' => $transformedOrders,
            'tab'    => $tab,
        ]);
    }

    /**
     * Menyimpan ulasan dari sebuah pesanan
     */
    public function storeReview(Request $request, Order $order)
    {
        // Pastikan order ini milik user yang sedang login dan statusnya selesai
        if ($order->user_id !== auth()->id() || $order->status_pesanan !== 'selesai') {
            abort(403, 'Aksi tidak diizinkan.');
        }

        $validated = $request->validate([
            'reviews'             => ['required', 'array', 'min:1'],
            'reviews.*.menu_id'   => ['required', 'exists:menus,id'],
            'reviews.*.rating'    => ['required', 'integer', 'min:1', 'max:5'],
            'reviews.*.komentar'  => ['nullable', 'string', 'max:500'],
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['reviews'] as $reviewData) {
                // Hanya simpan jika belum pernah direview oleh user ini
                $existing = Review::where('user_id', auth()->id())
                    ->where('menu_id', $reviewData['menu_id'])
                    ->first();
                
                if (!$existing && $reviewData['rating'] > 0) {
                    Review::create([
                        'user_id'        => auth()->id(),
                        'menu_id'        => $reviewData['menu_id'],
                        'rating'         => $reviewData['rating'],
                        'komentar'       => $reviewData['komentar'] ?? '',
                        'tanggal_ulasan' => now(),
                    ]);
                }
            }
            DB::commit();

            return redirect()->back()->with('success', 'Terima kasih atas ulasan Anda!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menyimpan ulasan: ' . $e->getMessage());
        }
    }
}
