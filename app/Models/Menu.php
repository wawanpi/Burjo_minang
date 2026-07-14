<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Model Menu — daftar menu makanan/minuman yang dijual.
 *
 * Kolom kunci: nama_menu, kategori, harga, stok (dicek & dikunci saat transaksi),
 * gambar, deskripsi.
 *
 * Memakai SoftDeletes: menu yang "dihapus" hanya ditandai deleted_at (nonaktif)
 * agar rincian transaksi historis (order_items) tidak ikut terhapus.
 *
 * Relasi:
 *  - hasMany OrderItem : menu dipakai di banyak baris pesanan
 *  - hasMany Review     : ulasan pelanggan untuk menu ini
 */
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