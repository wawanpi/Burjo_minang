<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
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
                        $fail('Password harus memenuhi minimal 2 kriteria keamanan.');
                    }
                },
            ],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back();
    }
}
