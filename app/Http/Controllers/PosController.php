<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
}
