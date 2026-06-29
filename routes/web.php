<?php

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                     ROUTES — BURJOMINANG RM                            ║
// ║  Dikelompokkan berdasarkan aktor: Owner, Kasir, Pelanggan, API         ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ─── Import Controller: Owner (Eksklusif) ────────────────────────────────
use App\Http\Controllers\Owner\AccountController;
use App\Http\Controllers\Owner\DashboardController;
use App\Http\Controllers\Owner\LaporanController;
use App\Http\Controllers\Owner\ReviewController;

// ─── Import Controller: Kasir (Owner + Kasir) ───────────────────────────
use App\Http\Controllers\Kasir\MenuController;
use App\Http\Controllers\Kasir\OrderManagementController;
use App\Http\Controllers\Kasir\PosController;

// ─── Import Controller: Pelanggan ────────────────────────────────────────────
use App\Http\Controllers\Pelanggan\CustomerOrderController;

// ─── Import Model ────────────────────────────────────────────────────────────
use App\Models\Menu;

// ─── Import Facade ───────────────────────────────────────────────────────────
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Route Publik (Breeze Auth) ──────────────────────────────────────────
require __DIR__.'/auth.php';


// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  1. ROUTE OWNER (Eksklusif)                                            ║
// ║  Hanya role 'owner' yang bisa mengakses: Laporan, Ulasan, Akun         ║
// ╚══════════════════════════════════════════════════════════════════════════╝
Route::middleware(['auth', 'role:owner'])
    ->prefix('owner')
    ->name('owner.')
    ->group(function () {

        // Dashboard Khusus Owner
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Laporan Keuangan
        Route::get('/laporan', [LaporanController::class, 'index'])
            ->name('laporan');
        Route::get('/laporan/print', [LaporanController::class, 'print'])
            ->name('laporan.print');

        // Ulasan / Reviews
        Route::get('/reviews', [ReviewController::class, 'index'])
            ->name('reviews');

        // Manajemen Akun (CRUD)
        Route::resource('accounts', AccountController::class)
            ->except(['show']);
    });


// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  2. ROUTE KASIR (Owner + Kasir)                                        ║
// ║  Owner mewarisi semua hak akses Kasir                                  ║
// ╚══════════════════════════════════════════════════════════════════════════╝
Route::middleware(['auth', 'role:owner,kasir'])
    ->prefix('kasir')
    ->name('kasir.')
    ->group(function () {

        // Dashboard (bisa diakses Owner & Kasir)
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Manajemen Menu (CRUD + Search)
        Route::get('/menus', [MenuController::class, 'index'])->name('menus.index');
        Route::post('/menus', [MenuController::class, 'store'])->name('menus.store');
        Route::put('/menus/{menu}', [MenuController::class, 'update'])->name('menus.update');
        Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->name('menus.destroy');

        // Manajemen Pesanan (Daftar, Update Status, Cetak Nota)
        Route::get('/orders', [OrderManagementController::class, 'index'])->name('orders.index');
        Route::patch('/orders/{order}/status', [OrderManagementController::class, 'updateStatus'])->name('orders.updateStatus');
        Route::get('/orders/{order}/nota', [OrderManagementController::class, 'printNota'])->name('orders.nota');
        Route::get('/orders/{order}/struk', [OrderManagementController::class, 'printStruk'])->name('orders.struk');

        // Point of Sale / Kasir Offline
        Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
        Route::post('/pos', [PosController::class, 'storeOrderTunai'])->name('pos.store');
        Route::post('/pos/digital', [PosController::class, 'storeOrderDigital'])->name('pos.digital');
        
        // Toggle Buka/Tutup Toko
        Route::post('/store/toggle-status', [PosController::class, 'toggleStoreStatus'])->name('store.toggle');
    });


// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  3. ROUTE PELANGGAN (Customer)                                         ║
// ║  Hanya role 'pelanggan' yang bisa mengakses                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝
Route::middleware(['auth', 'role:pelanggan'])
    ->prefix('customer')
    ->name('customer.')
    ->group(function () {
        Route::get('/menu', [CustomerOrderController::class, 'index'])->name('menu');
        Route::post('/menu/checkout', [CustomerOrderController::class, 'store'])->name('checkout');

        Route::get('/orders', [CustomerOrderController::class, 'orders'])->name('orders');
        Route::post('/orders/{order}/review', [CustomerOrderController::class, 'storeReview'])->name('reviews.store');
        Route::patch('/orders/{order}/payment-status', [CustomerOrderController::class, 'updatePaymentStatus'])->name('payment.status');
    });


// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  4. ROUTE PROFIL (Semua Role)                                          ║
// ║  Setiap user yang login bisa mengedit profilnya sendiri                ║
// ╚══════════════════════════════════════════════════════════════════════════╝
use App\Http\Controllers\ProfileController;

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
});


// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  5. ROUTING CERDAS ROOT (/)                                            ║
// ║  Redirect otomatis berdasarkan role user yang sedang login              ║
// ╚══════════════════════════════════════════════════════════════════════════╝
Route::get('/', function () {
    // Jika belum login, tampilkan Landing Page publik
    if (!auth()->check()) {
        // Ambil 6 menu unggulan dengan rating tertinggi untuk ditampilkan di Landing Page
        $featuredMenus = Menu::withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('stok', '>', 0)
            ->orderByDesc('reviews_avg_rating')
            ->orderByDesc('reviews_count')
            ->limit(6)
            ->get();

        return Inertia::render('LandingPage', [
            'featuredMenus' => $featuredMenus,
        ]);
    }

    // Jika sudah login, redirect berdasarkan role
    $role = auth()->user()->role;

    if ($role === 'owner') {
        return redirect()->route('owner.dashboard');
    }

    if ($role === 'kasir') {
        return redirect()->route('kasir.dashboard');
    }

    if ($role === 'pelanggan') {
        return redirect()->route('customer.menu');
    }

    return response("Selamat datang, {$role}. Halaman dashboard Anda belum dibuat.");
});