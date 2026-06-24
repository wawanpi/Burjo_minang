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
    orders: {
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

// ─── Component ─────────────────────────────────────────────────────────────────
export default function OrderIndex({ orders, filters }: Props) {
    const { flash } = usePage().props as any;
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    
    // ─── AUDIO ALERTS STATE ────────────────────────────────────────────────────
    const [alerted10Min, setAlerted10Min] = useState<number[]>([]);
    const [alerted5Min, setAlerted5Min] = useState<number[]>([]);

    const orderData = orders?.data || [];

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

            if (order.tipe_pesanan === 'online' && order.sisa_menit !== null) {
                // Online: <= 5 mins & > 0 mins -> danger
                if (order.sisa_menit <= 5 && order.sisa_menit > 0) {
                    isDanger = true;
                }
            } else if (order.tipe_pesanan !== 'online' && order.durasi_menit !== null) {
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
            if (order.tipe_pesanan === 'online' && order.sisa_menit !== null) {
                if (order.sisa_menit <= 5 && order.sisa_menit > 0) {
                    return 'bg-red-100 animate-pulse border-l-4 border-red-500';
                }
            } else if (order.tipe_pesanan !== 'online' && order.durasi_menit !== null) {
                if (order.durasi_menit >= 15) {
                    return 'bg-red-100 animate-pulse border-l-4 border-red-500';
                } else if (order.durasi_menit >= 10) {
                    return 'bg-yellow-50 border-l-4 border-yellow-400';
                }
            }
        }
        
        return 'hover:bg-amber-50/50 transition-colors duration-150';
    };

    const formatRupiah = (val: number | string) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

    const formatTanggal = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
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
        }, { preserveScroll: true });
    };

    const handlePrintNota = (orderId: number) => {
        window.open(`/kasir/orders/${orderId}/nota`, '_blank');
    };

    // ─── FILTERING OPTIONS LOGIC (BUSINESS RULES) ──────────────
    const renderStatusOptions = (order: Order) => {
        const paymentLunas = order.payment?.status_pembayaran === 'lunas';
        const isOnline = order.tipe_pesanan === 'online';
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

            // Aturan 2: Online yang masih menunggu pembayaran tidak bisa diproses/selesai manual
            if (isOnline && currentStatus === 'menunggu_pembayaran') {
                if (opt.value === 'diproses' || opt.value === 'selesai') disabled = true;
            }

            // Aturan 3: Jika sedang diproses, tidak bisa kembali ke menunggu_pembayaran
            if (currentStatus === 'diproses' && opt.value === 'menunggu_pembayaran') disabled = true;

            // Pengaman 4: Jika sudah selesai atau batal, menu di-lock secara ketat
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

    const paginationLinks = orders?.links || [];

    return (
        <OwnerLayout title="Manajemen Pesanan">
            <Head title="Manajemen Pesanan" />

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

            {/* Header + Filter */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-page-enter">
                <div>
                    <span className="bm-eyebrow block mb-1.5">Operasional</span>
                    <div className="flex items-center gap-2.5">
                        <span className="text-bm-gold-500 text-lg leading-none select-none">✦</span>
                        <h1 className="text-2xl lg:text-[28px] font-serif font-bold text-bm-charcoal-900 leading-tight">Daftar Pesanan</h1>
                    </div>
                    <div className="bm-gold-underline mt-3" />
                    <p className="text-sm text-bm-text-muted mt-2">
                        {orders?.total || orderData.length} pesanan ditemukan
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => handleFilterStatus('')}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                            selectedStatus === ''
                                ? `${filterActiveColor['']} shadow-soft`
                                : 'bg-white border border-gray-300 text-bm-text-muted hover:bg-bm-cream'
                        }`}
                    >
                        Semua
                    </button>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => handleFilterStatus(key)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                selectedStatus === key
                                    ? `${filterActiveColor[key]} shadow-soft`
                                    : 'bg-white border border-gray-300 text-bm-text-muted hover:bg-bm-cream'
                            }`}
                        >
                            {cfg.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-soft w-full animate-page-enter">
                <div className="overflow-x-auto w-full custom-scrollbar">
                    <table className="min-w-[900px] w-full divide-y divide-gray-200">
                        <thead className="bg-bm-cream">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">ID / Tipe</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Pelanggan</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Item Pesanan</th>
                                <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Total</th>
                                <th className="px-6 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Status</th>
                                <th className="px-6 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Bayar</th>
                                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Waktu</th>
                                <th className="px-6 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.05]">
                            {orderData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-bm-text-muted">
                                            <span className="text-5xl opacity-40 animate-float">📋</span>
                                            <p className="font-serif italic text-lg text-bm-charcoal-800">Tidak ada pesanan ditemukan.</p>
                                            <p className="text-sm">Coba ubah filter status di atas.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orderData.map((order) => {
                                    const sc = statusConfig[order.status_pesanan] || { label: order.status_pesanan, color: 'bg-gray-100 text-gray-700' };
                                    const pc = order.payment
                                        ? (paymentStatusConfig[order.payment.status_pembayaran] || { label: order.payment.status_pembayaran, color: 'bg-gray-100 text-gray-700' })
                                        : { label: 'Belum Bayar', color: 'bg-gray-100 text-gray-700' };

                                    return (
                                        <tr key={order.id} className={getRowStyle(order)}>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono font-bold text-gray-900">#{order.id}</div>
                                                <span className={`inline-flex mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                    order.tipe_pesanan === 'online' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {order.tipe_pesanan === 'dine_in'
                                                        ? `DINE IN (${order.jumlah_orang || 1} ORANG)`
                                                        : order.tipe_pesanan.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{order.user?.name || 'Guest'}</div>
                                                <div className="text-xs text-gray-500">{order.user?.no_hp || order.user?.email || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1 max-w-xs">
                                                    {order.order_items?.map((item, i) => (
                                                        <div key={i} className="text-xs text-gray-600">
                                                            {item.menu?.nama_menu || 'Menu Dihapus'} × {item.jumlah}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-bm-red-600">
                                                {formatRupiah(order.total_harga)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                                                    {order.status_pesanan === 'diproses' && (
                                                        <span className="relative flex h-1.5 w-1.5">
                                                            <span className="absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-60 animate-ping" />
                                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                                                        </span>
                                                    )}
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${pc.color}`}>
                                                    {pc.label}
                                                </span>
                                                {order.payment?.metode_pembayaran && (
                                                    <div className="text-xs text-gray-400 mt-1">{order.payment.metode_pembayaran}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 font-medium">
                                                    Dibuat: {formatTanggal(order.tanggal_pesan)}
                                                </div>
                                                {order.tipe_pesanan === 'online' && order.waktu_pengambilan && (
                                                    <div className="text-xs text-purple-600 font-medium mt-1">
                                                        Diambil: {formatTanggal(order.waktu_pengambilan)}
                                                        {order.sisa_menit !== null && order.status_pesanan === 'diproses' && (
                                                            <span className="font-bold ml-1">({Math.round(order.sisa_menit)}m tersisa)</span>
                                                        )}
                                                    </div>
                                                )}
                                                {order.tipe_pesanan !== 'online' && order.durasi_menit !== null && order.status_pesanan === 'diproses' && (
                                                    <div className="text-xs text-amber-600 font-medium mt-1">
                                                        Berjalan: <span className="font-bold">{Math.round(order.durasi_menit)} menit</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                {order.status_pesanan === 'batal' ? (
                                                    <span className="text-xs text-gray-300 italic">—</span>
                                                ) : (
                                                    <>
                                                        {order.payment?.metode_pembayaran !== 'Tunai' && order.status_pesanan === 'menunggu_pembayaran' ? (
                                                            <div className="w-full px-2 py-1.5 text-[11px] font-bold text-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" title="Menunggu konfirmasi otomatis dari Midtrans">
                                                                Menunggu Sistem...
                                                            </div>
                                                        ) : order.status_pesanan !== 'selesai' && (
                                                            <select
                                                                value={order.status_pesanan}
                                                                onChange={(e) => handleUpdateStatus(order, e.target.value)}
                                                                className="w-full px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-bm-gold-400 focus:border-transparent transition-all cursor-pointer"
                                                            >
                                                                {renderStatusOptions(order)}
                                                            </select>
                                                        )}

                                                        {order.status_pesanan !== 'menunggu_pembayaran' && (
                                                            <button
                                                                onClick={() => handlePrintNota(order.id)}
                                                                className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-bm-charcoal-800 hover:bg-bm-cream hover:border-gray-400 transition-colors"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                                </svg>
                                                                Cetak Nota
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </OwnerLayout>
    );
}
