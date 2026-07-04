<?php

use App\Models\Menu;
use Tests\Support\BlackBoxSupport;

uses(BlackBoxSupport::class);

/*
|--------------------------------------------------------------------------
| BB-05  Webhook Pembayaran Otomatis (POST /api/payment-callback)
|--------------------------------------------------------------------------
| Catatan arsitektur: SDK Midtrans versi ini memverifikasi keaslian notifikasi
| dengan mengambil ulang status transaksi ke server Midtrans
| (Transaction::status), bukan dengan menghitung signature_key SHA512 secara
| lokal. Pada uji ini panggilan HTTP tersebut di-stub sehingga status transaksi
| dapat dikontrol secara deterministik. Field signature_key tetap disertakan
| pada payload agar menyerupai notifikasi asli Midtrans.
*/

function orderIdMidtrans(int $id): string
{
    return 'ORDER-'.$id.'-1780000000';
}

test('BB-05 settlement → payment lunas & order diproses', function () {
    $order = $this->makeOrder($this->pelanggan(), ['tipe_pesanan' => 'online', 'total_harga' => 45000]);
    $oid = orderIdMidtrans($order->id);

    $response = $this->sendMidtransWebhook([
        'order_id'           => $oid,
        'transaction_status' => 'settlement',
        'payment_type'       => 'qris',
        'fraud_status'       => 'accept',
        'status_code'        => '200',
        'gross_amount'       => '45000.00',
        'signature_key'      => $this->midtransSignature($oid, '200', '45000.00'),
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('orders',   ['id' => $order->id, 'status_pesanan' => 'diproses']);
    $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status_pembayaran' => 'lunas']);
});

test('BB-05 capture (credit_card, accept) → payment lunas & order diproses', function () {
    $order = $this->makeOrder($this->pelanggan(), ['tipe_pesanan' => 'online']);
    $oid = orderIdMidtrans($order->id);

    $response = $this->sendMidtransWebhook([
        'order_id'           => $oid,
        'transaction_status' => 'capture',
        'payment_type'       => 'credit_card',
        'fraud_status'       => 'accept',
        'status_code'        => '200',
        'gross_amount'       => '10000.00',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('orders',   ['id' => $order->id, 'status_pesanan' => 'diproses']);
    $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status_pembayaran' => 'lunas']);
});

test('BB-05 pending → payment tetap pending & order tetap menunggu_pembayaran', function () {
    $order = $this->makeOrder($this->pelanggan(), ['tipe_pesanan' => 'online']);
    $oid = orderIdMidtrans($order->id);

    $response = $this->sendMidtransWebhook([
        'order_id'           => $oid,
        'transaction_status' => 'pending',
        'payment_type'       => 'qris',
        'status_code'        => '201',
        'gross_amount'       => '10000.00',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('orders',   ['id' => $order->id, 'status_pesanan' => 'menunggu_pembayaran']);
    $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status_pembayaran' => 'pending']);
});

dataset('status_gagal', ['expire', 'deny', 'cancel']);

test('BB-05 expire/deny/cancel → payment gagal, order batal, dan stok dikembalikan', function (string $status) {
    $pelanggan = $this->pelanggan();
    $menu  = $this->makeMenu(['stok' => 8]);
    // Order dengan 2 item; stok saat ini 8 (seolah sudah dikurangi saat checkout)
    $order = $this->makeOrder($pelanggan, ['tipe_pesanan' => 'online'], [], $menu, 2);
    $oid = orderIdMidtrans($order->id);

    $response = $this->sendMidtransWebhook([
        'order_id'           => $oid,
        'transaction_status' => $status,
        'payment_type'       => 'qris',
        'status_code'        => '202',
        'gross_amount'       => '20000.00',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('orders',   ['id' => $order->id, 'status_pesanan' => 'batal']);
    $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status_pembayaran' => 'gagal']);
    // Restock: 8 + 2 = 10
    expect(Menu::find($menu->id)->stok)->toBe(10);
})->with('status_gagal');

test('BB-05 notifikasi tidak dapat diverifikasi ke Midtrans (transaksi invalid) ditolak HTTP 400', function () {
    $order = $this->makeOrder($this->pelanggan(), ['tipe_pesanan' => 'online']);

    // Midtrans membalas bahwa transaksi tidak ada (status_code 404) → SDK melempar
    // exception → controller menolak dengan 400. Ini analog "signature salah".
    $response = $this->sendMidtransWebhook([
        'order_id'           => orderIdMidtrans($order->id),
        'transaction_status' => 'settlement',
        'status_code'        => '404',
        'status_message'     => "Transaction doesn't exist.",
    ]);

    $response->assertStatus(400);
    // Status pesanan & pembayaran TIDAK berubah
    $this->assertDatabaseHas('orders',   ['id' => $order->id, 'status_pesanan' => 'menunggu_pembayaran']);
    $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status_pembayaran' => 'pending']);
});

test('BB-05 order sudah final (selesai) → webhook diabaikan tanpa mengubah status', function () {
    $order = $this->makeOrder($this->pelanggan(), ['status_pesanan' => 'selesai', 'tipe_pesanan' => 'online'], ['status_pembayaran' => 'lunas']);

    $response = $this->sendMidtransWebhook([
        'order_id'           => orderIdMidtrans($order->id),
        'transaction_status' => 'expire',
        'payment_type'       => 'qris',
        'status_code'        => '202',
        'gross_amount'       => '10000.00',
    ]);

    $response->assertOk();
    // Guard state-machine: tetap selesai/lunas
    $this->assertDatabaseHas('orders',   ['id' => $order->id, 'status_pesanan' => 'selesai']);
    $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status_pembayaran' => 'lunas']);
});

test('BB-05 order_id tidak ditemukan di database ditolak HTTP 404', function () {
    $response = $this->sendMidtransWebhook([
        'order_id'           => 'ORDER-999999-1780000000',
        'transaction_status' => 'settlement',
        'payment_type'       => 'qris',
        'status_code'        => '200',
        'gross_amount'       => '10000.00',
    ]);

    $response->assertStatus(404);
});
