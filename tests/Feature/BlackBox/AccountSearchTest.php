<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| PENY-1 / D-13 — Fitur Mencari Akun (Owner)
|--------------------------------------------------------------------------
| Fitur ini semula TIDAK diimplementasikan (temuan PENY-1). Implementasi:
| AccountController@index kini menerima parameter `search` dan memfilter
| berdasarkan name / email / no_hp; frontend menambah input pencarian
| debounced (pola sama dengan Cari Menu kasir).
*/

function seedAccountsForSearch(): User
{
    $owner = User::create([
        'name'     => 'Owner Pencarian',
        'email'    => 'owner.search@burjominang.test',
        'no_hp'    => '081200001111',
        'password' => bcrypt('password123'),
        'role'     => 'owner',
    ]);

    User::create([
        'name'     => 'Kasir Andi',
        'email'    => 'andi@burjominang.test',
        'no_hp'    => '081233334444',
        'password' => bcrypt('password123'),
        'role'     => 'kasir',
    ]);

    User::create([
        'name'     => 'Pelanggan Budi',
        'email'    => 'budi@pelanggan.test',
        'no_hp'    => '081255556666',
        'password' => bcrypt('password123'),
        'role'     => 'pelanggan',
    ]);

    return $owner;
}

test('D-13: pencarian akun berdasarkan nama menemukan akun yang cocok', function () {
    $owner = seedAccountsForSearch();

    $this->actingAs($owner)
        ->get('/owner/accounts?search=Andi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Accounts/Index')
            ->has('users', 1)
            ->where('users.0.name', 'Kasir Andi')
            ->where('filters.search', 'Andi')
        );
});

test('D-13: pencarian berdasarkan email & no_hp juga bekerja', function () {
    $owner = seedAccountsForSearch();

    // via email
    $this->actingAs($owner)
        ->get('/owner/accounts?search=budi@pelanggan')
        ->assertInertia(fn (Assert $page) => $page
            ->has('users', 1)
            ->where('users.0.name', 'Pelanggan Budi')
        );

    // via no_hp
    $this->actingAs($owner)
        ->get('/owner/accounts?search=081233334444')
        ->assertInertia(fn (Assert $page) => $page
            ->has('users', 1)
            ->where('users.0.name', 'Kasir Andi')
        );
});

test('D-13 (negatif): kata kunci tidak ditemukan mengembalikan daftar kosong', function () {
    $owner = seedAccountsForSearch();

    $this->actingAs($owner)
        ->get('/owner/accounts?search=ZZZ999TidakAda')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('users', 0)
            ->where('filters.search', 'ZZZ999TidakAda')
        );
});

test('D-13 (keamanan): pencarian tidak membocorkan akun owner', function () {
    $owner = seedAccountsForSearch();

    // Kata kunci sengaja cocok dengan nama/email owner — grouping closure
    // pada orWhere harus tetap menahan filter role kasir/pelanggan
    $this->actingAs($owner)
        ->get('/owner/accounts?search=Owner')
        ->assertInertia(fn (Assert $page) => $page->has('users', 0));

    $this->actingAs($owner)
        ->get('/owner/accounts?search=owner.search@burjominang.test')
        ->assertInertia(fn (Assert $page) => $page->has('users', 0));
});
