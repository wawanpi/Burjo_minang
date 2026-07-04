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
                'name'     => 'Owner Burjo Minang',
                'password' => Hash::make('password123'),
                'role'     => 'owner',
            ]
        );

        // 2. Buat akun kasir
        User::firstOrCreate(
            ['email' => 'kasir@burjominang.com'],
            [
                'name'     => 'kasir Satu',
                'password' => Hash::make('password123'),
                'role'     => 'kasir',
            ]
        );

        // 3. Buat akun Pelanggan
        User::firstOrCreate(
            ['email' => 'pelanggan@gmail.com'],
            [
                'name'     => 'Pelanggan Setia',
                'password' => Hash::make('password123'),
                'role'     => 'pelanggan',
            ]
        );
    }
}
