// resources/js/Pages/Owner/Laporan/Index.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import Badge from '../../../Components/ui/Badge';
import Button from '../../../Components/ui/Button';
import Pagination from '../../../Components/ui/Pagination';

declare function route(name: string, params?: any, absolute?: boolean): string;

// ─── Types ────────────────────────────────────────────────────────────────────
type TipePesanan = 'dine_in' | 'take_away' | 'online';
type TabType = 'keuangan' | 'riwayat';

interface LaporanOrder {
  id: number;
  user: { id: number; name: string; email: string } | null;
  tanggal_pesan: string;
  total_harga: number;
  tipe_pesanan: TipePesanan;
  status_pesanan: string;
  metode_pembayaran: string;
  status_pembayaran: string;
}

interface Props {
  orders: {
    data: LaporanOrder[];
    meta: { total: number; current_page: number; last_page: number };
  };
  ringkasan: { total_pendapatan: number };
  filters: { dari?: string; sampai?: string; tipe?: string };
  tab: TabType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

/** Badge variant per tipe pesanan */
const tipeBadge = (tipe: TipePesanan): { label: string; variant: 'info' | 'warning' | 'success' } => {
  const map: Record<TipePesanan, { label: string; variant: 'info' | 'warning' | 'success' }> = {
    dine_in   : { label: '🍽️ Dine In',   variant: 'info' },
    take_away : { label: '🛍️ Take Away', variant: 'warning' },
    online    : { label: '🌐 Online',     variant: 'success' },
  };
  return map[tipe] ?? { label: tipe, variant: 'info' };
};

/** Badge variant per status pesanan (untuk tab Riwayat) */
const statusBadge = (status: string): { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' } => {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
    selesai              : { label: 'Selesai',        variant: 'success' },
    diproses             : { label: 'Diproses',       variant: 'info' },
    menunggu_pembayaran  : { label: 'Menunggu Bayar', variant: 'warning' },
    batal                : { label: 'Batal',          variant: 'danger' },
  };
  return map[status] ?? { label: status, variant: 'neutral' };
};

const TIPE_OPTIONS: { value: string; label: string }[] = [
  { value: '',           label: 'Semua Tipe' },
  { value: 'dine_in',   label: 'Dine In' },
  { value: 'take_away', label: 'Take Away' },
  { value: 'online',    label: 'Online' },
];

const TABS: { key: TabType; label: string; icon: string; desc: string }[] = [
  { key: 'keuangan', label: 'Ringkasan Keuangan', icon: '💰', desc: 'Transaksi lunas & selesai' },
  { key: 'riwayat',  label: 'Riwayat Transaksi',  icon: '📋', desc: 'Semua transaksi' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Index({ orders, ringkasan, filters, tab }: Props) {
  const [dari, setDari]     = useState(filters.dari  ?? '');
  const [sampai, setSampai] = useState(filters.sampai ?? '');
  const [tipe, setTipe]     = useState(filters.tipe   ?? '');

  const isKeuangan = tab === 'keuangan';

  // Navigasi Tab
  const switchTab = (newTab: TabType) => {
    router.get(
      route('owner.laporan'),
      { tab: newTab, dari, sampai, tipe },
      { preserveState: false }
    );
  };

  // Kirim filter ke Laravel via Inertia (partial reload)
  const applyFilter = () => {
    router.get(
      route('owner.laporan'),
      { tab, dari, sampai, tipe },
      { preserveState: true, only: ['orders', 'ringkasan', 'filters'] }
    );
  };

  const resetFilter = () => {
    setDari(''); setSampai(''); setTipe('');
    router.get(route('owner.laporan'), { tab }, { preserveState: true });
  };

  const handlePageChange = (page: number) => {
    router.get(
      route('owner.laporan'),
      { tab, dari, sampai, tipe, page },
      { preserveState: true, only: ['orders'] }
    );
  };

  // Cetak Laporan (hanya untuk tab keuangan)
  const handlePrint = () => {
    const params = new URLSearchParams();
    if (dari) params.set('dari', dari);
    if (sampai) params.set('sampai', sampai);
    if (tipe) params.set('tipe', tipe);
    const url = route('owner.laporan.print') + '?' + params.toString();
    window.open(url, '_blank');
  };

  // Kolom tabel dinamis berdasarkan tab
  const tableHeaders = isKeuangan
    ? ['#', 'Pelanggan', 'Tanggal', 'Total', 'Metode', 'Tipe Pesanan']
    : ['#', 'Pelanggan', 'Tanggal', 'Total', 'Metode', 'Tipe Pesanan', 'Status'];

  return (
    <OwnerLayout title="Laporan">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Laporan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Audit keuangan dan riwayat operasional restoran
          </p>
        </div>

        {/* ═══ Dual-Tab Navigation ═══ */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 focus:outline-none ${
                tab === t.key
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
              {/* Garis bawah aktif */}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          ))}
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

            {/* Tipe Pesanan */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tipe Pesanan
              </label>
              <select
                value={tipe}
                onChange={(e) => setTipe(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {TIPE_OPTIONS.map((opt) => (
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

        {/* ═══ Ringkasan Pendapatan (hanya tab Keuangan) ═══ */}
        {isKeuangan && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-5 py-4 border border-amber-200 dark:border-amber-800">
            <span className="text-xl">💰</span>
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Total Pendapatan — transaksi lunas & selesai
              </p>
              <p className="text-lg font-bold text-amber-800 dark:text-amber-300">
                {formatRupiah(ringkasan.total_pendapatan)}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {orders.meta.total} transaksi
              </span>
              {/* Tombol Cetak Laporan */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                           border-2 border-amber-500 text-amber-700 bg-white
                           hover:bg-amber-500 hover:text-white
                           dark:bg-transparent dark:text-amber-400 dark:border-amber-500
                           dark:hover:bg-amber-500 dark:hover:text-white
                           transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak Laporan
              </button>
            </div>
          </div>
        )}

        {/* Info banner untuk tab Riwayat */}
        {!isKeuangan && (
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-5 py-4 border border-blue-200 dark:border-blue-800">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                Riwayat Semua Transaksi — termasuk yang batal & dalam proses
              </p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                {orders.meta.total} transaksi ditemukan
              </p>
            </div>
          </div>
        )}

        {/* ═══ Tabel ═══ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  {tableHeaders.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.data.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-4 py-16 text-center text-gray-400">
                      Tidak ada data untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  orders.data.map((order) => {
                    const tBadge = tipeBadge(order.tipe_pesanan);
                    const sBadge = statusBadge(order.status_pesanan);
                    return (
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
                            label={tBadge.label}
                            variant={tBadge.variant}
                          />
                        </td>
                        {/* Kolom Status — hanya muncul di tab Riwayat */}
                        {!isKeuangan && (
                          <td className="px-4 py-3">
                            <Badge
                              label={sBadge.label}
                              variant={sBadge.variant}
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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