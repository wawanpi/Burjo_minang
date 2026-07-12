<?php

namespace App\Http\Controllers\Kasir;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * MenuController — Mengelola CRUD data menu makanan/minuman.
 *
 * Controller ini digunakan oleh Kasir dan Owner untuk menambah,
 * mengedit, menghapus, dan mencari menu yang tersedia di toko.
 */
class MenuController extends Controller
{
    /**
     * Menampilkan daftar seluruh menu dengan fitur pencarian.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $search = $request->input('search');

        $menus = Menu::query()
            ->when($search, function ($query, $search) {
                $query->where('nama_menu', 'like', "%{$search}%")
                      ->orWhere('kategori', 'like', "%{$search}%");
            })
            ->latest()
            ->get();

        $kategoriList = Menu::select('kategori')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori');

        return Inertia::render('Kasir/Menus/Index', [
            'menus'        => $menus,
            'kategoriList' => $kategoriList,
            'filters'      => ['search' => $search],
        ]);
    }

    /**
     * Menyimpan menu baru ke database.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_menu'  => ['required', 'string', 'max:255', 'unique:menus,nama_menu'],
            'kategori'   => ['required', 'string', 'max:100'],
            'harga'      => ['required', 'numeric', 'min:0'],
            'deskripsi'  => ['nullable', 'string', 'max:1000'],
            'stok'       => ['required', 'integer', 'min:0'],
            'gambar'     => ['required', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('gambar')) {
            $validated['gambar'] = $request->file('gambar')->store('menu-images', 'public');
        }

        Menu::create($validated);

        return redirect()
            ->route('kasir.menus.index')
            ->with('success', 'Menu berhasil ditambahkan!');
    }

    /**
     * Memperbarui data menu yang sudah ada.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Menu          $menu
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'nama_menu'  => ['required', 'string', 'max:255', Rule::unique('menus')->ignore($menu->id)],
            'kategori'   => ['required', 'string', 'max:100'],
            'harga'      => ['required', 'numeric', 'min:0'],
            'deskripsi'  => ['nullable', 'string', 'max:1000'],
            'stok'       => ['required', 'integer', 'min:0'],
            'gambar'     => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('gambar')) {
            // Bug #7: hapus gambar lama agar tidak menumpuk sebagai orphan file.
            if ($menu->gambar && Storage::disk('public')->exists($menu->gambar)) {
                Storage::disk('public')->delete($menu->gambar);
            }
            $validated['gambar'] = $request->file('gambar')->store('menu-images', 'public');
        } else {
            unset($validated['gambar']);
        }

        $menu->update($validated);

        return redirect()
            ->route('kasir.menus.index')
            ->with('success', 'Menu berhasil diperbarui!');
    }

    /**
     * Menonaktifkan (soft delete) menu dari daftar jual.
     *
     * Bug #2: Karena model Menu memakai trait SoftDeletes, panggilan delete()
     * hanya mengisi kolom deleted_at — menu hilang dari daftar aktif tetapi
     * rincian order_items historis tetap utuh (cascade fisik tidak terpicu).
     * File gambar sengaja TIDAK dihapus agar nota/riwayat lama tetap menampilkan
     * gambar menu.
     *
     * @param  \App\Models\Menu  $menu
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Menu $menu)
    {
        $menu->delete(); // soft delete (mengisi deleted_at)

        return redirect()
            ->route('kasir.menus.index')
            ->with('success', 'Menu berhasil dihapus!');
    }
}
