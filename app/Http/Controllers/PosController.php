<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PosController extends Controller
{
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

        return Inertia::render('Pos/Index', [
            'menus'        => $menus,
            'kategoriList' => $kategoriList,
        ]);
    }

    public function storeOrderTunai(Request $request)
    {
        $validated = $request->validate([
            'cart_items'            => ['required', 'array', 'min:1'],
            'cart_items.*.menu_id'  => ['required', 'exists:menus,id'],
            'cart_items.*.jumlah'   => ['required', 'integer', 'min:1'],
            'cart_items.*.subtotal' => ['required', 'numeric', 'min:0'],
            'total_harga'           => ['required', 'numeric', 'min:0'],
            'uang_diterima'         => ['required', 'numeric', 'min:' . $request->input('total_harga', 0)],
            'metode_pembayaran'     => ['required', 'in:Tunai'],
            'tipe_pesanan'          => ['required', 'in:dine_in,take_away'],
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            // 1. Validasi stok menu yang dipesan (Memastikan stok cukup di database)
            foreach ($validated['cart_items'] as $item) {
                $menu = Menu::lockForUpdate()->find($item['menu_id']);
                if (!$menu || $menu->stok < $item['jumlah']) {
                    throw ValidationException::withMessages([
                        'cart' => "Stok untuk menu '{$menu->nama_menu}' tidak mencukupi (Tersisa: {$menu->stok})."
                    ]);
                }
            }

            // 2. Buat record di tabel orders
            $order = Order::create([
                'user_id'         => $request->user()->id,
                'total_harga'     => $validated['total_harga'],
                'status_pesanan'  => 'diproses', // Diubah menjadi diproses agar terlihat di dapur
                'tipe_pesanan'    => $validated['tipe_pesanan'],
                'tanggal_pesan'   => now(),
            ]);

            // 3. Buat record di tabel order_items & Kurangi stok (Langkah 5)
            foreach ($validated['cart_items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id'  => $item['menu_id'],
                    'jumlah'   => $item['jumlah'],
                    'subtotal' => $item['subtotal'],
                ]);

                // 5. Kurangi stok menu secara langsung di tabel menus
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

        // 6. Return Inertia redirect ke halaman riwayat pesanan (pos.index) dengan flash message
        return redirect()
            ->route('kasir.pos.index') // Asumsi route name untuk POS
            ->with('success', "Transaksi Tunai #$order->id Berhasil! Uang Kembalian: Rp " . number_format($validated['uang_diterima'] - $validated['total_harga'], 0, ',', '.'));
    }

    /**
     * Proses checkout QRIS / Virtual Account Midtrans dari Kasir (POS Digital)
     * Mengembalikan JSON { snap_token, order_id } ke frontend React.
     */
    public function storeOrderDigital(Request $request)
    {
        $validated = $request->validate([
            'cart_items'            => ['required', 'array', 'min:1'],
            'cart_items.*.menu_id'  => ['required', 'exists:menus,id'],
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
                'metode_pembayaran' => $metodePembayaranDb, // ✅ 'Transfer Bank' atau 'QRIS'
                'status_pembayaran' => 'pending',
                'payment_token'     => null,
                'transaction_id'    => null,
                'payment_url'       => null,
            ]);

            return $order;
        });

        // ── Fase 2: Generate Midtrans Snap Token ────────────────────────────
        \Midtrans\Config::$serverKey    = env('MIDTRANS_SERVER_KEY');
        \Midtrans\Config::$isProduction = env('MIDTRANS_IS_PRODUCTION', false);
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
