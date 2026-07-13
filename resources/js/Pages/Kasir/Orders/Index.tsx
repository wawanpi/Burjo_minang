import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';

// ─── Web Audio API Helper ──────────────────────────────────────────────────────
const playAlarm = (type: 'warning' | 'danger') => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'warning') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime); // Suara santai
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1);
        } else {
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // Suara panik/tinggi
            osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        }
    } catch (e) {
        console.warn('Gagal memutar audio Web API:', e);
    }
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
    id: number;
    jumlah: number;
    subtotal: number;
    menu?: { id: number; nama_menu: string; harga: number };
}

interface Payment {
    id: number;
    metode_pembayaran: string;
    status_pembayaran: string;
}

interface Order {
    id: number;
    user?: { id: number; name: string; email?: string; no_hp?: string };
    order_items?: OrderItem[];
    payment?: Payment | null;
    total_harga: number;
    status_pesanan: string;
    tanggal_pesan: string;
    tipe_pesanan: string;
    waktu_pengambilan: string | null;
    sisa_menit: number | null;
    durasi_menit: number | null;
    jumlah_orang: number | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    pesanan_hari_ini: {
        data: Order[];
        links: PaginationLink[];
        total?: number;
    };
    pesanan_po_mendatang: {
        data: Order[];
        links: PaginationLink[];
        total?: number;
    };
    filters: { status?: string };
}

