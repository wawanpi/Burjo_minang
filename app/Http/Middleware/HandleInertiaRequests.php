<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            
            // Auth user tersedia di semua halaman
            'auth' => [
                'user' => $request->user(),
            ],

            // Status Buka/Tutup Toko
            'is_store_open' => Cache::get('is_store_open', true),
            
            // ✅ Flash message tersedia di semua halaman via usePage().props.flash
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
            
            // Ziggy route wajib ada agar fungsi route() di React/Vue tidak error
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}