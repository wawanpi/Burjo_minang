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
        // 1. Buat akun Owner
        User::create([
            'name'     => 'Owner Burjo Minang',
            'email'    => 'owner@burjominang.com',
            'password' => Hash::make('password123'),
            'role'     => 'owner',
        ]);

        // 2. Buat akun kasir
        User::create([
            'name'     => 'kasir Satu',
            'email'    => 'kasir@burjominang.com',
            'password' => Hash::make('password123'),
            'role'     => 'kasir',
        ]);

        // 3. Buat akun Pelanggan
        User::create([
            'name'     => 'Pelanggan Setia',
            'email'    => 'pelanggan@gmail.com',
            'password' => Hash::make('password123'),
            'role'     => 'pelanggan',
        ]);
    }
}
