<?php

use App\Http\Controllers\Api\PaymentCallbackController;
use Illuminate\Support\Facades\Route;

// ─── Webhook Midtrans ────────────────────────────────────────────────────
// Otomatis bebas CSRF Token karena berada di api.php
Route::post('/payment-callback', [PaymentCallbackController::class, 'callback']);
