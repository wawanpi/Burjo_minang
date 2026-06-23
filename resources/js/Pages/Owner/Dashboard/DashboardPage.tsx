// resources/js/Pages/Owner/Dashboard/DashboardPage.tsx
import { Head } from '@inertiajs/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

import OwnerLayout from '@/Layouts/OwnerLayout';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;       // accent color classes for the icon container
  badgeColor: string;   // badge color classes
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
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-xl shadow-gray-200/50">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{formatRupiah(payload[0].value)}</p>
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
  const cards: StatCard[] = [
    {
      label: 'Total Pendapatan',
      value: formatRupiah(stats.total_pendapatan),
      sub: 'Semua waktu (lunas)',
      icon: <IconPendapatan />,
      accent: 'bg-[#990000]/10 text-[#990000]',
      badgeColor: 'bg-[#fff0f0] text-[#990000]',
    },
    {
      label: 'Pendapatan Bulan Ini',
      value: formatRupiah(stats.pendapatan_bulan),
      sub: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      icon: <IconBulan />,
      accent: 'bg-yellow-400/20 text-yellow-600',
      badgeColor: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Total Pesanan',
      value: stats.jumlah_pesanan.toLocaleString('id-ID'),
      sub: 'Semua status',
      icon: <IconPesanan />,
      accent: 'bg-gray-100 text-gray-600',
      badgeColor: 'bg-gray-100 text-gray-600',
    },
    {
      label: 'Pesanan Hari Ini',
      value: stats.pesanan_hari_ini.toLocaleString('id-ID'),
      sub: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
      icon: <IconHariIni />,
      accent: 'bg-[#990000]/10 text-[#990000]',
      badgeColor: 'bg-[#fff0f0] text-[#990000]',
    },
  ];

  return (
    <OwnerLayout title="Dashboard">
      <div className="space-y-8">
        {/* ── Page Header ────────────────────────────────── */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight leading-snug">
            Selamat datang kembali.
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5 font-medium">
            Berikut performa bisnis hari ini.
          </p>
        </div>

        {/* ── Stat Cards Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className="group bg-gradient-to-br from-white to-gray-50/80 rounded-3xl p-6 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-[#990000]/10 hover:-translate-y-1 transition-all duration-500 cursor-default border border-white/60 relative overflow-hidden"
            >
              {/* Optional background glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-2xl opacity-50 pointer-events-none" />

              {/* Card Top: Icon + Badge */}
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${card.accent} flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm`}>
                  {card.icon}
                </div>
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${card.badgeColor} tracking-widest uppercase shadow-sm`}>
                  Live
                </span>
              </div>

              {/* Value */}
              <p className="text-3xl font-extrabold text-gray-900 leading-tight tracking-tight relative z-10">
                {card.value}
              </p>

              {/* Label */}
              <p className="text-sm font-bold text-gray-600 mt-2 relative z-10">
                {card.label}
              </p>

              {/* Sub Label */}
              <p className="text-xs text-gray-400 mt-1 relative z-10 font-medium">
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Revenue Trend Chart ────────────────────────── */}
        <div className="bg-gradient-to-br from-white to-gray-50/80 rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden hover:shadow-2xl hover:shadow-[#990000]/10 transition-all duration-500 border border-white/60">
          {/* Chart Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900">
                Tren Pendapatan
              </h2>
              <p className="text-xs text-gray-400 mt-1 tracking-wider uppercase font-medium">
                30 hari terakhir
              </p>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-2 bg-gray-50 rounded-full border border-gray-100 shadow-inner">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#990000] shadow-[0_0_8px_rgba(153,0,0,0.4)] animate-pulse" />
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