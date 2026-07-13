<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Gunakan firstOrCreate agar idempotent: aman dijalankan berulang
        // (mis. otomatis tiap deploy) tanpa error duplikat email.

        // 1. Buat akun Owner
        User::firstOrCreate(
            ['email' => 'owner@burjominang.com'],
            [
                'name'              => 'Owner Burjo Minang',
                'password'          => Hash::make('password123'),
                'role'              => 'owner',
                'email_verified_at' => now(),
            ]
        );

        // 2. Buat akun kasir
        User::firstOrCreate(
            ['email' => 'kasir@burjominang.com'],
            [
                'name'              => 'kasir Satu',
                'password'          => Hash::make('password123'),
                'role'              => 'kasir',
                'email_verified_at' => now(),
            ]
        );

        // 3. Buat akun Pelanggan
        User::firstOrCreate(
            ['email' => 'pelanggan@gmail.com'],
            [
                'name'              => 'Pelanggan Setia',
                'password'          => Hash::make('password123'),
                'role'              => 'pelanggan',
                'email_verified_at' => now(),
            ]
        );

        // Pastikan akun default SELALU terverifikasi — termasuk yang sudah
        // terlanjur dibuat sebelum fitur verifikasi email diaktifkan
        // (firstOrCreate tidak meng-update baris yang sudah ada).
        User::whereIn('email', [
            'owner@burjominang.com',
            'kasir@burjominang.com',
            'pelanggan@gmail.com',
        ])->whereNull('email_verified_at')->update(['email_verified_at' => now()]);

        // Seed daftar menu awal (idempotent — aman dipanggil tiap deploy)
        $this->call(MenuSeeder::class);

        // ── SEEDER DUMMY: SENGAJA TIDAK DIPANGGIL DI JALUR PRODUCTION ──
        // LaporanUlasanDummySeeder & LaporanKeuanganTambahanSeeder membuat
        // order/payment/review PALSU. Karena docker/entrypoint.sh menjalankan
        // `php artisan db:seed --force` otomatis tiap deploy, memanggilnya di
        // sini akan mengotori data keuangan production.
        //
        // Jalankan HANYA manual di lokal saat butuh data demo:
        //   php artisan db:seed --class=LaporanUlasanDummySeeder
        //   php artisan db:seed --class=LaporanKeuanganTambahanSeeder
    }
}
