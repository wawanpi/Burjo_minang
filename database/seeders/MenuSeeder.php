<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

/**
 * MenuSeeder — mengisi daftar menu awal Burjo Minang.
 *
 * Menggunakan firstOrCreate (key: nama_menu) agar idempotent: aman
 * dijalankan berulang tiap deploy tanpa menduplikasi data.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // Stok default untuk semua menu awal
        $stokDefault = 50;

        // ── Menu Makanan ─────────────────────────────────────────────
        $makanan = [
            ['Dendeng Batokok',      15000],
            ['Ikan Bakar',           17000],
            ['Cumi Geprek',          15000],
            ['Ikan Tuna Balado',     15000],
            ['Ikan Tuna Cabe Ijo',   15000],
            ['Ikan Tuna Sampadeh',   15000],
            ['Ikan Tuna Gulai',      15000],
            ['Udang Gulai',          13000],
            ['Udang Balado',         13000],
            ['Udang Crispy',         13000],
            ['Ayam Bakar',           15000],
            ['Ayam Gulai',           15000],
            ['Ayam Rica',            15000],
            ['Ayam Hot Lava',        15000],
            ['Ayam Bumbu',           13000],
            ['Ayam Balado',          13000],
            ['Ayam Cabe Ijo',        13000],
            ['Ayam Kecap',           13000],
            ['Ayam Geprek',          13000],
            ['Ayam Crispy',          13000],
        ];

        // ── Add On ───────────────────────────────────────────────────
        $addOn = [
            ['Telur Bulat Balado',   5000],
            ['Telur Bulat Gulai',    5000],
            ['Telur Puyuh Balado',   5000],
            ['Telur Puyuh Gulai',    5000],
            ['Telur Ceplok',         4000],
            ['Telur Dadar',          4000],
            ['Kerupuk Jangek Siram', 4000],
            ['Ca Kangkung Terasi',   3000],
            ['Ca Toge',              3000],
            ['Sayur Sop',            3000],
            ['Orek Tempe',           3000],
            ['Perkedel',             2000],
            ['Kentang Balado',       2000],
            ['Terong Balado',        2000],
        ];

        $this->seedKategori($makanan, 'Makanan', $stokDefault);
        $this->seedKategori($addOn, 'Add on', $stokDefault);
    }

    /**
     * Simpan sekumpulan menu untuk satu kategori.
     *
     * @param  array<int, array{0: string, 1: int}>  $items
     */
    private function seedKategori(array $items, string $kategori, int $stok): void
    {
        foreach ($items as [$nama, $harga]) {
            Menu::firstOrCreate(
                ['nama_menu' => $nama],
                [
                    'kategori' => $kategori,
                    'harga'    => $harga,
                    'stok'     => $stok,
                ]
            );
        }
    }
}
