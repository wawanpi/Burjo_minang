<?php

use App\Http\Controllers\API\AuthController;
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

});