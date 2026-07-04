<?php

use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BlackBoxSupport;

uses(BlackBoxSupport::class);

/*
|--------------------------------------------------------------------------
| BB-06  Status & Riwayat Pesanan Pelanggan (GET /customer/orders)
|--------------------------------------------------------------------------
*/

test('BB-06 Pelanggan hanya melihat pesanannya sendiri beserta status terkini (tab aktif)', function () {
    $pelanggan = $this->pelanggan();
    $orang_lain = $this->pelanggan();

    // 2 pesanan aktif milik pelanggan (tanggal berbeda agar urutan deterministik)
    $o1 = $this->makeOrder($pelanggan, ['status_pesanan' => 'menunggu_pembayaran', 'tanggal_pesan' => now()->subMinutes(2)]);
    $o2 = $this->makeOrder($pelanggan, ['status_pesanan' => 'diproses', 'tanggal_pesan' => now()->subMinute()]);
    // 1 pesanan milik pelanggan lain (tidak boleh muncul)
    $this->makeOrder($orang_lain, ['status_pesanan' => 'diproses']);

    $response = $this->actingAs($pelanggan)->get('/customer/orders?tab=aktif');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Customer/Orders')
        ->where('tab', 'aktif')
        ->has('orders', 2) // hanya 2 pesanan milik pelanggan
        ->where('orders.0.status_pesanan', 'diproses')      // latest lebih dulu
        ->where('orders.1.status_pesanan', 'menunggu_pembayaran')
    );
});

test('BB-06 Tab riwayat menampilkan pesanan selesai/batal milik pelanggan', function () {
    $pelanggan = $this->pelanggan();
    $this->makeOrder($pelanggan, ['status_pesanan' => 'selesai']);
    $this->makeOrder($pelanggan, ['status_pesanan' => 'diproses']); // aktif, tidak muncul di riwayat

    $response = $this->actingAs($pelanggan)->get('/customer/orders?tab=riwayat');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Customer/Orders')
        ->where('tab', 'riwayat')
        ->has('orders', 1)
        ->where('orders.0.status_pesanan', 'selesai')
    );
});
