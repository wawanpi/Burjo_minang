<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware CheckRole — otorisasi berbasis role di level ROUTE (bukan hanya UI).
 *
 * Dipakai sebagai 'role:owner', 'role:owner,kasir', atau 'role:pelanggan' pada
 * grup route. Jika role user tidak termasuk daftar yang diizinkan:
 *  - request browser/Inertia → redirect ke dashboard sesuai role + flash 403
 *  - request JSON murni       → response 403
 *
 * Inilah pertahanan yang mencegah pelanggan mengakses URL kasir/owner secara
 * manual (mis. ketik /owner/laporan di address bar) — bukan sekadar menyembunyikan
 * menu di tampilan.
 */
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