<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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