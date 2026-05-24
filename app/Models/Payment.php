<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'metode_pembayaran',
        'status_pembayaran',
        'payment_token',
        'transaction_id',
        'payment_url',
    ];

    // Relasi: Payment milik satu Order
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
