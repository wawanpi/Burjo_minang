<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MenuController extends Controller
{
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

        return Inertia::render('Menus/Index', [
            'menus'        => $menus,
            'kategoriList' => $kategoriList,
            'filters'      => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_menu' => ['required', 'string', 'max:255', 'unique:menus,nama_menu'],
            'kategori'  => ['required', 'string', 'max:100'],
            'harga'     => ['required', 'numeric', 'min:0'],
            'stok'      => ['required', 'integer', 'min:0'],
            'gambar'    => ['required', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('gambar')) {
            $validated['gambar'] = $request->file('gambar')->store('menu-images', 'public');
        }

        Menu::create($validated);

        return redirect()
            ->route('kasir.menus.index')
            ->with('success', 'Menu berhasil ditambahkan!');
    }

    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'nama_menu' => ['required', 'string', 'max:255', Rule::unique('menus')->ignore($menu->id)],
            'kategori'  => ['required', 'string', 'max:100'],
            'harga'     => ['required', 'numeric', 'min:0'],
            'stok'      => ['required', 'integer', 'min:0'],
            'gambar'    => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('gambar')) {
            $validated['gambar'] = $request->file('gambar')->store('menu-images', 'public');
        } else {
            unset($validated['gambar']);
        }

        $menu->update($validated);

        return redirect()
            ->route('kasir.menus.index')
            ->with('success', 'Menu berhasil diperbarui!');
    }

    public function destroy(Menu $menu)
    {
        $menu->delete();

        return redirect()
            ->route('kasir.menus.index')
            ->with('success', 'Menu berhasil dihapus!');
    }
}
