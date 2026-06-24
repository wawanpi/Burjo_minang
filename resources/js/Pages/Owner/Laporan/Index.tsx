// resources/js/Pages/Owner/Laporan/Index.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import Badge from '../../../Components/ui/Badge';
import Pagination from '../../../Components/ui/Pagination';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

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
    dine_in   : { label: 'Dine In',   variant: 'info' },
    take_away : { label: 'Take Away', variant: 'warning' },
    online    : { label: 'Online',     variant: 'success' },
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

const TABS: { key: TabType; label: string; desc: string }[] = [
  { key: 'keuangan', label: 'Ringkasan Keuangan', desc: 'Transaksi lunas & selesai' },
  { key: 'riwayat',  label: 'Riwayat Transaksi',  desc: 'Semua transaksi' },
];

// ─── Inline SVG Icon Components ───────────────────────────────────────────────
const IconCoin = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 9.5a3 3 0 1 0 0 5M10 9.5v5M12 7.5v1M12 15.5v1" />
  </svg>
);

const IconReceipt = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2Z" />
    <path strokeLinecap="round" d="M14 8H10M14 12H10M12 16H10" />
  </svg>
);

const IconChartBar = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4v9H3zM10 7h4v14h-4zM17 3h4v18h-4z" />
  </svg>
);

const IconCreditCard = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path strokeLinecap="round" d="M2 10h20M6 14h4" />
  </svg>
);

const IconPrinter = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const IconBanknotes = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path strokeLinecap="round" d="M6 12h.01M18 12h.01" />
  </svg>
);

const IconBuilding = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
  </svg>
);

const IconQrcode = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path strokeLinecap="round" d="M14 14h3v3h-3zM20 14v3h-1M14 20h3M20 20h.01" />
  </svg>
);

const IconWallet = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4M20 12v4H6a2 2 0 0 1-2-2v-2M20 12h-4a2 2 0 0 0 0 4h4M4 6v12a2 2 0 0 0 2 2h14" />
  </svg>
);

const IconHistory = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

/** Ikon metode pembayaran */
const MetodeIcon = ({ metode }: { metode: string }) => {
  const lower = metode.toLowerCase();
  if (lower.includes('tunai') || lower.includes('cash'))
    return <IconBanknotes className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />;
  if (lower.includes('transfer') || lower.includes('bank'))
    return <IconBuilding className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />;
  if (lower.includes('qris') || lower.includes('qr'))
    return <IconQrcode className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />;
  return <IconCreditCard className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />;
};

