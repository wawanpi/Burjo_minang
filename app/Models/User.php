<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany; // WAJIB DIIMPORT
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

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
}
