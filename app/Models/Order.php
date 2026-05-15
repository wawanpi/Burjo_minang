<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tanggal_pesan',
        'total_harga',
        'status_pembayaran',
        'metode_pembayaran',
        'payment_token',
        'transaction_id',
        'payment_url',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pesan' => 'datetime',
            'total_harga'   => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}