// ─── Config ────────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string }> = {
    menunggu_pembayaran: { label: 'Menunggu Bayar', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15' },
    diproses:           { label: 'Diproses',       color: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/15' },
    selesai:            { label: 'Selesai',         color: 'bg-green-50 text-green-700 ring-1 ring-green-600/15' },
    batal:              { label: 'Batal',           color: 'bg-bm-red-50 text-bm-red-700 ring-1 ring-bm-red-600/15' },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
    pending:     { label: 'Pending',    color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15' },
    lunas:       { label: 'Lunas',      color: 'bg-green-50 text-green-700 ring-1 ring-green-600/15' },
    gagal:       { label: 'Gagal',      color: 'bg-bm-red-50 text-bm-red-700 ring-1 ring-bm-red-600/15' },
    expired:     { label: 'Expired',    color: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10' },
    kadaluarsa:  { label: 'Kadaluarsa', color: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10' },
};

// Warna pill aktif untuk tab filter status
const filterActiveColor: Record<string, string> = {
    '':                  'bg-bm-gold-400 text-bm-charcoal-900',
    menunggu_pembayaran: 'bg-amber-500 text-white',
    diproses:            'bg-sky-500 text-white',
    selesai:             'bg-green-600 text-white',
    batal:               'bg-bm-red-600 text-white',
};

// ─── Presentation helpers (UI-only, no functional logic) ────────────────────────
function StatusGlyph({ status }: { status: string }) {
    const cls = 'w-3 h-3';
    if (status === 'menunggu_pembayaran')
        return (
            <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    if (status === 'selesai')
        return (
            <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
        );
    if (status === 'batal')
        return (
            <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
    return null;
}

function StatusBadge({ status }: { status: string }) {
    const sc = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700 ring-1 ring-gray-500/10' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${sc.color}`}>
            {status === 'diproses' ? (
                <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                </span>
            ) : (
                <StatusGlyph status={status} />
            )}
            {sc.label}
        </span>
    );
}

function PaymentBadge({ payment, align = 'center' }: { payment?: Payment | null; align?: 'center' | 'start' }) {
    const pc = payment
        ? (paymentStatusConfig[payment.status_pembayaran] || { label: payment.status_pembayaran, color: 'bg-gray-100 text-gray-700 ring-1 ring-gray-500/10' })
        : { label: 'Belum Bayar', color: 'bg-gray-100 text-gray-700 ring-1 ring-gray-500/10' };
    const isLunas = payment?.status_pembayaran === 'lunas';
    return (
        <div className={`inline-flex flex-col gap-1 ${align === 'center' ? 'items-center' : 'items-start'}`}>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${pc.color}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isLunas ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                </svg>
                {pc.label}
            </span>
            {payment?.metode_pembayaran && (
                <span className="text-[10px] font-medium text-bm-text-muted">{payment.metode_pembayaran}</span>
            )}
        </div>
    );
}

function ItemList({ items, max = 3, onShowAll }: { items?: OrderItem[]; max?: number; onShowAll?: () => void }) {
    const list = items || [];
    const shown = list.slice(0, max);
    const rest = list.length - shown.length;
    return (
        <ul className="space-y-1">
            {shown.map((item, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-xs leading-relaxed">
                    <span className="min-w-0 text-gray-700 truncate">{item.menu?.nama_menu || 'Menu Dihapus'}</span>
                    <span className="shrink-0 font-semibold text-bm-text-muted tabular-nums">×{item.jumlah}</span>
                </li>
            ))}
            {rest > 0 && (
                <li>
                    <button
                        type="button"
                        onClick={onShowAll}
                        className="inline-flex items-center gap-1 rounded-md bg-bm-cream px-1.5 py-0.5 text-[10px] font-semibold text-bm-text-muted ring-1 ring-black/[0.04] cursor-pointer hover:bg-bm-gold-100 hover:text-bm-charcoal-800 hover:ring-bm-gold-300 transition-all duration-200"
                    >
                        +{rest} item lainnya
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </li>
            )}
        </ul>
    );
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function OrderIndex({ pesanan_hari_ini, pesanan_po_mendatang, filters }: Props) {
    const { flash } = usePage().props as any;
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [activeTab, setActiveTab] = useState<'hari_ini' | 'po'>('hari_ini');
    
    // ─── AUDIO ALERTS STATE ────────────────────────────────────────────────────
    const [alerted10Min, setAlerted10Min] = useState<number[]>([]);
    const [alerted5Min, setAlerted5Min] = useState<number[]>([]);

    // ─── MODAL DETAIL PESANAN STATE ───────────────────────────────────────────
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openDetailModal = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedOrder(null), 200); // Bersihkan setelah animasi tutup
    };

    const orderData = activeTab === 'po' ? pesanan_po_mendatang.data : pesanan_hari_ini.data;

    // Logika Evaluasi Waktu & Audio
    useEffect(() => {
        let play10m = false;
        let play5m = false;
        let newAlerted10Min = [...alerted10Min];
        let newAlerted5Min = [...alerted5Min];

        orderData.forEach(order => {
            // Evaluasi hanya untuk pesanan yang "diproses"
            if (order.status_pesanan !== 'diproses') return;

            let isWarning = false;
            let isDanger = false;

            if (order.waktu_pengambilan && order.sisa_menit !== null) {
                // Ada waktu ambil: <= 5 menit lagi ATAU sudah lewat (negatif) -> danger
                if (order.sisa_menit <= 5) {
                    isDanger = true;
                }
            } else if (!order.waktu_pengambilan && order.durasi_menit !== null) {
                // Offline: >= 15 mins -> danger, == 10 mins (atau >= 10 and < 15) -> warning
                if (order.durasi_menit >= 15) {
                    isDanger = true;
                } else if (order.durasi_menit >= 10) {
                    isWarning = true;
                }
            }

            if (isDanger && !newAlerted5Min.includes(order.id)) {
                play5m = true;
                newAlerted5Min.push(order.id);
            } else if (isWarning && !isDanger && !newAlerted10Min.includes(order.id)) {
                play10m = true;
                newAlerted10Min.push(order.id);
            }
        });

        if (play5m) {
            playAlarm('danger');
            setAlerted5Min(newAlerted5Min);
        } else if (play10m) {
            playAlarm('warning');
            setAlerted10Min(newAlerted10Min);
        }
    }, [orderData]);

    // Helper Fungsi Row Styling
    const getRowStyle = (order: Order) => {
        if (order.status_pesanan === 'selesai' || order.status_pesanan === 'batal')
            return 'hover:bg-bm-cream transition-colors duration-150';

        if (order.status_pesanan === 'diproses') {
            if (order.waktu_pengambilan && order.sisa_menit !== null) {
                if (order.sisa_menit <= 5) {
                    return 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100/70 transition-colors duration-150';
                }
            } else if (!order.waktu_pengambilan && order.durasi_menit !== null) {
                if (order.durasi_menit >= 15) {
                    return 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100/70 transition-colors duration-150';
                } else if (order.durasi_menit >= 10) {
                    return 'bg-yellow-50 border-l-4 border-yellow-400 hover:bg-yellow-100/70 transition-colors duration-150';
                }
            }
        }

        return 'hover:bg-bm-cream transition-colors duration-150';
    };

    const formatRupiah = (val: number | string) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

    // Format ringkas "27 Jun, 22.19" agar tidak wrap 3 baris
    const formatTanggalShort = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const tgl = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' });
        const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        return `${tgl}, ${jam}`;
    };

    // Aksen kartu (mobile) — mengikuti kondisi SLA yang sama dengan getRowStyle
    const getCardStyle = (order: Order) => {
        const base = 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated';
        if (order.status_pesanan === 'diproses') {
            if (order.waktu_pengambilan && order.sisa_menit !== null) {
                if (order.sisa_menit <= 5)
                    return `${base} border-red-300 bg-red-50 ring-1 ring-red-200`;
            } else if (!order.waktu_pengambilan && order.durasi_menit !== null) {
                if (order.durasi_menit >= 15)
                    return `${base} border-red-300 bg-red-50 ring-1 ring-red-200`;
                if (order.durasi_menit >= 10)
                    return `${base} border-yellow-300 bg-yellow-50 ring-1 ring-yellow-200`;
            }
        }
        return `${base} border-black/[0.06] bg-white`;
    };

    const handleFilterStatus = (status: string) => {
        setSelectedStatus(status);
        router.get('/kasir/orders', status ? { status } : {}, { preserveState: true, replace: true });
    };

    const handleUpdateStatus = (order: Order, newStatus: string) => {
        const labels: Record<string, string> = { 
            menunggu_pembayaran: 'Tunggu Bayar', 
            diproses: 'Diproses', 
            selesai: 'Selesai', 
            batal: 'Dibatalkan' 
        };
        if (!window.confirm(`Ubah status pesanan #${order.id} menjadi "${labels[newStatus]}"?`)) return;

        router.patch(`/kasir/orders/${order.id}/status`, {
            status_pesanan: newStatus,
        }, { preserveScroll: true, preserveState: true });
    };

    const handlePrintNota = (orderId: number) => {
        window.open(`/kasir/orders/${orderId}/nota`, '_blank');
    };

    // ─── FILTERING OPTIONS LOGIC (BUSINESS RULES) ──────────────
    const renderStatusOptions = (order: Order) => {
        const paymentLunas = order.payment?.status_pembayaran === 'lunas';
        const currentStatus = order.status_pesanan;

        const options = [
            { value: 'menunggu_pembayaran', label: 'Tunggu Bayar' },
            { value: 'diproses', label: 'Diproses' },
            { value: 'selesai', label: 'Selesai' },
            { value: 'batal', label: 'Batal' }
        ];

        return options.map(opt => {
            let disabled = false;

            // Aturan 1: Lunas tidak bisa kembali menunggu pembayaran
            if (paymentLunas && opt.value === 'menunggu_pembayaran') disabled = true;

            // Aturan 2: Jika sedang diproses, tidak bisa kembali ke menunggu_pembayaran
            if (currentStatus === 'diproses' && opt.value === 'menunggu_pembayaran') disabled = true;

            // Pengaman 3: Jika sudah selesai atau batal, menu di-lock secara ketat
            if (currentStatus === 'selesai' && opt.value !== 'selesai') {
                if (opt.value === 'menunggu_pembayaran' || opt.value === 'diproses') disabled = true;
            }
            if (currentStatus === 'batal' && opt.value !== 'batal') disabled = true;

            if (opt.value === currentStatus) disabled = false; // Current status is always visible/selected

            return (
                <option key={opt.value} value={opt.value} disabled={disabled} className={disabled ? "text-gray-300 bg-gray-50" : "text-gray-900"}>
                    {opt.label} {disabled && opt.value !== currentStatus ? '(Terkunci)' : ''}
                </option>
            );
        });
    };

    // ─── Kolom Waktu Pesan (ringkas: hanya jam) ─────────────────────────────────
    const renderWaktuPesan = (order: Order) => {
        if (!order.tanggal_pesan) return <span className="text-gray-400">-</span>;
        const d = new Date(order.tanggal_pesan);
        const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return (
            <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                {jam}
            </span>
        );
    };

    // ─── Kolom Jam Ambil (jam + timer badge) ────────────────────────────────────
    const renderJamAmbil = (order: Order) => {
        // Pesanan dengan waktu pengambilan: tampilkan jam ambil + hitung mundur (Bug E-1)
        if (order.waktu_pengambilan) {
            const d = new Date(order.waktu_pengambilan);
            const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
            const sisa = order.sisa_menit;
            const isLate = sisa !== null && sisa <= 0;              // sudah lewat waktu ambil
            const isUrgent = sisa !== null && sisa <= 5 && sisa > 0; // < 5 menit lagi
            return (
                <div className="space-y-1">
                    <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {jam} <span className="text-gray-400 font-normal text-xs">WIB</span>
                    </div>
                    {sisa !== null && order.status_pesanan === 'diproses' && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                            (isLate || isUrgent) ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-sky-50 text-sky-700'
                        }`}>
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isLate ? `Terlambat ${Math.abs(Math.round(sisa))} mnt` : `Sisa ${Math.round(sisa)} mnt`}
                        </span>
                    )}
                </div>
            );
        }

        // Offline orders: tampilkan timer berjalan jika diproses
        if (!order.waktu_pengambilan && order.durasi_menit !== null && order.status_pesanan === 'diproses') {
            const isLate = order.durasi_menit >= 15;
            return (
                <div className="space-y-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                        isLate ? 'bg-red-100 text-red-700 animate-pulse' : order.durasi_menit >= 10 ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'
                    }`}>
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Berjalan {Math.round(order.durasi_menit)} mnt
                    </span>
                </div>
            );
        }

        return <span className="text-gray-300 text-xs">—</span>;
    };

    // ─── Kolom Aksi — handler & kondisi disabled 100% sama, hanya tata letaknya ──
    const renderActions = (order: Order, variant: 'table' | 'card' = 'table') => {
        const wrap = variant === 'card'
            ? 'flex items-center gap-2 w-full'
            : 'flex items-center justify-end gap-2';

        if (order.status_pesanan === 'batal') {
            return (
                <div className={wrap}>
                    <button
                        onClick={() => openDetailModal(order)}
                        aria-label={`Lihat detail pesanan #${order.id}`}
                        title="Detail Pesanan"
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-colors whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className={variant === 'table' ? 'hidden 2xl:inline' : ''}>Detail</span>
                    </button>
                </div>
            );
        }

        const showWaiting = order.payment?.metode_pembayaran !== 'Tunai' && order.status_pesanan === 'menunggu_pembayaran';

        return (
            <div className={wrap}>
                {showWaiting ? (
                    <div
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 opacity-80 cursor-not-allowed select-none whitespace-nowrap"
                        title="Menunggu konfirmasi otomatis dari Midtrans"
                        aria-disabled="true"
                    >
                        <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Menunggu Sistem…
                    </div>
                ) : order.status_pesanan !== 'selesai' ? (
                    <select
                        value={order.status_pesanan}
                        onChange={(e) => handleUpdateStatus(order, e.target.value)}
                        aria-label={`Ubah status pesanan #${order.id}`}
                        className="flex-1 min-w-0 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-bm-charcoal-800 shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all cursor-pointer"
                    >
                        {renderStatusOptions(order)}
                    </select>
                ) : null}

                {/* Tombol Detail Pesanan */}
                <button
                    onClick={() => openDetailModal(order)}
                    aria-label={`Lihat detail pesanan #${order.id}`}
                    title="Detail Pesanan"
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-700 hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-colors whitespace-nowrap"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className={variant === 'table' ? 'hidden 2xl:inline' : ''}>Detail</span>
                </button>

                {order.status_pesanan !== 'menunggu_pembayaran' && (
                    <button
                        onClick={() => handlePrintNota(order.id)}
                        aria-label={`Cetak nota pesanan #${order.id}`}
                        title="Cetak Nota"
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-bm-charcoal-800/15 bg-white text-xs font-semibold text-bm-charcoal-800 hover:bg-bm-charcoal-900 hover:text-white hover:border-bm-charcoal-900 transition-colors whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span className={variant === 'table' ? 'hidden 2xl:inline' : ''}>Cetak Nota</span>
                    </button>
                )}
            </div>
        );
    };

    // Chip tipe pesanan (dipakai tabel & kartu)
    const renderTipeChip = (order: Order) => (
        <span className="inline-flex items-center text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide bg-gray-100 text-gray-600">
            {order.tipe_pesanan === 'dine_in'
                ? `DINE IN (${order.jumlah_orang || 1} ORANG)`
                : order.tipe_pesanan.replace('_', ' ')}
        </span>
    );

    const paginationLinks = activeTab === 'po' ? pesanan_po_mendatang.links : pesanan_hari_ini.links;

    return (
        <OwnerLayout title="Manajemen Pesanan">
            <Head title="Manajemen Pesanan" />

            {/* Pengaman terakhir: tidak ada scroll horizontal di lebar mana pun */}
            <div className="w-full overflow-x-hidden">

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 flex items-center gap-2 animate-toast-in">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {flash.success}
                </div>
            )}
            
            {flash?.error && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2 animate-toast-in">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{flash.error}</span>
                </div>
            )}

            {/* Header + Tabs + Filter */}
            <div className="mb-6 flex flex-col gap-5 animate-page-enter">
                {/* Bagian Atas: Judul & Tab */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <span className="bm-eyebrow block mb-1.5">Operasional</span>
                        <div className="flex items-center gap-2.5">
                            <span className="text-bm-gold-500 text-lg leading-none select-none">✦</span>
                            <h2 className="text-lg lg:text-xl font-serif font-bold text-bm-charcoal-900 leading-tight tracking-tight">Daftar Pesanan</h2>
                        </div>
                        <div className="bm-gold-underline mt-3" />
                        <div className="mt-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-bm-charcoal-900 px-3 py-1 text-xs font-semibold text-white">
                                <span className="text-bm-gold-400">✦</span>
                                {(activeTab === 'po' ? pesanan_po_mendatang.total : pesanan_hari_ini.total) || orderData.length} pesanan ditemukan
                            </span>
                        </div>
                    </div>

                    {/* Tabs: Hari Ini vs PO */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit shrink-0">
                        <button
                            onClick={() => setActiveTab('hari_ini')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                                activeTab === 'hari_ini'
                                    ? 'bg-white text-bm-red-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Antrean Hari Ini
                        </button>
                        <button
                            onClick={() => setActiveTab('po')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                                activeTab === 'po'
                                    ? 'bg-white text-bm-red-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            PO Mendatang
                        </button>
                    </div>
                </div>

                {/* Bagian Bawah: Filter Status */}
                <div className="flex items-center gap-2 flex-wrap justify-start">
                    <button
                        onClick={() => handleFilterStatus('')}
                        aria-pressed={selectedStatus === ''}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                            selectedStatus === ''
                                ? 'bg-bm-charcoal-900 text-white shadow-soft ring-2 ring-bm-charcoal-900/20 ring-offset-1'
                                : 'bg-white border border-gray-300 text-bm-text-muted hover:bg-bm-cream hover:border-gray-400 hover:text-bm-charcoal-800'
                        }`}
                    >
                        Semua
                    </button>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => handleFilterStatus(key)}
                            aria-pressed={selectedStatus === key}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                selectedStatus === key
                                    ? `${filterActiveColor[key]} shadow-soft ring-2 ring-black/10 ring-offset-1`
                                    : 'bg-white border border-gray-300 text-bm-text-muted hover:bg-bm-cream hover:border-gray-400 hover:text-bm-charcoal-800'
                            }`}
                        >
                            {cfg.label}
                        </button>
                    ))}
                </div>
            </div>

            {orderData.length === 0 ? (
                /* ── Empty State ───────────────────────────────────────────── */
                <div className="rounded-2xl border border-dashed border-black/[0.1] bg-white shadow-soft px-6 py-16 text-center animate-page-enter">
                    <div className="flex flex-col items-center gap-4 text-bm-text-muted">
                        <svg className="w-24 h-24 animate-float" viewBox="0 0 96 96" fill="none" aria-hidden="true">
                            {/* Mangkuk burjo line-art */}
                            <path d="M20 46h56c0 14-10 26-28 26S20 60 20 46z" stroke="#1F2730" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FAF7F2" />
                            <path d="M38 72l-3 8M58 72l3 8" stroke="#1F2730" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M16 46h64" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" />
                            {/* Uap */}
                            <path d="M40 34c0-4 3-4 3-8s-3-4-3-8" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                            <path d="M50 36c0-4 3-4 3-8s-3-4-3-8" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                            <path d="M60 34c0-4 3-4 3-8s-3-4-3-8" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                        </svg>
                        <div>
                            <p className="font-serif text-xl text-bm-charcoal-800 mb-1">
                                {selectedStatus
                                    ? `Tidak ada pesanan "${statusConfig[selectedStatus]?.label || selectedStatus}"`
                                    : 'Belum ada pesanan masuk'}
                            </p>
                            <p className="text-sm">
                                {selectedStatus
                                    ? 'Coba lihat status lain atau tampilkan semua pesanan.'
                                    : 'Pesanan baru akan muncul di sini secara otomatis.'}
                            </p>
                        </div>
                        {selectedStatus && (
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bm-charcoal-900 text-sm font-semibold text-white hover:bg-bm-charcoal-800 transition-colors shadow-soft"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Tampilkan Semua
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* ── Desktop lebar (≥1280px): Tabel, header sticky, scroll samping bila sempit ── */}
                    <div className="hidden xl:block overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-soft w-full animate-page-enter">
                        <div className="max-h-[68vh] overflow-y-auto overflow-x-auto custom-scrollbar">
                            <table className="w-full min-w-[1080px] table-fixed divide-y divide-gray-200">
                                <colgroup>
                                    <col className="w-[8%]" />
                                    <col className="w-[12%]" />
                                    <col className="w-[15%]" />
                                    <col className="w-[9%]" />
                                    <col className="w-[12%]" />
                                    <col className="w-[7%]" />
                                    <col className="w-[13%]" />
                                    <col className="w-[24%]" />
                                </colgroup>
                                <thead className="bg-bm-cream sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                                    <tr>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Tipe Pesanan</th>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Pelanggan</th>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Item Pesanan</th>
                                        <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Total</th>
                                        <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Status / Bayar</th>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Waktu Pesan</th>
                                        <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Jam Ambil</th>
                                        <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/[0.05]">
                                    {orderData.map((order) => (
                                        <tr key={order.id} className={getRowStyle(order)}>
                                            <td className="px-4 py-5 align-top">
                                                {renderTipeChip(order)}
                                            </td>
                                            <td className="px-4 py-5 align-top">
                                                <div className="text-sm font-medium text-gray-900 truncate" title={order.user?.name || 'Guest'}>{order.user?.name || 'Guest'}</div>
                                                <div className="text-xs text-gray-600 truncate" title={order.user?.no_hp || order.user?.email || '-'}>{order.user?.no_hp || order.user?.email || '-'}</div>
                                            </td>
                                            <td className="px-4 py-5 align-top">
                                                <ItemList items={order.order_items} onShowAll={() => openDetailModal(order)} />
                                            </td>
                                            <td className="px-4 py-5 align-top text-right text-sm font-bold text-bm-red-600 whitespace-nowrap">
                                                {formatRupiah(order.total_harga)}
                                            </td>
                                            <td className="px-4 py-5 align-top">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <StatusBadge status={order.status_pesanan} />
                                                    <PaymentBadge payment={order.payment} align="center" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 align-top whitespace-nowrap">
                                                {renderWaktuPesan(order)}
                                            </td>
                                            <td className="px-4 py-5 align-top whitespace-nowrap">
                                                {renderJamAmbil(order)}
                                            </td>
                                            <td className="px-4 py-5 align-top">
                                                {renderActions(order, 'table')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── iPad & HP (<1280px): Kartu vertikal, 1 kolom (HP) / 2 kolom (tablet) ── */}
                    <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4 animate-page-enter">
                        {orderData.map((order) => (
                            <article
                                key={order.id}
                                className={`rounded-2xl border p-4 shadow-soft ${getCardStyle(order)}`}
                            >
                                {/* Header kartu: ID + tipe + status */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-mono font-bold text-gray-900">#{order.id}</span>
                                        {renderTipeChip(order)}
                                    </div>
                                    <StatusBadge status={order.status_pesanan} />
                                </div>

                                <div className="my-3 border-t border-dashed border-black/[0.08]" />

                                {/* Body kartu */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate" title={order.user?.name || 'Guest'}>{order.user?.name || 'Guest'}</div>
                                            <div className="text-xs text-gray-600 truncate" title={order.user?.no_hp || order.user?.email || '-'}>{order.user?.no_hp || order.user?.email || '-'}</div>
                                        </div>
                                        <PaymentBadge payment={order.payment} align="start" />
                                    </div>

                                    <div className="rounded-xl bg-bm-cream/60 p-3">
                                        <ItemList items={order.order_items} onShowAll={() => openDetailModal(order)} />
                                    </div>

                                    <div className="flex items-end justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Pesan</span>
                                                {renderWaktuPesan(order)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Ambil</span>
                                                {renderJamAmbil(order)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bm-eyebrow !text-[10px]">Total</div>
                                            <div className="text-base font-bold text-bm-red-600 whitespace-nowrap">{formatRupiah(order.total_harga)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer kartu: aksi */}
                                <div className="mt-4 pt-3 border-t border-dashed border-black/[0.08]">
                                    {renderActions(order, 'card')}
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}

            {/* Pagination */}
            {paginationLinks.length > 3 && (
                <div className="mt-6 flex items-center justify-center gap-1">
                    {paginationLinks.map((link, i) => (
                        <button
                            key={i}
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                link.active
                                    ? 'bg-bm-red-600 text-white font-semibold shadow-soft'
                                    : link.url
                                        ? 'bg-white border border-gray-200 text-gray-600 hover:bg-bm-cream'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MODAL DETAIL PESANAN
                ═══════════════════════════════════════════════════════════════════ */}
            {isModalOpen && selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="detail-modal-title"
                >
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
                        onClick={closeDetailModal}
                    />

                    {/* Modal Container */}
                    <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 animate-[slideUp_300ms_ease-out] overflow-hidden">

                        {/* ── Header ──────────────────────────────────────────── */}
                        <div className="shrink-0 bg-gradient-to-r from-bm-charcoal-900 to-bm-charcoal-800 px-6 py-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <span className="text-bm-gold-400 text-sm leading-none select-none">✦</span>
                                        <h2 id="detail-modal-title" className="text-lg font-serif font-bold text-white">
                                            Pesanan #{selectedOrder.id}
                                        </h2>
                                        <StatusBadge status={selectedOrder.status_pesanan} />
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        {selectedOrder.user?.name || 'Guest'}
                                        {selectedOrder.user?.no_hp && (
                                            <span className="ml-2 text-gray-400">· {selectedOrder.user.no_hp}</span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {renderTipeChip(selectedOrder)}
                                        <PaymentBadge payment={selectedOrder.payment} align="start" />
                                    </div>
                                </div>
                                <button
                                    onClick={closeDetailModal}
                                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="Tutup modal"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* ── Body: Daftar Item (scrollable) ──────────────────── */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
                            {/* Waktu Info */}
                            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Dipesan: {formatTanggalShort(selectedOrder.tanggal_pesan)}</span>
                                {selectedOrder.waktu_pengambilan && (
                                    <>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-purple-600 font-medium">Ambil: {formatTanggalShort(selectedOrder.waktu_pengambilan)}</span>
                                    </>
                                )}
                            </div>

                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">
                                Daftar Item ({selectedOrder.order_items?.length || 0})
                            </div>

                            <div className="space-y-0 divide-y divide-gray-100">
                                {(selectedOrder.order_items || []).map((item, i) => {
                                    const nama = item.menu?.nama_menu || 'Menu Dihapus';
                                    const harga = item.menu?.harga || 0;
                                    return (
                                        <div
                                            key={item.id || i}
                                            className="flex items-center gap-3 py-3 group"
                                        >
                                            {/* Nomor urut */}
                                            <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-bm-cream text-[10px] font-bold text-bm-text-muted ring-1 ring-black/[0.04]">
                                                {i + 1}
                                            </span>

                                            {/* Nama & harga satuan */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-bm-red-600 transition-colors">
                                                    {nama}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatRupiah(harga)} × {item.jumlah}
                                                </p>
                                            </div>

                                            {/* Subtotal */}
                                            <span className="shrink-0 text-sm font-bold text-gray-800 tabular-nums">
                                                {formatRupiah(item.subtotal)}
                                            </span>
                                        </div>
                                    );
                                })}

                                {(!selectedOrder.order_items || selectedOrder.order_items.length === 0) && (
                                    <div className="py-8 text-center text-gray-400 text-sm italic">
                                        Tidak ada item pesanan.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Footer: Total & Aksi ────────────────────────────── */}
                        <div className="shrink-0 border-t border-gray-200 bg-bm-cream/40 px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-gray-500">Total Pembayaran</span>
                                <span className="text-xl font-bold text-bm-red-600">
                                    {formatRupiah(selectedOrder.total_harga)}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedOrder.status_pesanan !== 'menunggu_pembayaran' && (
                                    <button
                                        onClick={() => { closeDetailModal(); handlePrintNota(selectedOrder.id); }}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-bm-charcoal-800/15 bg-white text-sm font-semibold text-bm-charcoal-800 hover:bg-bm-charcoal-900 hover:text-white hover:border-bm-charcoal-900 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Cetak Nota
                                    </button>
                                )}
                                <button
                                    onClick={closeDetailModal}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-bm-charcoal-900 text-sm font-semibold text-white hover:bg-bm-charcoal-800 transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}
