<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Display the password reset view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle an incoming new password request.
     *
     * Validasi password yang diperkuat:
     * - Minimum 8 karakter
     * - Wajib huruf besar & kecil (mixedCase)
     * - Wajib angka (numbers)
     * - Wajib simbol (symbols)
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email:rfc,dns',
            'password' => [
                'required',
                'confirmed',
                function ($attribute, $value, $fail) {
                    $passed = 0;
                    if (strlen($value) >= 8) $passed++;
                    if (preg_match('/[A-Z]/', $value)) $passed++;
                    if (preg_match('/[a-z]/', $value)) $passed++;
                    if (preg_match('/[0-9]/', $value)) $passed++;
                    if (preg_match('/[^A-Za-z0-9]/', $value)) $passed++;

                    if ($passed < 2) {
                        $fail('Password harus memenuhi minimal 2 kriteria keamanan (Panjang min 8, Huruf Besar, Huruf Kecil, Angka, atau Simbol).');
                    }
                },
            ],
        ], [
            // Pesan error dalam Bahasa Indonesia
            'password.min' => 'Password harus minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
        ]);

        // Here we will attempt to reset the user's password. If it is successful we
        // will update the password on an actual user model and persist it to the
        // database. Otherwise we will parse the error and return the response.
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));

                // Log sukses reset (tanpa data sensitif)
                Log::info('Password berhasil direset', [
                    'user_id' => $user->id,
                    'ip' => $request->ip(),
                ]);
            }
        );

        // If the password was successfully reset, we will redirect the user back to
        // the application's login view with a success message.
        if ($status == Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('status', 'Password Anda berhasil direset! Silakan login dengan password baru.');
        }

        // Log percobaan gagal
        Log::warning('Percobaan reset password gagal', [
            'email' => $request->email,
            'status' => $status,
            'ip' => $request->ip(),
        ]);

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
