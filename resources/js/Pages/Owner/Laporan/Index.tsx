// resources/js/Pages/Owner/Laporan/LaporanPage.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import type { Order, StatusPembayaran } from '../../../types/order.types';
import Badge from '../../../Components/ui/Badge';
import Button from '../../../Components/ui/Button';
import Pagination from '../../../Components/ui/Pagination';

declare function route(name: string, params?: any, absolute?: boolean): string;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  orders: {
    data: Order[];
    meta: { total: number; current_page: number; last_page: number };
  };
  ringkasan: { total_pendapatan: number };
  filters: { dari?: string; sampai?: string; status?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const statusVariant = (status: StatusPembayaran) => {
  const map: Record<StatusPembayaran, 'success' | 'warning' | 'danger' | 'neutral'> = {
    lunas      : 'success',
    pending    : 'warning',
    batal      : 'danger',
    kadaluarsa : 'neutral',
  };
  return map[status];
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',           label: 'Semua Status' },
  { value: 'lunas',      label: 'Lunas' },
  { value: 'pending',    label: 'Pending' },
  { value: 'batal',      label: 'Batal' },
  { value: 'kadaluarsa', label: 'Kadaluarsa' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Index({ orders, ringkasan, filters }: Props) {
  const [dari, setDari]     = useState(filters.dari    ?? '');
  const [sampai, setSampai] = useState(filters.sampai  ?? '');
  const [status, setStatus] = useState(filters.status  ?? '');

  // Kirim filter ke Laravel via Inertia (partial reload — hanya prop 'orders' & 'ringkasan')
  const applyFilter = () => {
    router.get(
      route('owner.laporan'),
      { dari, sampai, status },
      { preserveState: true, only: ['orders', 'ringkasan', 'filters'] }
    );
  };

  const resetFilter = () => {
    setDari(''); setSampai(''); setStatus('');
    router.get(route('owner.laporan'), {}, { preserveState: true });
  };

  const handlePageChange = (page: number) => {
    router.get(
      route('owner.laporan'),
      { dari, sampai, status, page },
      { preserveState: true, only: ['orders'] }
    );
  };

  return (
    <OwnerLayout title="Laporan Keuangan">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Laporan Keuangan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Riwayat seluruh transaksi dengan filter rentang waktu
          </p>
        </div>

        {/* Filter Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Filter Laporan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Dari */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dari}
                onChange={(e) => setDari(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Sampai */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={sampai}
                min={dari}
                onChange={(e) => setSampai(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <Button className="flex-1" onClick={applyFilter}>Terapkan</Button>
              <Button variant="outline" onClick={resetFilter}>Reset</Button>
            </div>
          </div>
        </div>

        {/* Ringkasan Pendapatan */}
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-5 py-4 border border-amber-200 dark:border-amber-800">
          <span className="text-xl">💰</span>
          <div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Total Pendapatan (Lunas) — hasil filter saat ini
            </p>
            <p className="text-lg font-bold text-amber-800 dark:text-amber-300">
              {formatRupiah(ringkasan.total_pendapatan)}
            </p>
          </div>
          <div className="ml-auto text-sm text-amber-600 dark:text-amber-400 font-medium">
            {orders.meta.total} transaksi
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  {['#', 'Pelanggan', 'Tanggal', 'Total', 'Metode', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                      Tidak ada data untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  orders.data.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {order.user?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(order.tanggal_pesan).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatRupiah(order.total_harga)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {order.metode_pembayaran}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={order.status_pembayaran}
                          variant={statusVariant(order.status_pembayaran)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination di dalam card */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={orders.meta.current_page}
              lastPage={orders.meta.last_page}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}