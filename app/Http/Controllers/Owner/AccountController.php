<?php

// app/Http/Controllers/Owner/AccountController.php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountController extends Controller
{
    /**
     * Tampilkan daftar semua akun kasir dengan fitur pencarian.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');

        $users = User::whereIn('role', ['kasir', 'pelanggan'])
            // Grouping closure WAJIB agar orWhere tidak menembus filter role
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('no_hp', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->get(['id', 'name', 'email', 'no_hp', 'role', 'created_at']);

        return Inertia::render('Owner/Accounts/Index', [
            'users'   => $users,
            'filters' => ['search' => $search],
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
     * Simpan akun kasir baru ke database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'no_hp'    => ['required', 'string', 'max:15', 'unique:users,no_hp', 'regex:/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role'     => ['required', 'string', 'in:kasir,pelanggan'],
        ]);

        User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'no_hp'    => $validated['no_hp'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
            // Akun dibuat oleh Owner = dipercaya, langsung terverifikasi
            // agar tidak terkena middleware 'verified'.
            'email_verified_at' => now(),
        ]);

        return redirect()
            ->route('owner.accounts.index')
            ->with('success', 'Akun berhasil ditambahkan.');
    }

    /**
     * Tampilkan form edit akun.
     */
    public function edit(User $account)
    {
        // Pastikan owner tidak bisa edit sesama owner
        abort_if($account->role === 'owner', 403);

        return Inertia::render('Owner/Accounts/Edit', [
            'user' => $account->only('id', 'name', 'email', 'role'),
        ]);
    }

    /**
     * Update data akun kasir.
     */
    public function update(Request $request, User $account)
    {
        abort_if($account->role === 'owner', 403);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users')->ignore($account->id)],
            'no_hp'    => ['required', 'string', 'max:15', Rule::unique('users')->ignore($account->id), 'regex:/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role'     => ['required', 'string', 'in:kasir,pelanggan'],
        ]);

        $account->name  = $validated['name'];
        $account->email = $validated['email'];
        $account->no_hp = $validated['no_hp'];
        $account->role  = $validated['role'];

        if (! empty($validated['password'])) {
            $account->password = Hash::make($validated['password']);
        }

        $account->save();

        return redirect()
            ->route('owner.accounts.index')
            ->with('success', 'Akun berhasil diperbarui.');
    }

    /**
     * Nonaktifkan (soft delete) akun kasir/pelanggan.
     *
     * Bug #3: Model User memakai trait SoftDeletes, sehingga delete() hanya
     * mengisi deleted_at tanpa memicu cascade fisik pada orders/payments.
     * Data transaksi historis milik akun tetap utuh untuk laporan keuangan,
     * dan akun yang dinonaktifkan otomatis tidak bisa login lagi.
     *
     * Bug F-2b (Opsi A): email & no_hp unik di level DB, dan baris soft-deleted
     * tetap ada — tanpa penanganan, email/no_hp akun nonaktif terkunci permanen.
     * Karena itu kontak dilepas saat dinonaktifkan: email diberi penanda unik
     * dan no_hp di-null-kan, agar bisa dipakai lagi oleh akun baru.
     */
    public function destroy(User $account)
    {
        abort_if($account->role === 'owner', 403);

        DB::transaction(function () use ($account) {
            $account->update([
                'email' => $account->email . '.deleted.' . $account->id,
                'no_hp' => null,
            ]);
            $account->delete(); // soft delete (mengisi deleted_at)
        });

        return redirect()
            ->route('owner.accounts.index')
            ->with('success', 'Akun berhasil dinonaktifkan.');
    }
}
