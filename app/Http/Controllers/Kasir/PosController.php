<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * PosController — Menangani transaksi Point of Sale (Kasir Offline).
 *
 * Controller ini menangani dua jenis transaksi kasir:
 * 1. Tunai  → Langsung lunas, tanpa gateway pembayaran.
 * 2. Digital → Menggunakan Midtrans Snap (QRIS / Transfer Bank).
 *
 * Semua transaksi menggunakan DB::transaction dan lockForUpdate()
 * untuk mencegah race condition pada stok menu.
 */
class PosController extends Controller
{
    /**
     * Toggle status Buka/Tutup Toko.
     */
    public function toggleStoreStatus(Request $request)
    {
        $currentStatus = Cache::get('is_store_open', true);
        Cache::forever('is_store_open', !$currentStatus);

        $statusText = !$currentStatus ? 'buka' : 'tutup';
        return redirect()->back()->with('success', "Status toko berhasil diubah menjadi {$statusText}.");
    }
    /**
     * Menampilkan halaman Point of Sale (POS) dengan daftar menu yang tersedia.
     *
     * Hanya menampilkan menu yang stoknya > 0.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $menus = Menu::where('stok', '>', 0)
            ->orderBy('kategori')
            ->orderBy('nama_menu')
            ->get();

        $kategoriList = Menu::select('kategori')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori');

        return Inertia::render('Kasir/Pos/Index', [
            'menus'        => $menus,
            'kategoriList' => $kategoriList,
        ]);
    }

    /**
     * Memproses transaksi tunai dari kasir.
     *
     * Alur:
     * 1. Validasi stok dengan lockForUpdate() untuk atomicity.
     * 2. Buat record Order, OrderItem, dan Payment.
     * 3. Kurangi stok menu.
     * 4. Redirect dengan flash message berisi nominal kembalian.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function storeOrderTunai(Request $request)
    {
        if (!\Illuminate\Support\Facades\Cache::get('is_store_open', true)) {
            return response()->json(['message' => 'Maaf, sistem kasir dikunci karena toko berstatus tutup.'], 400);
        }

        $validated = $request->validate([
            'cart_items'            => ['required', 'array', 'min:1'],
            'cart_items.*.menu_id'  => ['required', 'exists:menus,id', 'distinct'],
            'cart_items.*.jumlah'   => ['required', 'integer', 'min:1'],
            'cart_items.*.subtotal' => ['required', 'numeric', 'min:0'],
            'total_harga'           => ['required', 'numeric', 'min:0'],
            'uang_diterima'         => ['required', 'numeric', 'min:0'],
            'metode_pembayaran'     => ['required', 'in:Tunai'],
            'tipe_pesanan'          => ['required', 'in:dine_in,take_away'],
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            // 1. Validasi stok & kalkulasi harga murni dari database
            $totalHarga = 0;
            $secureItems = [];

            foreach ($validated['cart_items'] as $item) {
                $menu = Menu::lockForUpdate()->find($item['menu_id']);
                if (!$menu || $menu->stok < $item['jumlah']) {
                    $namaMenu = $menu ? $menu->nama_menu : 'Tidak dikenal';
                    $sisaStok = $menu ? $menu->stok : 0;
                    throw ValidationException::withMessages([
                        'cart' => "Stok untuk menu '{$namaMenu}' tidak mencukupi (Tersisa: {$sisaStok})."
                    ]);
                }

                $subtotal = $menu->harga * $item['jumlah'];
                $totalHarga += $subtotal;

                $secureItems[] = [
                    'menu_id'  => $menu->id,
                    'jumlah'   => $item['jumlah'],
                    'subtotal' => $subtotal,
                ];
            }

            // Validasi uang kembalian tidak boleh kurang dari harga murni
            if ($validated['uang_diterima'] < $totalHarga) {
                throw ValidationException::withMessages([
                    'uang_diterima' => 'Uang yang diterima kurang dari total harga murni.'
                ]);
            }

            // 2. Buat record di tabel orders
            $order = Order::create([
                'user_id'         => $request->user()->id,
                'total_harga'     => $totalHarga,
                'status_pesanan'  => 'diproses', // Diubah menjadi diproses agar terlihat di dapur
                'tipe_pesanan'    => $validated['tipe_pesanan'],
                'tanggal_pesan'   => now(),
            ]);

            // 3. Buat record di tabel order_items & Kurangi stok
            foreach ($secureItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id'  => $item['menu_id'],
                    'jumlah'   => $item['jumlah'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Kurangi stok menu secara langsung di tabel menus
                Menu::where('id', $item['menu_id'])->decrement('stok', $item['jumlah']);
            }

            // 4. Buat record di tabel payments
            Payment::create([
                'order_id'           => $order->id,
                'metode_pembayaran'  => $validated['metode_pembayaran'],
                'status_pembayaran'  => 'lunas',
                'payment_token'      => null, // Tidak perlu payment token untuk tunai
                'transaction_id'     => null, // Tidak ada TXID gateway
                'payment_url'        => null,
            ]);

            return $order;
        });

        // Return redirect dengan flash message berisi nominal kembalian
        return redirect()
            ->route('kasir.pos.index')
            ->with('success', "Transaksi Tunai #$order->id Berhasil! Uang Kembalian: Rp " . number_format($validated['uang_diterima'] - $validated['total_harga'], 0, ',', '.'));
    }

    /**
     * Memproses transaksi digital (QRIS / Transfer Bank) dari kasir via Midtrans Snap.
     *
     * Alur:
     * 1. Validasi stok & kalkulasi ulang harga dari database (mencegah manipulasi).
     * 2. Simpan Order, OrderItem, Payment dalam DB::transaction.
     * 3. Generate Midtrans Snap Token.
     * 4. Kembalikan snap_token ke frontend sebagai JSON.
     *
     * Jika Midtrans gagal, seluruh order di-rollback dan stok dikembalikan.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeOrderDigital(Request $request)
    {
        if (!\Illuminate\Support\Facades\Cache::get('is_store_open', true)) {
            return response()->json(['message' => 'Maaf, sistem kasir dikunci karena toko berstatus tutup.'], 400);
        }

        $validated = $request->validate([
            'cart_items'            => ['required', 'array', 'min:1'],
            'cart_items.*.menu_id'  => ['required', 'exists:menus,id', 'distinct'],
            'cart_items.*.jumlah'   => ['required', 'integer', 'min:1'],
            'cart_items.*.subtotal' => ['required', 'numeric', 'min:0'],
            'total_harga'           => ['required', 'numeric', 'min:1'],
            // Terima nilai label dari frontend ('QRIS' atau 'Virtual Account')
            'metode_pembayaran'     => ['required', 'in:QRIS,Virtual Account'],
            'tipe_pesanan'          => ['required', 'in:dine_in,take_away'],
        ]);

        // ── MAPPING: Konversi label frontend → nilai ENUM database ────────────
        //
        //  ENUM di tabel payments: ['Tunai', 'QRIS', 'Transfer Bank', 'E-Wallet']
        //
        //  Frontend mengirim "Virtual Account" (label UI yang ramah pengguna),
        //  tapi database hanya mengenal "Transfer Bank".
        //  Mapping ini adalah satu-satunya tempat konversi agar konsisten.
        $metodePembayaranDb = match ($validated['metode_pembayaran']) {
            'Virtual Account' => 'Transfer Bank',
            'QRIS'            => 'QRIS',
            default           => $validated['metode_pembayaran'],
        };

        // ── Fase 1: Simpan pesanan ke database dalam satu transaksi ──────────
        $order = DB::transaction(function () use ($validated, $request, $metodePembayaranDb) {
            // Validasi stok & kalkulasi ulang harga murni dari database (SECURITY FIX)
            $totalHarga = 0;
            $secureItems = [];

            foreach ($validated['cart_items'] as $item) {
                $menu = Menu::lockForUpdate()->find($item['menu_id']);
                if (!$menu || $menu->stok < $item['jumlah']) {
                    $namaMenu = $menu ? $menu->nama_menu : 'Tidak dikenal';
                    $sisaStok = $menu ? $menu->stok : 0;
                    throw ValidationException::withMessages([
                        'cart' => "Stok untuk menu '{$namaMenu}' tidak mencukupi (Tersisa: {$sisaStok})."
                    ]);
                }

                $subtotal = $menu->harga * $item['jumlah'];
                $totalHarga += $subtotal;
                
                $secureItems[] = [
                    'menu_id'  => $menu->id,
                    'jumlah'   => $item['jumlah'],
                    'subtotal' => $subtotal,
                ];
            }

            // Buat record Order dengan status menunggu_pembayaran dan harga murni
            $order = Order::create([
                'user_id'        => $request->user()->id,
                'total_harga'    => $totalHarga,
                'status_pesanan' => 'menunggu_pembayaran',
                'tipe_pesanan'   => $validated['tipe_pesanan'],
                'tanggal_pesan'  => now(),
            ]);

            // Buat Order Items & Kurangi stok menggunakan secureItems
            foreach ($secureItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id'  => $item['menu_id'],
                    'jumlah'   => $item['jumlah'],
                    'subtotal' => $item['subtotal'],
                ]);
                Menu::where('id', $item['menu_id'])->decrement('stok', $item['jumlah']);
            }

            // Buat record Payment — gunakan $metodePembayaranDb (sudah di-mapping)
            Payment::create([
                'order_id'          => $order->id,
                'metode_pembayaran' => $metodePembayaranDb, // 'Transfer Bank' atau 'QRIS'
                'status_pembayaran' => 'pending',
                'payment_token'     => null,
                'transaction_id'    => null,
                'payment_url'       => null,
            ]);

            return $order;
        });

        // ── Fase 2: Generate Midtrans Snap Token ────────────────────────────
        \Midtrans\Config::$serverKey    = config('midtrans.server_key');
        \Midtrans\Config::$isProduction = config('midtrans.is_production');
        \Midtrans\Config::$isSanitized  = true;
        \Midtrans\Config::$is3ds        = true;

        // Susun item_details untuk Midtrans
        $itemDetails = [];
        foreach ($validated['cart_items'] as $item) {
            $menu = Menu::find($item['menu_id']);
            $itemDetails[] = [
                'id'       => (string) $item['menu_id'],
                'price'    => (int) ($item['subtotal'] / $item['jumlah']),
                'quantity' => (int) $item['jumlah'],
                'name'     => $menu ? substr($menu->nama_menu, 0, 50) : 'Menu #' . $item['menu_id'],
            ];
        }

        // Tentukan enabled_payments berdasarkan pilihan kasir
        $enabledPayments = $validated['metode_pembayaran'] === 'QRIS'
            ? ['gopay', 'shopeepay', 'other_qris']
            : ['bank_transfer', 'echannel', 'permata_va', 'bca_va', 'bni_va', 'bri_va'];

        // KASIR- prefix agar Webhook bisa membedakan order online vs offline
        $midtransOrderId = 'KASIR-' . $order->id . '-' . time();

        $params = [
            'transaction_details' => [
                'order_id'     => $midtransOrderId,
                'gross_amount' => (int) $order->total_harga,
            ],
            'customer_details' => [
                'first_name' => 'Pelanggan Kasir',
                'email'      => 'kasir@burjominang.id',
            ],
            'item_details'     => $itemDetails,
            'enabled_payments' => $enabledPayments,
            // Batas waktu pembayaran 3 menit untuk transaksi kasir (fast food)
            'custom_expiry'    => [
                'expiry_duration' => 3,
                'unit'            => 'minute',
            ],
        ];

        try {
            $snapTransaction = \Midtrans\Snap::createTransaction($params);
            $snapToken  = $snapTransaction->token;
            $paymentUrl = $snapTransaction->redirect_url;

            // Simpan token & transaction_id ke tabel payments
            $order->payment->update([
                'payment_token'  => $snapToken,
                'transaction_id' => $midtransOrderId,
                'payment_url'    => $paymentUrl,
            ]);

            // Kembalikan token ke frontend kasir sebagai JSON
            return response()->json([
                'snap_token' => $snapToken,
                'order_id'   => $order->id,
                'message'    => 'Snap token berhasil dibuat.',
            ]);

        } catch (\Exception $midtransError) {
            // Rollback order yang sudah dibuat karena Midtrans gagal
            DB::transaction(function () use ($order) {
                // Kembalikan stok
                foreach ($order->orderItems as $item) {
                    Menu::where('id', $item->menu_id)->increment('stok', $item->jumlah);
                }
                $order->payment()->delete();
                $order->orderItems()->delete();
                $order->delete();
            });

            Log::error('Midtrans POS Snap Creation Failed', [
                'error'    => $midtransError->getMessage(),
                'kasir_id' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Gagal menghubungi Payment Gateway: ' . $midtransError->getMessage(),
            ], 500);
        }
    }
}
