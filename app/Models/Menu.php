<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Menu extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nama_menu',
        'kategori',
        'harga',
        'deskripsi',
        'stok',
        'gambar',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'decimal:2',
            'stok'  => 'integer',
        ];
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}