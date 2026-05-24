<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'menu_id',
        'jumlah',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'jumlah'   => 'integer',
            'subtotal' => 'decimal:2',
        ];
    }

    // Relasi: OrderItem milik satu Order (pesanan induk)
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Relasi: OrderItem merujuk ke satu Menu
    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }
}