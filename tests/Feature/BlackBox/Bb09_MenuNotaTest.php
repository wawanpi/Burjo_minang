<?php

use App\Models\Menu;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BlackBoxSupport;

uses(BlackBoxSupport::class);

/*
|--------------------------------------------------------------------------
| BB-09  Kelola Menu & Cetak Nota Kasir
|--------------------------------------------------------------------------
*/

test('BB-09 Tambah menu valid tersimpan ke database', function () {
    Storage::fake('public');
    $kasir = $this->kasir();

    $response = $this->actingAs($kasir)->post('/kasir/menus', [
        'nama_menu' => 'Sate Padang',
        'kategori'  => 'Makanan',
        'harga'     => 18000,
        'stok'      => 25,
        'gambar'    => UploadedFile::fake()->image('sate.jpg'),
    ]);

    $response->assertRedirect(route('kasir.menus.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('menus', [
        'nama_menu' => 'Sate Padang',
        'kategori'  => 'Makanan',
        'harga'     => 18000,
        'stok'      => 25,
    ]);

    $menu = Menu::where('nama_menu', 'Sate Padang')->first();
    Storage::disk('public')->assertExists($menu->gambar);
});

test('BB-09 Tambah menu invalid ditolak validasi (tanpa gambar & harga negatif)', function () {
    $kasir = $this->kasir();

    $response = $this->actingAs($kasir)->from(route('kasir.menus.index'))->post('/kasir/menus', [
        'nama_menu' => '',
        'kategori'  => '',
        'harga'     => -5000,
        'stok'      => -1,
        // gambar sengaja tidak dikirim
    ]);

    $response->assertSessionHasErrors(['nama_menu', 'kategori', 'harga', 'stok', 'gambar']);
    expect(Menu::count())->toBe(0);
});

test('BB-09 Edit menu memperbarui data (nama & harga)', function () {
    $kasir = $this->kasir();
    $menu  = $this->makeMenu(['nama_menu' => 'Teh Manis', 'harga' => 4000, 'stok' => 10]);

    $response = $this->actingAs($kasir)->put("/kasir/menus/{$menu->id}", [
        'nama_menu' => 'Teh Manis Jumbo',
        'kategori'  => 'Minuman',
        'harga'     => 6000,
        'stok'      => 30,
    ]);

    $response->assertRedirect(route('kasir.menus.index'));
    $this->assertDatabaseHas('menus', [
        'id'        => $menu->id,
        'nama_menu' => 'Teh Manis Jumbo',
        'harga'     => 6000,
        'stok'      => 30,
    ]);
});

test('BB-09 Hapus menu menghilangkan data dari database', function () {
    $kasir = $this->kasir();
    $menu  = $this->makeMenu();

    $response = $this->actingAs($kasir)->delete("/kasir/menus/{$menu->id}");

    $response->assertRedirect(route('kasir.menus.index'));
    $this->assertDatabaseMissing('menus', ['id' => $menu->id]);
});

test('BB-09 Cetak nota menghasilkan data pesanan yang benar', function () {
    $kasir = $this->kasir();
    $menu  = $this->makeMenu(['nama_menu' => 'Nasi Kapau', 'harga' => 22000]);
    $order = $this->makeOrder($this->pelanggan(), ['status_pesanan' => 'selesai', 'total_harga' => 44000], ['metode_pembayaran' => 'Tunai', 'status_pembayaran' => 'lunas'], $menu, 2);

    $response = $this->actingAs($kasir)->get("/kasir/orders/{$order->id}/nota");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Kasir/Orders/Nota')
        ->where('order.id', $order->id)
        ->where('order.total_harga', fn ($v) => (float) $v === 44000.0)
        ->has('order.order_items', 1)
        ->where('order.order_items.0.jumlah', 2)
        ->where('kasir.id', $kasir->id)
    );
});

test('BB-09 Cetak struk thermal memuat identitas pesanan', function () {
    $kasir = $this->kasir();
    $menu  = $this->makeMenu(['nama_menu' => 'Ayam Pop', 'harga' => 25000]);
    $order = $this->makeOrder($this->pelanggan(), ['status_pesanan' => 'selesai'], ['metode_pembayaran' => 'Tunai', 'status_pembayaran' => 'lunas'], $menu, 1);

    $response = $this->actingAs($kasir)->get("/kasir/orders/{$order->id}/struk");

    $response->assertOk();
    $response->assertSee((string) $order->id);
    $response->assertSee('Ayam Pop');
});
