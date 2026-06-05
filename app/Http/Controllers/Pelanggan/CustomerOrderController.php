<?php

namespace App\Http\Controllers\Pelanggan;

use App\Http\Controllers\Controller;
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

/**
 * CustomerOrderController — Menangani seluruh alur pemesanan pelanggan online.
 *
 * Controller ini mencakup:
 * 1. Menampilkan daftar menu dengan rating.
 * 2. Proses checkout dengan integrasi Midtrans Snap.
 * 3. Menampilkan riwayat pesanan (aktif & selesai).
 * 4. Menyimpan ulasan/review pelanggan.
 */
class CustomerOrderController extends Controller
{
    /**
     * Menampilkan halaman menu pemesanan online untuk pelanggan.
     *
     * Menu ditampilkan beserta rating rata-rata dan jumlah review
     * agar pelanggan bisa memilih berdasarkan popularitas.
     *
     * @return \Inertia\Response
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
     * Memproses checkout pesanan pelanggan dan generate Midtrans Snap Token.
     *
     * Alur keamanan:
     * 1. Harga dihitung ulang dari database (mencegah manipulasi frontend).
     * 2. Stok dikunci dengan lockForUpdate() untuk mencegah race condition.
     * 3. Midtrans Snap Token di-generate setelah order tersimpan.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response|\Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.menu_id'       => ['required', 'exists:menus,id', 'distinct'],
            'items.*.jumlah'        => ['required', 'integer', 'min:1'],
            'items.*.harga'         => ['required', 'numeric', 'min:0'],
            'tipe_pesanan'          => ['required', 'in:dine_in,take_away'],
            'waktu_pengambilan'     => ['nullable', 'string'],
            'metode_pembayaran'     => ['required', 'in:Transfer Bank,QRIS'],
            // jumlah_orang: wajib diisi saat Dine In, diabaikan saat Take Away
            'jumlah_orang'          => [
                $request->input('tipe_pesanan') === 'dine_in' ? 'required' : 'nullable',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        // Format waktu pengambilan (jam kedatangan hari ini)
        $waktuPengambilan = null;
        if (!empty($validated['waktu_pengambilan'])) {
            $waktuPengambilan = Carbon::createFromFormat('H:i', $validated['waktu_pengambilan'])->setDate(
                now()->year, now()->month, now()->day
            );
        }

        DB::beginTransaction();
        try {
            // --- SECURITY & RACE CONDITION FIX ---
            // 1. Kalkulasi harga murni dari database (bukan dari input frontend)
            // 2. Gunakan lockForUpdate() agar stok tidak direbut pesanan lain yang masuk bersamaan
            $totalHarga = 0;
            $secureItems = [];

            foreach ($validated['items'] as $item) {
                $menu = Menu::lockForUpdate()->find($item['menu_id']);
                
                if (!$menu || $menu->stok < $item['jumlah']) {
                    DB::rollBack();
                    $namaMenu = $menu ? $menu->nama_menu : 'Menu tidak ditemukan';
                    return redirect()->back()->with('error', "Mohon maaf, stok {$namaMenu} tidak mencukupi.");
                }

                $hargaAsli = $menu->harga;
                $subtotal = $hargaAsli * $item['jumlah'];
                $totalHarga += $subtotal;

                $secureItems[] = [
                    'menu_id'  => $menu->id,
                    'jumlah'   => $item['jumlah'],
                    'harga'    => $hargaAsli,
                    'subtotal' => $subtotal,
                ];
            }

            // Buat Order dengan total_harga yang sudah aman (dari database, bukan frontend)
            $order = Order::create([
                'user_id'           => auth()->id(),
                'total_harga'       => $totalHarga,
                'status_pesanan'    => 'menunggu_pembayaran',
                'tanggal_pesan'     => now(),
                'tipe_pesanan'      => $validated['tipe_pesanan'],
                'waktu_pengambilan' => $waktuPengambilan,
                // Hanya simpan jumlah_orang untuk Dine In, null untuk Take Away
                'jumlah_orang'      => $validated['tipe_pesanan'] === 'dine_in'
                    ? (int) $validated['jumlah_orang']
                    : null,
            ]);

            // Buat Order Items & kurangi stok menu
            foreach ($secureItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id'  => $item['menu_id'],
                    'jumlah'   => $item['jumlah'],
                    'harga'    => $item['harga'],
                    'subtotal' => $item['subtotal'],
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

            // Tentukan enabled_payments berdasarkan pilihan pelanggan
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
                // Custom Expiry 3 Menit (fast food)
                'custom_expiry' => [
                    'start_time' => now()->format('Y-m-d H:i:s O'),
                    'unit'       => 'minute',
                    'duration'   => 3,
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
                return Inertia::location($paymentUrl);

            } catch (\Exception $midtransError) {
                Log::error('Midtrans Snap Creation Failed', [
                    'order_id' => $order->id,
                    'error'    => $midtransError->getMessage(),
                ]);

                return redirect()->back()->with('error', 'Gagal menghubungi Payment Gateway: ' . $midtransError->getMessage());
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal memproses pesanan: ' . $e->getMessage());
        }
    }

    /**
     * Menampilkan halaman pesanan pelanggan (tab Aktif & Riwayat).
     *
     * Fitur auto-cancel: Pesanan 'menunggu_pembayaran' yang lebih dari 5 menit
     * otomatis dibatalkan dan stoknya dikembalikan.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function orders(Request $request)
    {
        // 1. Auto-Cancel Dinamis: Batalkan pesanan 'menunggu_pembayaran' yang umurnya > 5 menit
        $expiredOrders = Order::with(['orderItems', 'payment'])
            ->where('user_id', auth()->id())
            ->where('status_pesanan', 'menunggu_pembayaran')
            ->where('created_at', '<', now()->subMinutes(5))
            ->get();

        if ($expiredOrders->count() > 0) {
            foreach ($expiredOrders as $expOrder) {
                $expOrder->update(['status_pesanan' => 'batal']);
                
                if ($expOrder->payment) {
                    $expOrder->payment->update(['status_pembayaran' => 'gagal']);
                }
                
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

        // Transform data agar format konsisten untuk frontend
        $transformedOrders = $orders->map(function ($order) {
            $sisaMenit = null;
            if ($order->waktu_pengambilan && $order->status_pesanan === 'diproses') {
                $sisaMenit = (int) round(now()->diffInMinutes(Carbon::parse($order->waktu_pengambilan), false));
            }

            return [
                'id'                 => $order->id,
                'total_harga'        => (float) $order->total_harga,
                'status_pesanan'     => $order->status_pesanan,
                'tanggal_pesan'      => $order->tanggal_pesan ? Carbon::parse($order->tanggal_pesan)->toISOString() : null,
                'tipe_pesanan'       => $order->tipe_pesanan,
                'waktu_pengambilan'  => $order->waktu_pengambilan ? Carbon::parse($order->waktu_pengambilan)->toISOString() : null,
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
     * Menyimpan ulasan/review pelanggan untuk menu yang sudah dipesan.
     *
     * Validasi:
     * - Pesanan harus milik user yang login.
     * - Status pesanan harus 'selesai'.
     * - Satu user hanya bisa review satu kali per menu.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Order         $order
     * @return \Illuminate\Http\RedirectResponse
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
