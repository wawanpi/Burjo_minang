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
class User extends Authenticatable // implements MustVerifyEmail
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
}
