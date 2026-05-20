<?php

use App\Http\Controllers\Owner\AccountController;
use App\Http\Controllers\Owner\DashboardController;
use App\Http\Controllers\Owner\LaporanController; // Tambahan untuk Laporan
use App\Http\Controllers\Owner\ReviewController;  // Tambahan untuk Reviews
use Illuminate\Support\Facades\Route;

// ─── Route Publik (Breeze) ────────────────────────────────
// Ini sudah secara otomatis menangani rute '/login' dari router.tsx Claude
require __DIR__.'/auth.php';

// ─── Route Owner ─────────────────────────────────────────
// Ini menggantikan peran <OwnerRoute /> (guard) dari router.tsx Claude
Route::middleware(['auth', 'role:owner'])
    ->prefix('owner')
    ->name('owner.')
    ->group(function () {

        // Dashboard (Sama dengan path: '/owner/dashboard')
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        // Manajemen Laporan (Sama dengan path: '/owner/laporan')
        Route::get('/laporan', [LaporanController::class, 'index'])
            ->name('laporan');

        // Manajemen Ulasan/Reviews (Sama dengan path: '/owner/reviews')
        Route::get('/reviews', [ReviewController::class, 'index'])
            ->name('reviews');

        // Manajemen Akun Admin/Karyawan (Menggantikan path: '/owner/users')
        // Kamu menggunakan 'accounts' di sini yang mana adalah praktik penamaan yang sangat bagus
        Route::resource('accounts', AccountController::class)
            ->except(['show']); // Menghasilkan route untuk Index, Create, Store, Edit, Update, Destroy
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