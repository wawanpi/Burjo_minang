// resources/js/Pages/Owner/Dashboard/DashboardPage.tsx
import { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

import OwnerLayout from '@/Layouts/OwnerLayout';
import StatCard from '@/Components/Owner/StatCard';

// ─── Types ────────────────────────────────────────────────────────────────────
type StatColor = 'red' | 'gold' | 'charcoal' | 'teal';
type ChartRange = 7 | 30;

interface StatCardData {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: StatColor;
  live?: boolean;
  liveColor?: 'success' | 'gold' | 'red';
}

interface ChartPoint {
  tanggal: string;  // 'DD MMM'
  pendapatan: number;
}

interface RecentOrder {
  id: number;
  pelanggan: string;
  tanggal: string;
  total: number;
  tipe_pesanan: string;
  status_pesanan: string;
  metode_pembayaran: string;
}

interface MenuTerlaris {
  id: number;
  nama_menu: string;
  kategori: string;
  gambar: string | null;
  total_terjual: number;
  total_pendapatan: number;
  persen: number;
}

interface Props {
  stats: {
    total_pendapatan: number;
    jumlah_pesanan: number;
    pesanan_hari_ini: number;
    pendapatan_bulan: number;
    pesanan_pending: number;
  };
  chart_data: ChartPoint[]; // 30 hari terakhir
  recent_orders: RecentOrder[];
  menu_terlaris: MenuTerlaris[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bm-charcoal-900 rounded-lg px-4 py-2.5 shadow-elevated border border-white/10">
      <p className="text-[11px] text-bm-gold-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold text-white">{formatRupiah(payload[0].value)}</p>
    </div>
  );
};

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  menunggu_pembayaran: { label: 'Menunggu',  badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  diproses:            { label: 'Diproses',  badge: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500' },
  selesai:             { label: 'Selesai',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  batal:               { label: 'Batal',     badge: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-500' },
};

const tipeLabel: Record<string, string> = {
  dine_in: 'Dine In',
  take_away: 'Take Away',
  online: 'Online',
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? { label: status, badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Stat Icon Components ─────────────────────────────────────────────────────
const IconPendapatan = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconBulan = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconPesanan = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const IconHariIni = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconFire = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
);

const IconReceipt = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2Z" />
    <path strokeLinecap="round" d="M14 8H10M14 12H10M12 16H10" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage({ stats, chart_data, recent_orders = [], menu_terlaris = [] }: Props) {
  const [range, setRange] = useState<ChartRange>(30);

  // Data 7 hari = irisan terakhir dari data 30 hari (tanpa request tambahan)
  const visibleChartData = useMemo(
    () => (range === 7 ? chart_data.slice(-7) : chart_data),
    [chart_data, range],
  );

  const cards: StatCardData[] = [
    {
      label: 'Total Pendapatan',
      value: formatRupiah(stats.total_pendapatan),
      sub: 'Semua waktu (lunas)',
      icon: <IconPendapatan />,
      color: 'red',
      live: true,
      liveColor: 'red',
    },
    {
      label: 'Pendapatan Bulan Ini',
      value: formatRupiah(stats.pendapatan_bulan),
      sub: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      icon: <IconBulan />,
      color: 'gold',
      live: true,
      liveColor: 'gold',
    },
    {
      label: 'Total Pesanan',
      value: stats.jumlah_pesanan.toLocaleString('id-ID'),
      sub: 'Semua status',
      icon: <IconPesanan />,
      color: 'charcoal',
    },
    {
      label: 'Pesanan Hari Ini',
      value: stats.pesanan_hari_ini.toLocaleString('id-ID'),
      sub: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
      icon: <IconHariIni />,
      color: 'teal',
      live: true,
      liveColor: 'success',
    },
  ];

  return (
    <OwnerLayout title="Dashboard">
      <div className="space-y-8 animate-page-enter">
        {/* ── Page Header ────────────────────────────────── */}
        <div>
          <span className="bm-eyebrow block mb-2">Ringkasan Bisnis</span>
          <h2 className="text-3xl sm:text-[34px] font-serif font-bold text-bm-charcoal-900 tracking-tight leading-snug">
            Selamat datang kembali.
          </h2>
          <div className="bm-gold-underline mt-3" />
          <p className="text-sm sm:text-base text-bm-text-muted mt-3 font-medium">
            Berikut performa bisnis hari ini.
          </p>
        </div>

        {/* ── Stat Cards Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <StatCard
              key={card.label}
              title={card.label}
              value={card.value}
              subLabel={card.sub}
              icon={card.icon}
              color={card.color}
              live={card.live}
              liveColor={card.liveColor}
              delay={i * 80}
            />
          ))}
        </div>

        {/* ── Revenue Trend Chart ────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-elevated transition-all duration-300 border border-black/[0.05] overflow-hidden">
          {/* Chart Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 lg:px-8 pt-7 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-bm-gold-500 text-base leading-none select-none">✦</span>
              <div>
                <h2 className="text-xl lg:text-[22px] font-serif font-bold text-bm-charcoal-900">
                  Tren Pendapatan
                </h2>
                <p className="bm-eyebrow mt-1">{range} hari terakhir</p>
              </div>
            </div>
            {/* Toggle periode 7 / 30 hari */}
            <div className="flex items-center gap-1 bg-bm-cream rounded-full p-1 border border-black/[0.05]">
              {([7, 30] as ChartRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    range === r
                      ? 'bg-bm-charcoal-900 text-bm-gold-400 shadow-soft'
                      : 'text-bm-text-muted hover:text-bm-charcoal-900'
                  }`}
                >
                  {r} Hari
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="px-4 pb-6 pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={visibleChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pendapatanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#990000" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#990000" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="tanggal"
                  tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  dx={-4}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fca5a5', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="pendapatan"
                  stroke="#990000"
                  strokeWidth={3}
                  fill="url(#pendapatanGradient)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#990000', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom Grid: Pesanan Terbaru + Menu Terlaris ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Pesanan Terbaru ── */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-soft hover:shadow-elevated transition-all duration-300 border border-black/[0.05] overflow-hidden flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 lg:px-6 pt-6 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-bm-gold-500 text-base leading-none select-none">✦</span>
                <div>
                  <h2 className="text-lg lg:text-xl font-serif font-bold text-bm-charcoal-900">
                    Pesanan Terbaru
                  </h2>
                  <p className="bm-eyebrow mt-1">5 transaksi terakhir</p>
                </div>
              </div>
              {stats.pesanan_pending > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {stats.pesanan_pending} perlu tindakan
                </span>
              )}
            </div>

            {recent_orders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <IconReceipt className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">Belum ada pesanan masuk.</p>
              </div>
            ) : (
              <>
                {/* Tabel — tablet & desktop */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bm-cream border-y border-black/[0.05]">
                        {['Pesanan', 'Waktu', 'Tipe', 'Status', 'Total'].map((h, idx) => (
                          <th
                            key={h}
                            className={`px-5 py-3 text-[11px] font-semibold text-bm-text-muted uppercase tracking-[0.08em] whitespace-nowrap ${
                              idx === 4 ? 'text-right' : 'text-left'
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05]">
                      {recent_orders.map((order) => (
                        <tr key={order.id} className="hover:bg-bm-cream transition-colors duration-150">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-bm-charcoal-900">{order.pelanggan}</p>
                            <p className="text-[11px] text-bm-text-muted mt-0.5">#{order.id} · {order.metode_pembayaran}</p>
                          </td>
                          <td className="px-5 py-3.5 text-bm-text-muted whitespace-nowrap">{order.tanggal}</td>
                          <td className="px-5 py-3.5 text-bm-text-muted whitespace-nowrap">{tipeLabel[order.tipe_pesanan] ?? order.tipe_pesanan}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={order.status_pesanan} /></td>
                          <td className="px-5 py-3.5 text-right font-bold text-bm-red-600 whitespace-nowrap tabular-nums">
                            {formatRupiah(order.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Kartu bertumpuk — mobile (tanpa horizontal scroll) */}
                <div className="md:hidden divide-y divide-black/[0.05] border-t border-black/[0.05]">
                  {recent_orders.map((order) => (
                    <div key={order.id} className="px-5 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-bm-charcoal-900 truncate">{order.pelanggan}</p>
                          <p className="text-[11px] text-bm-text-muted mt-0.5">
                            #{order.id} · {order.tanggal} · {tipeLabel[order.tipe_pesanan] ?? order.tipe_pesanan}
                          </p>
                        </div>
                        <StatusBadge status={order.status_pesanan} />
                      </div>
                      <p className="font-bold text-bm-red-600 tabular-nums">{formatRupiah(order.total)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Footer link ke Laporan */}
            <div className="mt-auto px-5 lg:px-6 py-4 border-t border-black/[0.05] bg-bm-cream/50">
              <Link
                href="/owner/laporan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-bm-charcoal-900 uppercase tracking-wider hover:text-bm-red-600 transition-colors duration-200 group"
              >
                Lihat semua transaksi
                <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Menu Terlaris ── */}
          <div className="bg-gradient-to-br from-bm-charcoal-800 to-bm-charcoal-900 rounded-2xl border border-white/[0.06] shadow-soft overflow-hidden flex flex-col">
            <div className="px-5 lg:px-6 pt-6 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-bm-gold-500/15 flex items-center justify-center text-bm-gold-400 flex-shrink-0">
                  <IconFire className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <h2 className="text-lg font-serif font-bold text-white leading-tight">Menu Terlaris</h2>
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.08em] mt-0.5">
                    Berdasarkan transaksi lunas
                  </p>
                </div>
              </div>
            </div>

            {menu_terlaris.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
                <span className="text-4xl opacity-40">🍽️</span>
                <p className="text-sm text-white/50 italic">Belum ada data penjualan menu.</p>
              </div>
            ) : (
              <div className="flex-1 px-5 lg:px-6 pb-6 space-y-4">
                {menu_terlaris.map((menu, i) => (
                  <div
                    key={menu.id}
                    className="group flex items-center gap-3.5 opacity-0 animate-page-enter"
                    style={{ animationDelay: `${200 + i * 80}ms` }}
                  >
                    {/* Peringkat */}
                    <span className={`w-6 text-center font-serif text-lg font-bold flex-shrink-0 ${
                      i === 0 ? 'text-bm-gold-400' : 'text-white/30'
                    }`}>
                      {i + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105">
                      {menu.gambar ? (
                        <img src={`/storage/${menu.gambar}`} alt={menu.nama_menu} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-lg">🍜</div>
                      )}
                    </div>

                    {/* Nama + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-white truncate">{menu.nama_menu}</p>
                        <p className="text-xs font-bold text-bm-gold-400 whitespace-nowrap tabular-nums">
                          {menu.total_terjual.toLocaleString('id-ID')}<span className="text-white/40 font-medium"> terjual</span>
                        </p>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-bm-gold-500 to-bm-gold-300 transition-all duration-700 ease-out"
                          style={{ width: `${menu.persen}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">{formatRupiah(menu.total_pendapatan)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer link ke Manajemen Menu */}
            <div className="mt-auto px-5 lg:px-6 py-4 border-t border-white/[0.06] bg-black/20">
              <Link
                href="/kasir/menus"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-bm-gold-400 uppercase tracking-wider hover:text-bm-gold-300 transition-colors duration-200 group"
              >
                Kelola menu
                <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
