<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Regresi Temuan T-1 — Dashboard Kasir memakai fungsi MySQL FIELD()
|--------------------------------------------------------------------------
| Bug: DashboardController cabang kasir memakai orderByRaw("FIELD(...)")
| yang (a) tidak portabel — SQLite melempar "no such function: FIELD" →
| HTTP 500, dan (b) memuat typo 'dibatalkan' (enum sebenarnya 'batal')
| sehingga di MySQL pun pesanan batal justru terurut paling atas.
| Perbaikan: CASE WHEN portabel dengan nilai enum yang benar.
| Test ini berjalan di SQLite — sebelum fix, request di bawah error 500.
*/

function makeKasirWithTodayOrders(): User
{
    $kasir = User::create([
        'name'     => 'Kasir T1',
        'email'    => 'kasir.t1@burjominang.test',
        'no_hp'    => '081211112222',
        'password' => bcrypt('password123'),
        'role'     => 'kasir',
    ]);

    // Sengaja dibuat dengan urutan insert acak; prioritas yang benar:
    // menunggu_pembayaran → diproses → selesai → batal
    foreach (['selesai', 'batal', 'menunggu_pembayaran', 'diproses'] as $status) {
        Order::create([
            'user_id'        => $kasir->id,
            'total_harga'    => 10000,
            'status_pesanan' => $status,
            'tipe_pesanan'   => 'dine_in',
            'tanggal_pesan'  => now(),
        ]);
    }

    return $kasir;
}

test('T-1: dashboard kasir tidak error 500 di SQLite (FIELD → CASE WHEN)', function () {
    $kasir = makeKasirWithTodayOrders();

    // Sebelum fix: SQLSTATE[HY000] no such function: FIELD → 500
    $this->actingAs($kasir)
        ->get('/kasir/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Kasir/Dashboard/DashboardPage')
            ->has('antrean_terbaru', 4)
        );
});

test('T-1: antrean diprioritaskan — butuh tindakan dulu, batal paling akhir', function () {
    $kasir = makeKasirWithTodayOrders();

    $this->actingAs($kasir)
        ->get('/kasir/dashboard')
        ->assertInertia(fn (Assert $page) => $page
            ->where('antrean_terbaru.0.status', 'menunggu_pembayaran')
            ->where('antrean_terbaru.1.status', 'diproses')
            ->where('antrean_terbaru.2.status', 'selesai')
            // Sebelum fix, typo 'dibatalkan' membuat 'batal' (FIELD=0) tampil PERTAMA
            ->where('antrean_terbaru.3.status', 'batal')
        );
});
