import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────
interface User {
    id: number;
    name: string;
    email: string;
}

interface Payment {
    id: number;
    order_id: number;
    metode_pembayaran: string;
    status_pembayaran: string;
}

interface Order {
    id: number;
    user: User | null;
    payment: Payment | null;
    tanggal_pesan: string;
    total_harga: number;
    tipe_pesanan: string;
}

interface Props {
    orders: Order[];
    totalPendapatan: number;
    tipeFilter: string | null;
    tipeLabel: string;
    dari: string | null;
    sampai: string | null;
}

// ─── Helpers ───────────────────────────────────────────
const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val);

const formatTanggal = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTanggalWaktu = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
};

// ─── Component ─────────────────────────────────────────
export default function LaporanPrint({ orders, totalPendapatan, tipeLabel, dari, sampai }: Props) {
    // Auto print saat halaman terbuka
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500); // Delay slightly to ensure fonts/styles load

        return () => clearTimeout(timer);
    }, []);

    const periodeText = () => {
        if (dari && sampai) return `${formatTanggal(dari)} — ${formatTanggal(sampai)}`;
        if (dari) return `Dari ${formatTanggal(dari)}`;
        if (sampai) return `Sampai ${formatTanggal(sampai)}`;
        return 'Seluruh Periode';
    };

    const getTipeBadge = (tipe: string) => {
        const t = tipe || 'dine_in';
        if (t === 'dine_in') return { label: '🍽️ Dine In', bg: '#dbeafe', color: '#1e40af' };
        if (t === 'take_away') return { label: '🛍️ Take Away', bg: '#fef3c7', color: '#92400e' };
        if (t === 'online') return { label: '🌐 Online', bg: '#d1fae5', color: '#065f46' };
        return { label: t, bg: '#f3f4f6', color: '#374151' };
    };

    return (
        <>
            <Head title="Cetak Laporan Keuangan — Burjo Minang RM" />

            <style>{`
                /* ── Reset & Base ── */
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 12px;
                    color: #1a1a1a;
                    background: #fff;
                    padding: 24px;
                    line-height: 1.5;
                }

                /* ── Header ── */
                .print-header {
                    text-align: center;
                    border-bottom: 2px solid #d97706;
                    padding-bottom: 16px;
                    margin-bottom: 20px;
                }
                .print-header h1 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #92400e;
                    margin-bottom: 4px;
                }
                .print-header p {
                    font-size: 12px;
                    color: #6b7280;
                }

                /* ── Info Box ── */
                .info-box {
                    display: flex;
                    justify-content: space-between;
                    background: #fffbeb;
                    border: 1px solid #fbbf24;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 20px;
                    font-size: 12px;
                }
                .info-box .label { color: #92400e; font-weight: 600; }
                .info-box .value { font-weight: 700; color: #78350f; font-size: 14px; }

                /* ── Table ── */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                thead th {
                    background: #f9fafb;
                    border-bottom: 2px solid #e5e7eb;
                    padding: 8px 10px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                tbody td {
                    padding: 8px 10px;
                    border-bottom: 1px solid #f3f4f6;
                    font-size: 12px;
                    color: #374151;
                }
                tbody tr:hover { background: #f9fafb; }

                /* Tipe Pesanan Badges */
                .badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                }

                /* ── Total Row ── */
                .total-row td {
                    font-weight: 700;
                    font-size: 13px;
                    border-top: 2px solid #e5e7eb;
                    border-bottom: none;
                    padding-top: 10px;
                }

                /* ── Footer ── */
                .print-footer {
                    text-align: center;
                    font-size: 11px;
                    color: #9ca3af;
                    margin-top: 24px;
                    padding-top: 12px;
                    border-top: 1px solid #e5e7eb;
                }

                /* ── Print Styles ── */
                @media print {
                    body { padding: 0; }
                    @page { margin: 15mm; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div>
                {/* Header */}
                <div className="print-header">
                    <h1>📊 Laporan Keuangan — Burjo Minang RM</h1>
                    <p>
                        Periode: {periodeText()} &nbsp;&middot;&nbsp; Tipe: <strong>{tipeLabel}</strong> &nbsp;&middot;&nbsp; Semua transaksi <strong>Lunas</strong>
                    </p>
                    <p style={{ marginTop: '4px', fontSize: '11px' }}>
                        Dicetak: {formatTanggalWaktu(new Date())}
                    </p>
                </div>

                {/* Info Box */}
                <div className="info-box">
                    <div>
                        <span className="label">Total Pendapatan</span>
                    </div>
                    <div>
                        <span className="value">Rp {formatRupiah(totalPendapatan)}</span>
                    </div>
                </div>

                {/* Tabel Transaksi */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th>Pelanggan</th>
                            <th>Tanggal</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th>Metode</th>
                            <th style={{ textAlign: 'center' }}>Tipe Pesanan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                                    Tidak ada data transaksi.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order, i) => {
                                const badge = getTipeBadge(order.tipe_pesanan);
                                return (
                                    <tr key={order.id}>
                                        <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 500 }}>{order.user?.name || '—'}</td>
                                        <td>{formatTanggal(order.tanggal_pesan)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            Rp {formatRupiah(order.total_harga)}
                                        </td>
                                        <td>{order.payment?.metode_pembayaran || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span 
                                                className="badge" 
                                                style={{ background: badge.bg, color: badge.color }}
                                            >
                                                {badge.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}

                        {orders.length > 0 && (
                            <tr className="total-row">
                                <td colSpan={3} style={{ textAlign: 'right' }}>
                                    Total ({orders.length} transaksi)
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    Rp {formatRupiah(totalPendapatan)}
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="print-footer">
                    <p>Dokumen ini digenerate otomatis oleh sistem Burjo Minang RM.</p>
                </div>

                <div className="no-print" style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button 
                        onClick={() => window.print()}
                        style={{
                            padding: '8px 16px',
                            background: '#d97706',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🖨️ Cetak Ulang
                    </button>
                    <button 
                        onClick={() => window.close()}
                        style={{
                            padding: '8px 16px',
                            background: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginLeft: '8px'
                        }}
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </>
    );
}
