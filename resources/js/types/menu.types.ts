// src/types/menu.types.ts

export type MenuKategori = 'makanan' | 'minuman' | 'snack';

export interface Menu {
  id: number;
  nama_menu: string;
  kategori: MenuKategori;
  harga: number;
  stok: number;
  gambar: string | null;
  created_at: string;
  updated_at: string;
}