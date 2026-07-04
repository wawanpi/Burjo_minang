<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Regresi Temuan T-2 — Ubah Akun gagal karena no_hp tidak ter-prefill
|--------------------------------------------------------------------------
| Bug: AccountController@index tidak menyertakan kolom `no_hp` pada payload
| ke frontend, sehingga field Nomor HP (required) pada modal edit kosong dan
| submit terblokir validasi HTML5. Perbaikan: tambahkan 'no_hp' ke get([...]).
| Test ini memverifikasi bahwa daftar akun kini MEMBAWA no_hp yang benar,
| dan update yang mempertahankan no_hp tersebut berhasil.
*/

function makeOwnerAndKasir(): array
{
    $owner = User::create([
        'name'     => 'Owner Uji',
        'email'    => 'owner.t2@burjominang.test',
        'no_hp'    => '081200000000',
        'password' => bcrypt('password123'),
        'role'     => 'owner',
    ]);

    $kasir = User::create([
        'name'     => 'Kasir Uji',
        'email'    => 'kasir.t2@burjominang.test',
        'no_hp'    => '081298765432',
        'password' => bcrypt('password123'),
        'role'     => 'kasir',
    ]);

    return [$owner, $kasir];
}

test('T-2: daftar akun menyertakan no_hp (agar modal edit bisa prefill)', function () {
    [$owner, $kasir] = makeOwnerAndKasir();

    $response = $this->actingAs($owner)->get('/owner/accounts');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Owner/Accounts/Index')
        ->has('users', 1) // owner tidak termasuk; hanya kasir/pelanggan
        ->where('users.0.name', 'Kasir Uji')
        // Inti perbaikan: field no_hp HARUS ada dan benar (sebelum fix: absen)
        ->where('users.0.no_hp', '081298765432')
    );
});

test('T-2: ubah akun (ganti nama, no_hp dipertahankan) berhasil tersimpan', function () {
    [$owner, $kasir] = makeOwnerAndKasir();

    // Simulasikan submit modal edit: hanya nama berubah, no_hp = nilai prefill
    $response = $this->actingAs($owner)->put("/owner/accounts/{$kasir->id}", [
        'name'  => 'Kasir Uji Diperbarui',
        'email' => $kasir->email,
        'no_hp' => $kasir->no_hp, // kini ter-prefill dari daftar akun
        'role'  => 'kasir',
    ]);

    $response->assertRedirect(route('owner.accounts.index'));
    $this->assertDatabaseHas('users', [
        'id'    => $kasir->id,
        'name'  => 'Kasir Uji Diperbarui',
        'no_hp' => '081298765432',
    ]);
});
