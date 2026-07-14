<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model OrderItem — baris rincian pesanan (tabel penghubung Order ↔ Menu).
 *
 * Menyimpan snapshot: jumlah & subtotal saat pemesanan, sehingga riwayat harga
 * tetap akurat meski harga menu berubah kemudian.
 *
 * Relasi:
 *  - belongsTo Order : pesanan induk (FK order_id)
 *  - belongsTo Menu  : menu yang dipesan (FK menu_id)
 */
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