<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Review — ulasan (rating 1–5 + komentar) dari pelanggan untuk menu.
 *
 * Aturan: pelanggan hanya boleh mengulas menu yang ADA di pesanannya yang
 * berstatus 'selesai', dan satu ulasan per menu per pelanggan.
 *
 * Relasi:
 *  - belongsTo User : pemberi ulasan (FK user_id)
 *  - belongsTo Menu : menu yang diulas (FK menu_id)
 */
class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'menu_id',
        'rating',
        'komentar',
        'tanggal_ulasan',
    ];

    protected function casts(): array
    {
        return [
            'rating'         => 'integer',
            'tanggal_ulasan' => 'datetime',
        ];
    }

    // Relasi: Review milik satu User (pemberi ulasan)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi: Review merujuk ke satu Menu (menu yang diulas)
    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }
}