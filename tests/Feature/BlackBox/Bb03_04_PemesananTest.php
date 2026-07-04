<?php

use App\Models\Menu;
use App\Models\Order;
use Tests\Support\BlackBoxSupport;

uses(BlackBoxSupport::class);

/*
|--------------------------------------------------------------------------
| BB-03  Pemesanan Mandiri (Pelanggan)
|--------------------------------------------------------------------------
*/

test('BB-03 Checkout dine-in menyimpan order + order_items dengan status & total benar', function () {
    $pelanggan = $this->pelanggan();
    $menuA = $this->makeMenu(['nama_menu' => 'Nasi Rendang', 'harga' => 20000, 'stok' => 10]);
    $menuB = $this->makeMenu(['nama_menu' => 'Es Teh',      'harga' => 5000,  'stok' => 10]);

    $this->fakeMidtransSnap();

    $response = $this->actingAs($pelanggan)->postJson('/customer/menu/checkout', [
        'items' => [
            ['menu_id' => $menuA->id, 'jumlah' => 2, 'harga' => 20000],
            ['menu_id' => $menuB->id, 'jumlah' => 1, 'harga' => 5000],
        ],
        'tipe_pesanan'      => 'dine_in',
        'jumlah_orang'      => 3,
        'metode_pembayaran' => 'QRIS',
    ]);

    $response->assertOk();

    $order = Order::latest('id')->first();
    expect($order)->not->toBeNull();
    expect($order->status_pesanan)->toBe('menunggu_pembayaran');
    expect($order->tipe_pesanan)->toBe('dine_in');
    expect($order->jumlah_orang)->toBe(3);
    expect((float) $order->total_harga)->toBe(45000.0); // 2*20000 + 1*5000

    // order_items tersimpan sesuai keranjang
    $this->assertDatabaseHas('order_items', ['order_id' => $order->id, 'menu_id' => $menuA->id, 'jumlah' => 2, 'subtotal' => 40000]);
    $this->assertDatabaseHas('order_items', ['order_id' => $order->id, 'menu_id' => $menuB->id, 'jumlah' => 1, 'subtotal' => 5000]);
    expect($order->orderItems()->count())->toBe(2);

    // Stok berkurang sesuai jumlah pesanan
    expect(Menu::find($menuA->id)->stok)->toBe(8);
    expect(Menu::find($menuB->id)->stok)->toBe(9);
});

test('BB-03 Checkout take-away (pre-order) menyimpan waktu_pengambilan dan tanpa jumlah_orang', function () {
    $pelanggan = $this->pelanggan();
    $menu = $this->makeMenu(['harga' => 15000, 'stok' => 10]);
    $this->fakeMidtransSnap();

    $waktu = now()->addHours(2)->format('Y-m-d H:i:s');

    $response = $this->actingAs($pelanggan)->postJson('/customer/menu/checkout', [
        'items'             => [['menu_id' => $menu->id, 'jumlah' => 1, 'harga' => 15000]],
        'tipe_pesanan'      => 'take_away',
        'waktu_pengambilan' => $waktu,
        'metode_pembayaran' => 'Transfer Bank',
    ]);

    $response->assertOk();

    $order = Order::latest('id')->first();
    expect($order->tipe_pesanan)->toBe('take_away');
    expect($order->jumlah_orang)->toBeNull();
    expect($order->waktu_pengambilan)->not->toBeNull();
});

/*
|--------------------------------------------------------------------------
| BB-04  Inisiasi Pembayaran Midtrans
|--------------------------------------------------------------------------
*/

test('BB-04 Konfirmasi pesanan membentuk transaksi Snap dan record payment status pending', function () {
    $pelanggan = $this->pelanggan();
    $menu = $this->makeMenu(['harga' => 12000, 'stok' => 10]);

    $this->fakeMidtransSnap('snap-token-BB04', 'https://app.sandbox.midtrans.com/snap/v2/vtweb/BB04');

    $response = $this->actingAs($pelanggan)->postJson('/customer/menu/checkout', [
        'items'             => [['menu_id' => $menu->id, 'jumlah' => 1, 'harga' => 12000]],
        'tipe_pesanan'      => 'dine_in',
        'jumlah_orang'      => 1,
        'metode_pembayaran' => 'QRIS',
    ]);

    // Snap token dikembalikan ke frontend
    $response->assertOk()->assertJsonStructure(['snap_token', 'order_id']);
    expect($response->json('snap_token'))->toBe('snap-token-BB04');

    $order = Order::find($response->json('order_id'));

    // Record payment awal berstatus 'pending' & terisi data transaksi Midtrans
    $this->assertDatabaseHas('payments', [
        'order_id'          => $order->id,
        'metode_pembayaran' => 'QRIS',
        'status_pembayaran' => 'pending',
        'payment_token'     => 'snap-token-BB04',
    ]);

    // transaction_id mengikuti format 'ORDER-{id}-...'
    expect($order->payment->transaction_id)->toStartWith('ORDER-'.$order->id.'-');
    expect($order->payment->payment_url)->toBe('https://app.sandbox.midtrans.com/snap/v2/vtweb/BB04');
});
