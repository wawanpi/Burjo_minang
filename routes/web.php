<?php

use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderManagementController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\Owner\AccountController;
use App\Http\Controllers\Owner\DashboardController;
use App\Http\Controllers\Owner\LaporanController;
use App\Http\Controllers\Owner\ReviewController;
use Illuminate\Support\Facades\Route;

// ─── Route Publik (Breeze) ────────────────────────────────
require __DIR__.'/auth.php';

// ─── Route Owner (Eksklusif) ─────────────────────────────
Route::middleware(['auth', 'role:owner'])
    ->prefix('owner')
    ->name('owner.')
    ->group(function () {

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        // Laporan
        Route::get('/laporan', [LaporanController::class, 'index'])
            ->name('laporan');
        Route::get('/laporan/print', [LaporanController::class, 'print'])
            ->name('laporan.print');

        // Ulasan/Reviews
        Route::get('/reviews', [ReviewController::class, 'index'])
            ->name('reviews');

        // Manajemen Akun
        Route::resource('accounts', AccountController::class)
            ->except(['show']);
    });

// ─── Route Kasir (Owner + Kasir) ─────────────────────────
// Generalisasi: Owner mewarisi semua fitur Kasir
Route::middleware(['auth', 'role:owner,kasir'])
    ->prefix('kasir')
    ->name('kasir.')
    ->group(function () {

        // Manajemen Menu (CRUD + Search)
        Route::get('/menus', [MenuController::class, 'index'])->name('menus.index');
        Route::post('/menus', [MenuController::class, 'store'])->name('menus.store');
        Route::put('/menus/{menu}', [MenuController::class, 'update'])->name('menus.update');
        Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->name('menus.destroy');

        // Manajemen Pesanan (Daftar, Update Status, Cetak Nota)
        Route::get('/orders', [OrderManagementController::class, 'index'])->name('orders.index');
        Route::patch('/orders/{order}/status', [OrderManagementController::class, 'updateStatus'])->name('orders.updateStatus');
        Route::get('/orders/{order}/nota', [OrderManagementController::class, 'printNota'])->name('orders.nota');

        // Point of Sale / Kasir Offline
        Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
        Route::post('/pos', [PosController::class, 'storeOrderTunai'])->name('pos.store');
        Route::post('/pos/digital', [PosController::class, 'storeOrderDigital'])->name('pos.digital');
    });

use App\Http\Controllers\CustomerOrderController;

// ─── Route Pelanggan (Customer) ──────────────────────────
Route::middleware(['auth', 'role:pelanggan'])
    ->prefix('customer')
    ->name('customer.')
    ->group(function () {
        Route::get('/menu', [CustomerOrderController::class, 'index'])->name('menu');
        Route::post('/menu/checkout', [CustomerOrderController::class, 'store'])->name('checkout');
        
        Route::get('/orders', [CustomerOrderController::class, 'orders'])->name('orders');
        Route::post('/orders/{order}/review', [CustomerOrderController::class, 'storeReview'])->name('reviews.store');
    });

// ─── Routing Cerdas untuk Root (/) ──────────────────────────
Route::get('/', function () {
    if (!auth()->check()) {
        return redirect()->route('login');
    }

    $role = auth()->user()->role;

    if ($role === 'owner') {
        return redirect()->route('owner.dashboard');
    }

    if ($role === 'kasir') {
        return redirect()->route('kasir.pos.index');
    }

    if ($role === 'pelanggan') {
        return redirect()->route('customer.menu');
    }

    return response("Selamat datang, {$role}. Halaman dashboard Anda belum dibuat.");
});