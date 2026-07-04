<?php

use App\Models\Menu;
use App\Models\Order;
use App\Models\Payment;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BlackBoxSupport;

uses(BlackBoxSupport::class);

/*
|--------------------------------------------------------------------------
| BB-07  Daftar Pesanan Kasir (GET /kasir/orders)
|--------------------------------------------------------------------------
| Catatan: Tidak ditemukan mekanisme polling/websocket pada frontend. Pembaruan
| daftar terjadi saat halaman dimuat ulang / dinavigasi. Uji ini memverifikasi
| endpoint mengembalikan data pesanan terkini dari database pada tiap request.
*/

test('BB-07 Kasir melihat daftar pesanan masuk hari ini', function () {
    $kasir = $this->kasir();
    $pelanggan = $this->pelanggan();

    $this->makeOrder($pelanggan, ['status_pesanan' => 'diproses', 'tipe_pesanan' => 'dine_in']);

    $response = $this->actingAs($kasir)->get('/kasir/orders');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Kasir/Orders/Index')
        ->has('pesanan_hari_ini.data', 1)
        ->where('pesanan_hari_ini.data.0.status_pesanan', 'diproses')
    );
});

test('BB-07 Daftar mencerminkan kondisi terkini database pada tiap request (basis reload)', function () {
    $kasir = $this->kasir();
    $pelanggan = $this->pelanggan();

    $this->makeOrder($pelanggan, ['status_pesanan' => 'diproses']);
    $this->actingAs($kasir)->get('/kasir/orders')
        ->assertInertia(fn (Assert $page) => $page->has('pesanan_hari_ini.data', 1));

    // Pesanan baru masuk → request berikutnya menampilkannya (tanpa realtime push)
    $this->makeOrder($pelanggan, ['status_pesanan' => 'diproses']);
    $this->actingAs($kasir)->get('/kasir/orders')
        ->assertInertia(fn (Assert $page) => $page->has('pesanan_hari_ini.data', 2));
});

/*
|--------------------------------------------------------------------------
| BB-08  Update Status Pesanan Kasir (PATCH /kasir/orders/{order}/status)
|--------------------------------------------------------------------------
*/

test('BB-08 Transisi sah: pesanan tunai diproses → selesai (payment jadi lunas)', function () {
    $kasir = $this->kasir();
    $order = $this->makeOrder(
        $this->pelanggan(),
        ['status_pesanan' => 'diproses', 'tipe_pesanan' => 'dine_in'],
        ['metode_pembayaran' => 'Tunai', 'status_pembayaran' => 'lunas']
    );

    $response = $this->actingAs($kasir)
        ->from('/kasir/orders')
        ->patch("/kasir/orders/{$order->id}/status", ['status_pesanan' => 'selesai']);

    $response->assertRedirect('/kasir/orders');
    $response->assertSessionHas('success');
    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status_pesanan' => 'selesai']);
});

test('BB-08 Transisi sah: pesanan tunai diproses → batal mengembalikan stok & payment gagal', function () {
    $kasir = $this->kasir();
    $menu  = $this->makeMenu(['stok' => 5]);
    $order = $this->makeOrder(
        $this->pelanggan(),
        ['status_pesanan' => 'diproses', 'tipe_pesanan' => 'dine_in'],
        ['metode_pembayaran' => 'Tunai', 'status_pembayaran' => 'lunas'],
        $menu,
        2
    );

    $this->actingAs($kasir)
        ->from('/kasir/orders')
        ->patch("/kasir/orders/{$order->id}/status", ['status_pesanan' => 'batal'])
        ->assertRedirect('/kasir/orders');

    $this->assertDatabaseHas('orders',   ['id' => $order->id, 'status_pesanan' => 'batal']);
    $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status_pembayaran' => 'gagal']);
    expect(Menu::find($menu->id)->stok)->toBe(7); // 5 + 2 restock
});

test('BB-08 Transisi tidak sah: pesanan lunas/selesai tidak dapat dikembalikan ke menunggu_pembayaran', function () {
    $kasir = $this->kasir();
    $order = $this->makeOrder(
        $this->pelanggan(),
        ['status_pesanan' => 'selesai', 'tipe_pesanan' => 'dine_in'],
        ['metode_pembayaran' => 'Tunai', 'status_pembayaran' => 'lunas']
    );

    $response = $this->actingAs($kasir)
        ->from('/kasir/orders')
        ->patch("/kasir/orders/{$order->id}/status", ['status_pesanan' => 'menunggu_pembayaran']);

    $response->assertSessionHas('error');
    // Status tidak berubah
    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status_pesanan' => 'selesai']);
});

test('BB-08 Transisi tidak sah: kasir dilarang mengubah pesanan digital yang masih menunggu_pembayaran', function () {
    $kasir = $this->kasir();
    $order = $this->makeOrder(
        $this->pelanggan(),
        ['status_pesanan' => 'menunggu_pembayaran', 'tipe_pesanan' => 'online'],
        ['metode_pembayaran' => 'QRIS', 'status_pembayaran' => 'pending']
    );

    $response = $this->actingAs($kasir)
        ->from('/kasir/orders')
        ->patch("/kasir/orders/{$order->id}/status", ['status_pesanan' => 'diproses']);

    $response->assertSessionHas('error');
    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status_pesanan' => 'menunggu_pembayaran']);
});

test('BB-08 Nilai status di luar enum ditolak validasi', function () {
    $kasir = $this->kasir();
    $order = $this->makeOrder($this->pelanggan(), ['status_pesanan' => 'diproses'], ['metode_pembayaran' => 'Tunai', 'status_pembayaran' => 'lunas']);

    $response = $this->actingAs($kasir)
        ->from('/kasir/orders')
        ->patch("/kasir/orders/{$order->id}/status", ['status_pesanan' => 'status_ngawur']);

    $response->assertSessionHasErrors('status_pesanan');
    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status_pesanan' => 'diproses']);
});
