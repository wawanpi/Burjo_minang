<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaymentCallbackController;

// Webhook untuk Midtrans (Otomatis bebas CSRF Token karena berada di api.php)
Route::post('/payment-callback', [PaymentCallbackController::class, 'callback']);
