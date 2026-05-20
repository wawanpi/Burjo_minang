// src/types/order.types.ts
import type { User } from './user.types';

export type StatusPembayaran = 'pending' | 'lunas' | 'batal' | 'kadaluarsa';
export type MetodePembayaran = 'Tunai' | 'QRIS' | 'Transfer Bank' | 'E-Wallet';

export interface Order {
  id: number;
  user: User;
  tanggal_pesan: string;
  total_harga: number;
  status_pembayaran: StatusPembayaran;
  metode_pembayaran: MetodePembayaran;
}

// Query params untuk GET /owner/laporan
export interface LaporanFilterParams {
  dari?: string;    // 'YYYY-MM-DD'
  sampai?: string;  // 'YYYY-MM-DD'
  status?: StatusPembayaran;
}

export interface LaporanResponse {
  data: Order[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
  ringkasan: {
    total_pendapatan: number;
  };
}