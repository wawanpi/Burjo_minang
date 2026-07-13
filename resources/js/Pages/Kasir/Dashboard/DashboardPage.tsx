// resources/js/Pages/Kasir/Dashboard/DashboardPage.tsx
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

interface AntreanItem {
  id: number;
  waktu: string;
  pelanggan: string;
  status: string;
  total: number;
  waktu_pengambilan: string | null;
  sisa_menit: number | null;
}

interface Props {
  stats: {
    pesanan_diproses: number;
    harus_diselesaikan: number;
    pesanan_selesai: number;
    pesanan_hari_ini: number;
  };
  antrean_terbaru: AntreanItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const renderDeadline = (sisa: number | null, target: string | null) => {
  if (sisa === null || target === null) {
    return <span className="text-xs text-gray-400 italic">—</span>;
  }

  // Tentukan style baris kedua berdasarkan sisa waktu
  let subtitleClass = 'text-emerald-600';
  let subtitleText = `Sisa ${sisa} menit`;

  if (sisa <= 0) {
    subtitleClass = 'text-red-600 font-bold animate-pulse';
    subtitleText = `Terlambat ${Math.abs(sisa)} menit`;
  } else if (sisa <= 15) {
    subtitleClass = 'text-orange-500 font-medium';
    subtitleText = `Sisa ${sisa} menit`;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-bold text-gray-900 text-sm">
        {new Date(target).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
      </span>
      <span className={`text-[11px] tracking-wide ${subtitleClass}`}>{subtitleText}</span>
    </div>
  );
};

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  menunggu_pembayaran: {
    label: 'Menunggu',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  diproses: {
    label: 'Diproses',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
  },
  selesai: {
    label: 'Selesai',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-600',
    dot: 'bg-red-500',
  },
};

// ─── Stat Icon Components ─────────────────────────────────────────────────────
const IconPesananDiproses = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconHarusDiselesaikan = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconSelesai = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconHariIni = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage({ stats, antrean_terbaru }: Props) {
  const cards: StatCardData[] = [
    {
      label: 'Pesanan Diproses',
      value: stats.pesanan_diproses.toLocaleString('id-ID'),
      sub: 'Sedang disiapkan dapur',
      icon: <IconPesananDiproses />,
      color: 'gold',
      live: true,
      liveColor: 'gold',
    },
    {
      label: 'Harus Diselesaikan',
      value: stats.harus_diselesaikan.toLocaleString('id-ID'),
      sub: 'Pesanan baru / butuh tindakan',
      icon: <IconHarusDiselesaikan />,
      color: 'red',
      live: true,
      liveColor: 'red',
    },
    {
      label: 'Pesanan Selesai',
      value: stats.pesanan_selesai.toLocaleString('id-ID'),
      sub: 'Hari ini',
      icon: <IconSelesai />,
      color: 'teal',
      live: true,
      liveColor: 'success',
    },
    {
      label: 'Total Pesanan Hari Ini',
      value: stats.pesanan_hari_ini.toLocaleString('id-ID'),
      sub: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
      icon: <IconHariIni />,
      color: 'charcoal',
    },
  ];

  return (
    <OwnerLayout title="Dashboard Kasir">
      <div className="space-y-8 animate-page-enter">
        {/* ─── Page Header ───────────────────────────────────────────────────────── */}
        <div>
          <span className="bm-eyebrow block mb-2">Operasional Kasir</span>
          <h2 className="text-3xl sm:text-[34px] font-serif font-bold text-bm-charcoal-900 tracking-tight leading-snug">
            Selamat datang kembali.
          </h2>
          <div className="bm-gold-underline mt-3" />
          <p className="text-sm sm:text-base text-bm-text-muted mt-3 font-medium">
            Pantau status pesanan dan selesaikan transaksi dengan cepat.
          </p>
        </div>

        {/* ─── Stat Cards Grid ───────────────────────────────────────────────────── */}
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

        {/* ─── Tabel Antrean Pesanan Terbaru ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-elevated transition-all duration-300 border border-black/[0.05] overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center justify-between px-6 lg:px-8 pt-7 pb-5">
            <div className="flex items-center gap-2.5">
              <span className="text-bm-gold-500 text-base leading-none select-none">📋</span>
              <div>
                <h2 className="text-xl lg:text-[22px] font-serif font-bold text-bm-charcoal-900">
                  Antrean Pesanan Terbaru
                </h2>
                <p className="bm-eyebrow mt-1">Hari ini — prioritas tertinggi di atas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-bm-text-muted uppercase tracking-widest px-3.5 py-2 bg-bm-cream rounded-full border border-black/[0.05]">
              <span className="inline-block w-2 h-2 rounded-full bg-bm-gold-500 shadow-[0_0_8px_rgba(202,138,4,0.5)] animate-pulse" />
              Live
            </div>
          </div>

          {/* Table */}
          <div className="px-6 lg:px-8 pb-7">
            {antrean_terbaru.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bm-cream mb-4">
                  <svg className="w-7 h-7 text-bm-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-bm-charcoal-700">Belum ada pesanan hari ini</p>
                <p className="text-xs text-bm-text-muted mt-1">Pesanan baru akan muncul di sini secara otomatis.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bm-cream/60">
                      <th className="text-left px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-widest text-bm-text-muted">ID Pesanan</th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-widest text-bm-text-muted">Waktu</th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-widest text-bm-text-muted">Pelanggan</th>
                      <th className="text-left px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-widest text-bm-text-muted">Status</th>
                      <th className="text-center px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-widest text-bm-text-muted">Jam Ambil</th>
                      <th className="text-right px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-widest text-bm-text-muted">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {antrean_terbaru.map((item, idx) => {
                      const cfg = statusConfig[item.status] ?? {
                        label: item.status,
                        bg: 'bg-gray-50 border-gray-200',
                        text: 'text-gray-600',
                        dot: 'bg-gray-400',
                      };
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-bm-cream/30 transition-colors duration-200"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <td className="px-5 py-4">
                            <span className="font-bold text-bm-charcoal-800 tracking-wide">#ORD-{String(item.id).padStart(4, '0')}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-bm-text-muted font-medium">{item.waktu}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-bm-charcoal-700">{item.pelanggan}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {renderDeadline(item.sisa_menit, item.waktu_pengambilan)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-bold text-bm-charcoal-900">{formatRupiah(item.total)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}