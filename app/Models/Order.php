<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'total_harga',
        'status_pesanan',
        'tanggal_pesan',
        'tipe_pesanan',
        'waktu_pengambilan',
        'jumlah_orang',
    ];

    protected function casts(): array
    {
        return [
            'total_harga'   => 'decimal:2',
            'tanggal_pesan' => 'datetime',
            'jumlah_orang'  => 'integer',
        ];
    }

    // Relasi: Order milik satu User (pemesan)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi: Satu Order memiliki banyak OrderItem (detail pesanan)
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    // Relasi: Satu Order memiliki satu Payment (data pembayaran)
    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}