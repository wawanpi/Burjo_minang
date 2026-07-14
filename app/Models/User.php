<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany; // WAJIB DIIMPORT
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;

// NOTE: Verifikasi email dinonaktifkan sementara (SMTP diblokir Railway,
// belum ada domain untuk provider email API). Untuk mengaktifkan kembali:
//   1. tambahkan kembali "implements MustVerifyEmail" di bawah
//   2. pasang kembali middleware 'verified' pada rute pelanggan (routes/web.php)
/**
 * Model User — akun pengguna sistem dengan 3 role.
 *
 * role: owner (Pemilik) / kasir / pelanggan. Pemilik mewarisi hak akses Kasir
 * (lihat middleware role:owner,kasir pada routes). Password otomatis di-hash
 * (cast 'password' => 'hashed' = bcrypt); tidak pernah disimpan plaintext.
 *
 * Memakai SoftDeletes: akun yang dinonaktifkan ditandai deleted_at (tidak bisa
 * login lagi) tanpa menghapus pesanan/pembayaran historisnya.
 *
 * Relasi:
 *  - hasMany Order  : pesanan milik user
 *  - hasMany Review : ulasan yang ditulis user
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Properti fillable untuk mass-assignment.
     */
    protected $fillable = [
        'name',
        'email',
        'no_hp',
        'password',
        'role',
        'foto_profil',
    ];

    /**
     * Menyembunyikan atribut sensitif saat array/JSON di-render.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casting tipe data.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relasi: Satu user bisa memiliki banyak pesanan (orders).
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Relasi: Satu user bisa memberikan banyak ulasan (reviews).
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Helper: Cek role owner.
     */
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    /**
     * Helper: Cek role kasir.
     */
    public function iskasir(): bool
    {
        return $this->role === 'kasir';
    }

    /**
     * Kirim notifikasi reset password menggunakan template kustom Burjo Minang.
     * Override method bawaan Laravel agar email menggunakan branding & bahasa Indonesia.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Kirim notifikasi verifikasi email menggunakan template kustom Burjo Minang.
     * Override method bawaan agar email memakai branding & bahasa Indonesia.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification());
    }

    /**
     * Tentukan apakah email user dianggap terverifikasi.
     *
     * Verifikasi email HANYA ditegakkan bila fitur diaktifkan
     * (config('features.email_verification') = true, disetel via .env lokal).
     * Bila fitur OFF (default/produksi), selalu dianggap terverifikasi agar
     * registrasi/login tidak terkunci saat SMTP tidak tersedia. Ini juga
     * membuat middleware 'verified' pass-through & mencegah listener
     * Registered mencoba mengirim email verifikasi di produksi.
     */
    public function hasVerifiedEmail(): bool
    {
        if (! config('features.email_verification')) {
            return true;
        }

        return ! is_null($this->email_verified_at);
    }
}
