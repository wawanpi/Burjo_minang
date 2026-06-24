// resources/js/Pages/Owner/Dashboard/DashboardPage.tsx
import { Head } from '@inertiajs/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

import OwnerLayout from '@/Layouts/OwnerLayout';
import StatCard from '@/Components/Owner/StatCard';

// ─── Types ────────────────────────────────────────────────────────────────────
type StatColor = 'red' | 'gold' | 'charcoal' | 'teal';

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

interface Props {
  stats: {
    total_pendapatan: number;
    jumlah_pesanan: number;
    pesanan_hari_ini: number;
    pendapatan_bulan: number;
  };
  chart_data: ChartPoint[]; // 30 hari terakhir
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage({ stats, chart_data }: Props) {
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
          <div className="flex items-center justify-between px-6 lg:px-8 pt-7 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-bm-gold-500 text-base leading-none select-none">✦</span>
              <div>
                <h2 className="text-xl lg:text-[22px] font-serif font-bold text-bm-charcoal-900">
                  Tren Pendapatan
                </h2>
                <p className="bm-eyebrow mt-1">30 hari terakhir</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-bm-text-muted uppercase tracking-widest px-3.5 py-2 bg-bm-cream rounded-full border border-black/[0.05]">
              <span className="inline-block w-2 h-2 rounded-full bg-bm-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] animate-pulse" />
              Pendapatan
            </div>
          </div>

          {/* Chart Area */}
          <div className="px-4 pb-6 pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chart_data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
      </div>
    </OwnerLayout>
  );
}