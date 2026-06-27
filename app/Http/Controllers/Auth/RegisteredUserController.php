<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'no_hp' => ['required', 'string', 'max:15', 'unique:users,no_hp', 'regex:/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/'],
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
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect('/');
    }
}
