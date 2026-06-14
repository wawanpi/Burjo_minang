import { type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatsCardProps {
  /** Label deskriptif di atas value */
  label: string;
  /** Nilai utama yang ditampilkan (string atau number) */
  value: string | number;
  /** Ikon ReactNode, ditampilkan dalam lingkaran 40×40 */
  icon: ReactNode;
  /** Trend opsional: value positif = hijau ▲, negatif = merah ▼ */
  trend?: {
    value: number;
    label: string;
  };
  /** Variant styling: default, success (border hijau), warning (border amber) */
  variant?: 'default' | 'success' | 'warning';
}

// ─── Variant border classes ───────────────────────────────────────────────────
const variantClasses: Record<NonNullable<StatsCardProps['variant']>, string> = {
  default: '',
  success: 'border-l-4 border-l-green-400',
  warning: 'border-l-4 border-l-amber-400',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function StatsCard({ label, value, icon, trend, variant = 'default' }: StatsCardProps) {
  const borderClass = variantClasses[variant];

  return (
    <div
      className={`
        bg-white dark:bg-gray-900
        rounded-xl border border-gray-100 dark:border-gray-800
        p-5 shadow-sm hover:shadow-md
        transition-shadow duration-200
        ${borderClass}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Content */}
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 truncate">
            {label}
          </p>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {value}
          </p>

          {/* Trend indicator */}
          {trend && (
            <p
              className={`text-xs font-medium mt-1.5 flex items-center gap-1 ${
                trend.value >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
              }`}
            >
              <span>{trend.value >= 0 ? '▲' : '▼'}</span>
              <span>
                {trend.value >= 0 ? '+' : ''}
                {trend.value}% {trend.label}
              </span>
            </p>
          )}
        </div>

        {/* Icon circle */}
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;

// ─── Contoh Penggunaan ────────────────────────────────────────────────────────
//
// import StatsCard from '@/Components/StatsCard';
//
// <StatsCard
//   label="Total Pendapatan"
//   value="Rp 12.450.000"
//   icon={<IconCoin className="w-5 h-5" />}
//   trend={{ value: 12.5, label: 'vs bulan lalu' }}
// />
//
// <StatsCard
//   label="Jumlah Transaksi"
//   value={284}
//   icon={<IconReceipt className="w-5 h-5" />}
//   variant="success"
// />
//
// <StatsCard
//   label="Stok Menipis"
//   value={3}
//   icon={<IconAlertTriangle className="w-5 h-5" />}
//   trend={{ value: -8, label: 'vs minggu lalu' }}
//   variant="warning"
// />
