<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Order — merepresentasikan satu transaksi pesanan.
 *
 * Kolom kunci:
 *  - total_harga     : total transaksi (SELALU dihitung ulang dari DB, bukan input frontend)
 *  - status_pesanan  : menunggu_pembayaran → diproses → selesai / batal (selesai & batal final)
 *  - tipe_pesanan    : dine_in / take_away
 *  - waktu_pengambilan, diproses_at (waktu mulai diproses), jumlah_orang
 *
 * Relasi:
 *  - belongsTo User     : pemesan (FK user_id)
 *  - hasMany  OrderItem : rincian item pesanan
 *  - hasOne   Payment   : data pembayaran (1 order → 1 payment)
 */
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
        'diproses_at',
        'jumlah_orang',
    ];

    protected function casts(): array
    {
        return [
            'total_harga'   => 'decimal:2',
            'tanggal_pesan' => 'datetime',
            'diproses_at'   => 'datetime',
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