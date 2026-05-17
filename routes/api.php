<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\LaporanController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes — tidak perlu autentikasi
|--------------------------------------------------------------------------
*/
Route::post('/login',  [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes — wajib Sanctum token
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |----------------------------------------------------------------------
    | Owner Routes — role: owner
    |----------------------------------------------------------------------
    */
    Route::middleware('role:owner')->prefix('owner')->group(function () {

        Route::get('/dashboard',        [DashboardController::class, 'index']);
        Route::get('/laporan',          [LaporanController::class,   'index']);
        Route::get('/reviews',          [ReviewController::class,    'index']);

        // CRUD Manajemen Akun (Admin / Pelanggan)
        Route::apiResource('/users', UserController::class);
    });

});