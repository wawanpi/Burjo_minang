<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!in_array($request->user()?->role, $roles)) {
            // Jika request berasal dari Inertia (browser) atau bukan minta JSON, redirect dengan flash message
            if ($request->header('X-Inertia') || !$request->expectsJson()) {
                $role = $request->user()?->role;
                
                $redirectUrl = match ($role) {
                    'owner'     => route('owner.dashboard'),
                    'kasir'     => route('kasir.dashboard'),
                    'pelanggan' => route('customer.menu'),
                    default     => '/'
                };

                return redirect($redirectUrl)
                    ->with('error', 'Akses ditolak (403)! Anda tidak memiliki izin untuk mengakses halaman tersebut.');
            }
            // Jika request API murni, tetap kembalikan JSON
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return $next($request);
    }
}