/** Custom badge classes per tipe pesanan (warna khusus) */
const tipeBadgeClass = (tipe: TipePesanan): string => {
  const map: Record<TipePesanan, string> = {
    dine_in   : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    take_away : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    online    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  };
  return map[tipe] ?? 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
interface ChartPayload {
  date: string;
  label: string;
  total: number;
}

const ChartTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: ChartPayload; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-700">
      <p className="text-gray-300 mb-0.5">{data.label}</p>
      <p className="font-semibold text-bm-gold-400">
        {formatRupiah(data.total)}
      </p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
// ─── Skeleton Rows (loading state) ────────────────────────────────────────────
const SkeletonRows = ({ cols, rows = 5 }: { cols: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-5 py-4">
            <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
              j === 0 ? 'w-10' : j === 1 ? 'w-28' : j === 3 ? 'w-24' : 'w-20'
            }`} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function Index({ orders, ringkasan, filters, tab }: Props) {
  const [dari, setDari]     = useState(filters.dari  ?? '');
  const [sampai, setSampai] = useState(filters.sampai ?? '');
  const [tipe, setTipe]     = useState(filters.tipe   ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const isKeuangan = tab === 'keuangan';

  // Track Inertia navigation loading state
  useEffect(() => {
    const onStart = () => setIsLoading(true);
    const onFinish = () => setIsLoading(false);
    const removeStart = router.on('start', onStart);
    const removeFinish = router.on('finish', onFinish);
    return () => { removeStart(); removeFinish(); };
  }, []);

  // ── Computed stats ──
  const stats = useMemo(() => {
    const total = ringkasan.total_pendapatan;
    const count = orders.meta.total;
    const avg = count > 0 ? Math.round(total / count) : 0;

    // Hitung metode terbanyak dari data yang tersedia
    const metodeCounts: Record<string, number> = {};
    orders.data.forEach((o) => {
      const m = o.metode_pembayaran || '-';
      metodeCounts[m] = (metodeCounts[m] || 0) + 1;
    });
    const topMetode = Object.entries(metodeCounts).sort((a, b) => b[1] - a[1])[0];

    return { total, count, avg, topMetode: topMetode?.[0] ?? '-' };
  }, [ringkasan, orders]);

  // ── Chart data: group pendapatan per hari dari orders.data ──
  const chartData = useMemo(() => {
    const dayMap: Record<string, number> = {};
    orders.data.forEach((o) => {
      const dateKey = o.tanggal_pesan
        ? new Date(o.tanggal_pesan).toISOString().slice(0, 10)
        : 'unknown';
      dayMap[dateKey] = (dayMap[dateKey] || 0) + o.total_harga;
    });

    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date,
        label: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        total,
      }));
  }, [orders.data]);

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

  // Tanggal hari ini
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <OwnerLayout title="Laporan">
      <div className="space-y-6">

        {/* ═══════════════════════════════════════════════════
            1. HEADER SECTION
        ═══════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-page-enter">
          <div>
            <span className="bm-eyebrow block mb-1.5">Audit & Keuangan</span>
            <div className="flex items-center gap-2.5">
              <span className="text-bm-gold-500 text-lg leading-none select-none">✦</span>
              <h1 className="text-2xl lg:text-[28px] font-serif font-bold text-bm-charcoal-900 leading-tight">Laporan</h1>
            </div>
            <div className="bm-gold-underline mt-3" />
            <p className="text-sm text-bm-text-muted mt-2">
              Audit keuangan dan riwayat operasional restoran · {todayStr}
            </p>
          </div>
          {isKeuangan && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold
                         bg-bm-gold-400 hover:bg-bm-gold-500 text-bm-charcoal-900 shadow-soft
                         transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 self-start"
            >
              <IconPrinter />
              Cetak Laporan
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            DUAL-TAB NAVIGATION
        ═══════════════════════════════════════════════════ */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none ${
                tab === t.key
                  ? 'text-bm-charcoal-900'
                  : 'text-bm-text-muted hover:text-bm-charcoal-800'
              }`}
            >
              {t.key === 'keuangan'
                ? <IconWallet className="w-4 h-4" />
                : <IconHistory className="w-4 h-4" />
              }
              <span>{t.label}</span>
              {/* Garis bawah aktif — emas */}
              {tab === t.key && (
                <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-bm-gold-500 to-bm-gold-300 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════
            2. STATS CARDS ROW (tab Keuangan)
        ═══════════════════════════════════════════════════ */}
        {isKeuangan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Pendapatan',     value: formatRupiah(stats.total),               sub: 'Periode terpilih',     icon: <IconCoin className="w-[18px] h-[18px]" /> },
              { label: 'Jumlah Transaksi',     value: stats.count.toLocaleString('id-ID'),     sub: 'Lunas & selesai',      icon: <IconReceipt className="w-[18px] h-[18px]" /> },
              { label: 'Rata-rata / Transaksi',value: formatRupiah(stats.avg),                 sub: 'Per order',            icon: <IconChartBar className="w-[18px] h-[18px]" /> },
              { label: 'Metode Terbanyak',     value: stats.topMetode,                         sub: 'Dari data halaman ini',icon: <IconCreditCard className="w-[18px] h-[18px]" />, capitalize: true },
            ].map((c, i) => (
              <div
                key={c.label}
                className="bg-gradient-to-br from-bm-charcoal-800 to-bm-charcoal-900 border border-white/[0.06] rounded-2xl p-5 shadow-soft opacity-0 animate-page-enter"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-white/50">{c.label}</p>
                    <p className={`font-serif text-[26px] font-bold text-bm-gold-400 mt-1.5 leading-none ${c.capitalize ? 'capitalize' : ''}`}>
                      {c.value}
                    </p>
                    <p className="text-[11px] text-white/40 mt-2">{c.sub}</p>
                  </div>
                  <div className="w-10 h-10 rounded-[10px] bg-bm-gold-500/15 flex items-center justify-center text-bm-gold-400 flex-shrink-0">
                    {c.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            CHART: Pendapatan Harian (tab Keuangan, jika ada data)
        ═══════════════════════════════════════════════════ */}
        {isKeuangan && chartData.length > 0 && (
          <div className="bg-gradient-to-br from-bm-charcoal-800 to-bm-charcoal-900 rounded-2xl border border-white/[0.06] p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <IconChartBar className="w-4 h-4 text-bm-gold-400" />
                Pendapatan Harian
              </h3>
              <span className="text-xs text-white/40">
                {chartData.length} hari
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="laporanBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#EAB308" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : String(v)}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(250,204,21,0.08)' }} />
                <Bar
                  dataKey="total"
                  fill="url(#laporanBarGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Info banner untuk tab Riwayat */}
        {!isKeuangan && (
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-5 py-4 border border-blue-100 dark:border-blue-800">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
              <IconHistory className="w-[18px] h-[18px]" />
            </div>
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                Riwayat Semua Transaksi — termasuk yang batal & dalam proses
              </p>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {orders.meta.total} transaksi ditemukan
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            3. FILTER BAR — Compact Inline
        ═══════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            {/* Date Range */}
            <div className="flex items-end gap-2 flex-1 min-w-0">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Dari</label>
                <input
                  type="date"
                  value={dari}
                  onChange={(e) => setDari(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-bm-gold-400/50 focus:border-bm-gold-400
                             transition-colors duration-150"
                />
              </div>
              <span className="text-gray-300 dark:text-gray-600 text-sm pb-2.5">—</span>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sampai</label>
                <input
                  type="date"
                  value={sampai}
                  min={dari}
                  onChange={(e) => setSampai(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-bm-gold-400/50 focus:border-bm-gold-400
                             transition-colors duration-150"
                />
              </div>
            </div>

            {/* Tipe Pesanan */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tipe</label>
              <select
                value={tipe}
                onChange={(e) => setTipe(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-bm-gold-400/50 focus:border-bm-gold-400
                           transition-colors duration-150 min-w-[140px]"
              >
                {TIPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilter}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-bm-gold-400 hover:bg-bm-gold-500 text-bm-charcoal-900 shadow-soft
                           transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5"
              >
                Terapkan
              </button>
              <button
                onClick={resetFilter}
                className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-600
                           text-bm-charcoal-800 dark:text-gray-300 hover:bg-bm-cream dark:hover:bg-gray-800
                           transition-colors duration-150"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            4. TABEL TRANSAKSI — Modernized
        ═══════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Table Header Label */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Daftar Transaksi
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {orders.meta.total} transaksi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bm-cream dark:bg-gray-800/50">
                  {tableHeaders.map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-bm-text-muted dark:text-gray-400 uppercase tracking-[0.08em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Loading skeleton */}
                {isLoading ? (
                  <SkeletonRows cols={tableHeaders.length} rows={5} />
                ) : orders.data.length === 0 ? (
                  /* Empty state */
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-5 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <IconReceipt className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Belum ada transaksi
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Coba ubah filter tanggal atau tipe pesanan
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* Data rows */
                  orders.data.map((order) => {
                    const tBadge = tipeBadge(order.tipe_pesanan);
                    const sBadge = statusBadge(order.status_pesanan);
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 dark:border-gray-800 last:border-b-0
                                   hover:bg-bm-cream dark:hover:bg-amber-900/5 transition-colors duration-150"
                      >
                        {/* # */}
                        <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                          #{order.id}
                        </td>
                        {/* Pelanggan */}
                        <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                          {order.user?.name ?? '—'}
                        </td>
                        {/* Tanggal */}
                        <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(order.tanggal_pesan).toLocaleDateString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        {/* Total */}
                        <td className="px-5 py-3.5 font-bold text-bm-red-600 whitespace-nowrap text-right tabular-nums">
                          {formatRupiah(order.total_harga)}
                        </td>
                        {/* Metode */}
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs">
                            <MetodeIcon metode={order.metode_pembayaran} />
                            {order.metode_pembayaran}
                          </span>
                        </td>
                        {/* Tipe Pesanan — custom colored badge */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${tipeBadgeClass(order.tipe_pesanan)}`}>
                            {tBadge.label}
                          </span>
                        </td>
                        {/* Kolom Status — hanya muncul di tab Riwayat */}
                        {!isKeuangan && (
                          <td className="px-5 py-3.5">
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
          <div className="px-5 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
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