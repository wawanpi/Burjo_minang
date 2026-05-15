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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }
}