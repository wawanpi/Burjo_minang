<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', // Dikembalikan agar tidak error jika ada route API
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // Percayai proxy (Railway/Nginx) agar Laravel mengenali HTTPS dari
        // header X-Forwarded-*. Tanpa ini, aset di-generate sebagai http://
        // dan diblokir browser (mixed content) -> halaman putih.
        $middleware->trustProxies(at: '*');

        // Middleware bawaan Inertia & Breeze
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Mendaftarkan alias middleware langsung menggunakan variabel $middleware
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
        
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();