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

// ─── Redirect root ke login ───────────────────────────────
Route::get('/', fn () => redirect()->route('login'));