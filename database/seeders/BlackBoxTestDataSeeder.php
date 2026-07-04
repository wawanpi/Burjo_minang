<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeder data uji Black Box (non-produksi).
 * Membuat menu baseline + beberapa pesanan representatif milik pelanggan
 * agar skenario Daftar Pesanan, Riwayat, Ulasan, dan Laporan punya data.
 */
class BlackBoxTestDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Menu baseline ─────────────────────────────────────────────
        $menus = [
            ['nama_menu' => 'Nasi Telur',   'kategori' => 'Makanan', 'harga' => 12000, 'stok' => 50],
            ['nama_menu' => 'Nasi Ayam',    'kategori' => 'Makanan', 'harga' => 18000, 'stok' => 40],
            ['nama_menu' => 'Mie Rebus',    'kategori' => 'Makanan', 'harga' => 15000, 'stok' => 30],
            ['nama_menu' => 'Es Teh',       'kategori' => 'Minuman', 'harga' => 5000,  'stok' => 100],
            ['nama_menu' => 'Es Jeruk',     'kategori' => 'Minuman', 'harga' => 6000,  'stok' => 80],
            ['nama_menu' => 'Kopi Hitam',   'kategori' => 'Minuman', 'harga' => 8000,  'stok' => 60],
        ];
        foreach ($menus as $m) {
            Menu::firstOrCreate(['nama_menu' => $m['nama_menu']], $m);
        }

        $nasiTelur = Menu::where('nama_menu', 'Nasi Telur')->first();
        $nasiAyam  = Menu::where('nama_menu', 'Nasi Ayam')->first();
        $esTeh     = Menu::where('nama_menu', 'Es Teh')->first();

        $pelanggan = User::where('email', 'pelanggan@gmail.com')->first();
        if (!$pelanggan) {
            return;
        }

        // ── Order A: SELESAI (untuk Riwayat, Ulasan positif, Laporan keuangan) ──
        $orderA = Order::create([
            'user_id'        => $pelanggan->id,
            'total_harga'    => 24000,
            'status_pesanan' => 'selesai',
            'tipe_pesanan'   => 'dine_in',
            'jumlah_orang'   => 2,
            'tanggal_pesan'  => now(),
        ]);
        OrderItem::create(['order_id' => $orderA->id, 'menu_id' => $nasiTelur->id, 'jumlah' => 2, 'subtotal' => 24000]);
        Payment::create(['order_id' => $orderA->id, 'metode_pembayaran' => 'QRIS', 'status_pembayaran' => 'lunas', 'transaction_id' => 'ORDER-'.$orderA->id.'-'.time()]);

        // ── Order B: DIPROSES (untuk tab Aktif, Ulasan negatif belum selesai) ──
        $orderB = Order::create([
            'user_id'        => $pelanggan->id,
            'total_harga'    => 18000,
            'status_pesanan' => 'diproses',
            'tipe_pesanan'   => 'dine_in',
            'jumlah_orang'   => 1,
            'tanggal_pesan'  => now(),
        ]);
        OrderItem::create(['order_id' => $orderB->id, 'menu_id' => $nasiAyam->id, 'jumlah' => 1, 'subtotal' => 18000]);
        Payment::create(['order_id' => $orderB->id, 'metode_pembayaran' => 'QRIS', 'status_pembayaran' => 'lunas', 'transaction_id' => 'ORDER-'.$orderB->id.'-'.time()]);

        // ── Order C: MENUNGGU_PEMBAYARAN (untuk tab Aktif & daftar kasir) ──
        $orderC = Order::create([
            'user_id'           => $pelanggan->id,
            'total_harga'       => 5000,
            'status_pesanan'    => 'menunggu_pembayaran',
            'tipe_pesanan'      => 'take_away',
            'waktu_pengambilan' => now()->addHours(2),
            'tanggal_pesan'     => now(),
        ]);
        OrderItem::create(['order_id' => $orderC->id, 'menu_id' => $esTeh->id, 'jumlah' => 1, 'subtotal' => 5000]);
        Payment::create(['order_id' => $orderC->id, 'metode_pembayaran' => 'QRIS', 'status_pembayaran' => 'pending', 'transaction_id' => 'ORDER-'.$orderC->id.'-'.time(), 'payment_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/dummy']);
    }
}
