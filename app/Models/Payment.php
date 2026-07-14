<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Payment — data pembayaran satu pesanan (1 order → 1 payment).
 *
 * Kolom kunci:
 *  - metode_pembayaran : Tunai / QRIS / Transfer Bank / E-Wallet
 *  - status_pembayaran : pending → lunas / gagal / kadaluarsa
 *  - payment_token, transaction_id, payment_url : artefak Midtrans Snap
 *
 * Status 'lunas' HANYA ditulis dari sumber tepercaya (webhook Midtrans /
 * verifikasi get-status / transaksi tunai kasir), tidak dari input frontend.
 *
 * Relasi: belongsTo Order (FK order_id).
 */
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
