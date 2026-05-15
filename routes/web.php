<?php

use App\Http\Controllers\Owner\AccountController;
use App\Http\Controllers\Owner\DashboardController;
use Illuminate\Support\Facades\Route;

// ─── Route Publik (Breeze) ────────────────────────────────
require __DIR__.'/auth.php';

// ─── Route Owner ─────────────────────────────────────────
Route::middleware(['auth', 'role:owner'])
    ->prefix('owner')
    ->name('owner.')
    ->group(function () {

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        // Manajemen Akun Admin
        Route::resource('accounts', AccountController::class)
            ->except(['show']); // Index, Create, Store, Edit, Update, Destroy
    });

// ─── Routing Cerdas untuk Root (/) ──────────────────────────
Route::get('/', function () {
    // 1. Jika belum login, lempar ke halaman login
    if (!auth()->check()) {
        return redirect()->route('login');
    }

    // 2. Jika sudah login, cek rolenya
    $role = auth()->user()->role;

    // Jika Owner, arahkan ke dashboard Owner
    if ($role === 'owner') {
        return redirect()->route('owner.dashboard');
    }

    // 3. Sementara untuk Admin dan Pelanggan, tampilkan pesan ini
    // sampai halaman frontend mereka selesai kita buat.
    return response("Selamat datang, {$role}. Halaman dashboard Anda belum dibuat.");
});