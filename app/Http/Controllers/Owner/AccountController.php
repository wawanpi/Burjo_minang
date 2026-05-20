<?php

// app/Http/Controllers/Owner/AccountController.php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountController extends Controller
{
    /**
     * Tampilkan daftar semua akun admin.
     */
    public function index()
    {
        $users = User::whereIn('role', ['admin', 'pelanggan'])
            ->latest()
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        return Inertia::render('Owner/Accounts/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Tampilkan form tambah akun baru.
     */
    public function create()
    {
        return Inertia::render('Owner/Accounts/Create');
    }

    /**
     * Simpan akun admin baru ke database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role'     => ['required', 'string', 'in:admin,pelanggan'],
        ]);

        User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        return redirect()
            ->route('owner.accounts.index')
            ->with('success', 'Akun berhasil ditambahkan.');
    }

    /**
     * Tampilkan form edit akun.
     */
    public function edit(User $user)
    {
        // Pastikan owner tidak bisa edit sesama owner
        abort_if($user->role === 'owner', 403);

        return Inertia::render('Owner/Accounts/Edit', [
            'user' => $user->only('id', 'name', 'email', 'role'),
        ]);
    }

    /**
     * Update data akun admin.
     */
    public function update(Request $request, User $user)
    {
        abort_if($user->role === 'owner', 403);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role'     => ['required', 'string', 'in:admin,pelanggan'],
        ]);

        $user->name  = $validated['name'];
        $user->email = $validated['email'];
        $user->role  = $validated['role'];

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()
            ->route('owner.accounts.index')
            ->with('success', 'Akun berhasil diperbarui.');
    }

    /**
     * Hapus akun admin dari database.
     */
    public function destroy(User $user)
    {
        abort_if($user->role === 'owner', 403);

        $user->delete();

        return redirect()
            ->route('owner.accounts.index')
            ->with('success', 'Akun berhasil dihapus.');
    }
}