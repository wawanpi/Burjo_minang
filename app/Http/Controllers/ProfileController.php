<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Menampilkan halaman profil pengguna.
     *
     * Halaman ini bisa diakses oleh semua role (owner, kasir, pelanggan).
     * Data user yang dikirim ke frontend termasuk foto_profil dan role
     * agar bisa menampilkan badge role dan avatar.
     */
    public function edit(Request $request): Response
    {
        abort_if($request->user()->role === 'kasir', 403, 'Akses ditolak.');

        return Inertia::render('Profile/ProfilePage', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update profil pengguna (nama, email, no_hp, foto_profil).
     *
     * Keamanan:
     * - Menggunakan Auth::user() → user hanya bisa edit profilnya sendiri
     * - Foto profil disimpan di storage/app/public/profile-photos
     * - Foto lama dihapus otomatis jika diganti
     * - Role TIDAK bisa diubah dari halaman ini
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        abort_if($request->user()->role === 'kasir', 403, 'Akses ditolak.');

        $user = $request->user();

        // Fill data text (name, email, no_hp)
        $user->fill($request->safe()->only(['name', 'email', 'no_hp']));

        // Handle update password jika diisi
        if ($request->filled('password')) {
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        // Reset email verification jika email berubah
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Handle upload foto profil
        if ($request->hasFile('foto_profil')) {
            // Hapus foto lama jika ada
            if ($user->foto_profil && Storage::disk('public')->exists($user->foto_profil)) {
                Storage::disk('public')->delete($user->foto_profil);
            }

            // Simpan foto baru ke storage/app/public/profile-photos
            $path = $request->file('foto_profil')->store('profile-photos', 'public');
            $user->foto_profil = $path;
        }

        $user->save();

        return Redirect::route('profile.edit')->with('status', 'Profil berhasil diperbarui!');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        abort_if($request->user()->role === 'kasir', 403, 'Akses ditolak.');

        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        // Bug F-2b (Opsi A): lepas email & no_hp sebelum soft delete agar bisa
        // dipakai lagi (keduanya unik di level DB, baris soft-deleted tetap ada).
        $user->update([
            'email' => $user->email . '.deleted.' . $user->id,
            'no_hp' => null,
        ]);

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
