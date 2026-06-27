<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email:rfc,dns|exists:users,email',
        ], [
            'email.exists' => 'Email belum terdaftar di sistem kami.',
        ]);

        try {
            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status == Password::RESET_LINK_SENT) {
                return back()->with('status', 'Tautan reset password telah dikirim ke email Anda.');
            }

            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => [trans($status)],
            ]);
        } catch (\Exception $e) {
            // Mencatat detail error (seperti gagal koneksi SMTP) ke dalam log
            \Illuminate\Support\Facades\Log::error('SMTP Error: Gagal mengirim email reset password', [
                'email' => $request->email,
                'error' => $e->getMessage()
            ]);

            // Memberikan pesan gracefully ke pengguna tanpa melempar 500 error
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['Gagal mengirim email. Terjadi masalah koneksi ke server. Silakan coba beberapa saat lagi.'],
            ]);
        }
    }
}
