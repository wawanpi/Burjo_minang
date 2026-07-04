<?php

use App\Models\Review;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BlackBoxSupport;

uses(BlackBoxSupport::class);

/*
|--------------------------------------------------------------------------
| BB-10  Laporan Keuangan & Kelola Akun Pemilik
|--------------------------------------------------------------------------
*/

test('BB-10 Laporan keuangan menjumlahkan hanya transaksi lunas+selesai dengan total benar', function () {
    $owner = $this->owner();
    $pelanggan = $this->pelanggan();

    // Dihitung (lunas + selesai)
    $this->makeOrder($pelanggan, ['status_pesanan' => 'selesai', 'total_harga' => 50000], ['status_pembayaran' => 'lunas']);
    $this->makeOrder($pelanggan, ['status_pesanan' => 'selesai', 'total_harga' => 30000], ['status_pembayaran' => 'lunas']);
    // TIDAK dihitung: selesai tapi belum lunas
    $this->makeOrder($pelanggan, ['status_pesanan' => 'selesai', 'total_harga' => 99000], ['status_pembayaran' => 'pending']);
    // TIDAK dihitung: lunas tapi belum selesai
    $this->makeOrder($pelanggan, ['status_pesanan' => 'diproses', 'total_harga' => 77000], ['status_pembayaran' => 'lunas']);
    // TIDAK dihitung: batal
    $this->makeOrder($pelanggan, ['status_pesanan' => 'batal', 'total_harga' => 25000], ['status_pembayaran' => 'gagal']);

    // Ekspektasi manual: 50000 + 30000 = 80000
    $expected = 80000.0;

    $response = $this->actingAs($owner)->get('/owner/laporan?tab=keuangan');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Owner/Laporan/Index')
        ->where('tab', 'keuangan')
        ->has('orders.data', 2) // hanya 2 order lunas+selesai
        ->where('ringkasan.total_pendapatan', fn ($v) => (float) $v === $expected)
    );
});

test('BB-10 Pemilik dapat menambah akun kasir', function () {
    $owner = $this->owner();

    $response = $this->actingAs($owner)->post('/owner/accounts', [
        'name'                  => 'Kasir Baru',
        'email'                 => 'kasirbaru@burjominang.com',
        'no_hp'                 => '081234567891',
        'password'              => 'password123',
        'password_confirmation' => 'password123',
        'role'                  => 'kasir',
    ]);

    $response->assertRedirect(route('owner.accounts.index'));
    $this->assertDatabaseHas('users', [
        'email' => 'kasirbaru@burjominang.com',
        'name'  => 'Kasir Baru',
        'role'  => 'kasir',
    ]);
});

test('BB-10 Pemilik dapat memperbarui akun kasir', function () {
    $owner = $this->owner();
    $akun  = $this->kasir(['name' => 'Kasir Lama', 'no_hp' => '081200000001']);

    $response = $this->actingAs($owner)->put("/owner/accounts/{$akun->id}", [
        'name'  => 'Kasir Direvisi',
        'email' => $akun->email,
        'no_hp' => '081200000002',
        'role'  => 'kasir',
    ]);

    $response->assertRedirect(route('owner.accounts.index'));
    $this->assertDatabaseHas('users', ['id' => $akun->id, 'name' => 'Kasir Direvisi']);
});

test('BB-10 Pemilik dapat melihat ulasan pelanggan', function () {
    $owner = $this->owner();
    $pelanggan = $this->pelanggan();
    $menu = $this->makeMenu(['nama_menu' => 'Rendang Spesial']);

    Review::create([
        'user_id'        => $pelanggan->id,
        'menu_id'        => $menu->id,
        'rating'         => 5,
        'komentar'       => 'Sangat enak!',
        'tanggal_ulasan' => now(),
    ]);

    $response = $this->actingAs($owner)->get('/owner/reviews');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Owner/Reviews/Index')
        ->has('reviews', 1)
        ->where('reviews.0.rating', 5)
    );
});

/*
|--------------------------------------------------------------------------
| BB-10  Otorisasi Peran — kasir TIDAK boleh mengakses endpoint pemilik
|--------------------------------------------------------------------------
*/

test('BB-10 Kasir dialihkan (ditolak) saat mengakses laporan keuangan pemilik', function () {
    $kasir = $this->kasir();

    $response = $this->actingAs($kasir)->get('/owner/laporan');

    // Middleware role:owner mengalihkan kasir ke dashboard-nya, BUKAN halaman owner
    $response->assertRedirect(route('kasir.dashboard'));
    $response->assertSessionHas('error');
});

test('BB-10 Kasir tidak dapat menambah akun via endpoint pemilik', function () {
    $kasir = $this->kasir();

    $response = $this->actingAs($kasir)->post('/owner/accounts', [
        'name'                  => 'Sisipan',
        'email'                 => 'sisipan@x.com',
        'no_hp'                 => '081299999999',
        'password'              => 'password123',
        'password_confirmation' => 'password123',
        'role'                  => 'kasir',
    ]);

    $response->assertRedirect(route('kasir.dashboard'));
    $this->assertDatabaseMissing('users', ['email' => 'sisipan@x.com']);
});

test('BB-10 Pelanggan juga ditolak mengakses endpoint pemilik', function () {
    $pelanggan = $this->pelanggan();

    $this->actingAs($pelanggan)->get('/owner/laporan')
        ->assertRedirect(route('customer.menu'));
});

test('BB-10 Tamu (belum login) dialihkan ke halaman login', function () {
    $this->get('/owner/laporan')->assertRedirect('/login');
});
