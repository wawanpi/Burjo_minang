<?php

use App\Models\User;
use Tests\Support\BlackBoxSupport;

uses(BlackBoxSupport::class);

/*
|--------------------------------------------------------------------------
| BB-01  Registrasi Pelanggan
|--------------------------------------------------------------------------
*/

test('BB-01 Registrasi dengan data valid menyimpan user pelanggan dan otomatis login', function () {
    $response = $this->post('/register', [
        'name'                  => 'Budi Pelanggan',
        'email'                 => 'budi@example.com',
        'no_hp'                 => '081234567890',
        'password'              => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    // Registrasi berhasil → redirect ke root (302) & sesi terautentikasi
    $response->assertRedirect('/');
    $this->assertAuthenticated();

    $this->assertDatabaseHas('users', [
        'email' => 'budi@example.com',
        'name'  => 'Budi Pelanggan',
        'role'  => 'pelanggan', // default enum
    ]);
});

test('BB-01 Registrasi dengan data invalid ditolak dengan error validasi', function () {
    $response = $this->from('/register')->post('/register', [
        'name'                  => '',
        'email'                 => 'bukan-email',
        'no_hp'                 => '12345',       // gagal regex nomor HP Indonesia
        'password'              => 'abc',          // gagal aturan kekuatan (hanya 1 kriteria)
        'password_confirmation' => 'xyz',          // tidak cocok
    ]);

    $response->assertSessionHasErrors(['name', 'email', 'no_hp', 'password']);
    $this->assertGuest();
    expect(User::count())->toBe(0);
});

/*
|--------------------------------------------------------------------------
| BB-02  Login Sesuai Peran
|--------------------------------------------------------------------------
*/

dataset('kredensial_peran', [
    'owner'     => ['owner', '/owner/dashboard'],
    'kasir'     => ['kasir', '/kasir/dashboard'],
    'pelanggan' => ['pelanggan', '/customer/menu'],
]);

test('BB-02 Login kredensial benar mengarahkan sesuai peran', function (string $role, string $tujuan) {
    $user = User::factory()->create([
        'role'     => $role,
        'password' => bcrypt('password123'),
    ]);

    $response = $this->post('/login', [
        'email'    => $user->email,
        'password' => 'password123',
    ]);

    $response->assertRedirect($tujuan);
    $this->assertAuthenticatedAs($user);
})->with('kredensial_peran');

test('BB-02 Login kredensial salah gagal dan tetap tamu', function () {
    $user = User::factory()->create(['password' => bcrypt('password123')]);

    $response = $this->from('/login')->post('/login', [
        'email'    => $user->email,
        'password' => 'password-salah',
    ]);

    $response->assertSessionHasErrors('email'); // trans('auth.failed')
    $this->assertGuest();
});
