// resources/js/Pages/Owner/Dashboard/DashboardPage.tsx
import { Head } from '@inertiajs/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ⬇️ Tambahkan import OwnerLayout di sini
import OwnerLayout from '@/Layouts/OwnerLayout'; 

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-amber-600">{formatRupiah(payload[0].value)}</p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage({ stats, chart_data }: Props) {
  const cards: StatCard[] = [
    {
      label: 'Total Pendapatan',
      value: formatRupiah(stats.total_pendapatan),
      sub: 'Semua waktu (lunas)',
      icon: '💰',
      color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    },
    {
      label: 'Pendapatan Bulan Ini',
      value: formatRupiah(stats.pendapatan_bulan),
      sub: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      icon: '📈',
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    },
    {
      label: 'Total Pesanan',
      value: stats.jumlah_pesanan.toLocaleString('id-ID'),
      sub: 'Semua status',
      icon: '🧾',
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    },
    {
      label: 'Pesanan Hari Ini',
      value: stats.pesanan_hari_ini.toLocaleString('id-ID'),
      sub: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
      icon: '🕐',
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
    },
  ];

return (
    <OwnerLayout title="Dashboard">

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang! Berikut ringkasan bisnis hari ini.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.color}`}>
                  Live
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {card.value}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
                {card.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Tren Pendapatan
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            30 hari terakhir
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chart_data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pendapatanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="tanggal"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}     
                />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="pendapatan"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#pendapatanGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </OwnerLayout>
    /* ⬆️ Jangan lupa tutup dengan </OwnerLayout> ⬆️ */
  );
}