// src/types/review.types.ts
import type { User } from './user.types';

export interface Review {
  id: number;
  user: User;
  menu: {
    id: number;
    nama_menu: string;
  };
  rating: number;   // 1–5
  komentar: string | null;
  tanggal_ulasan: string;
}

export interface DashboardStats {
  total_pendapatan: number;
  jumlah_pesanan: number;
  pesanan_hari_ini: number;
  pendapatan_bulan: number;
}