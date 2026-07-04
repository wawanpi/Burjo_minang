<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Paksa semua URL memakai skema HTTPS saat di produksi (Railway).
        // Mencegah aset/link ter-generate sebagai http:// di balik proxy.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        // ─── RATE LIMITER: Forgot Password ───
        // Maksimal 5 percobaan per menit per IP address.
        // Mencegah brute-force & spam pada endpoint forgot-password.
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(5)->by(
                $request->ip()
            )->response(function () {
                return back()->withErrors([
                    'email' => 'Terlalu banyak percobaan. Silakan tunggu beberapa saat sebelum mencoba lagi.',
                ]);
            });
        });
    }
}
