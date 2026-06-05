import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────
interface Menu {
    id: number;
    nama_menu: string;
    harga: number;
}

interface OrderItem {
    id: number;
    jumlah: number;
    subtotal: number;
    menu?: Menu;
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
    jumlah_orang: number | null;
}

interface Props {
    order: Order;
    kasir: { name: string };
}

// ─── Helpers ───────────────────────────────────────────
const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val);

const formatTanggal = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const tipePesananLabel = (order: Order) => {
    if (order.tipe_pesanan === 'dine_in') return `Dine In (${order.jumlah_orang || 1} Org)`;
    if (order.tipe_pesanan === 'take_away') return 'Take Away';
    return 'Online';
};

// ─── Component ─────────────────────────────────────────
export default function Nota({ order, kasir }: Props) {
    // Auto print saat halaman terbuka
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 300); // Delay sedikit agar render selesai

        const handleAfterPrint = () => window.close();
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    return (
        <>
            <Head title={`Nota #${order.id}`} />

            {/* ── CSS khusus print (inline style tag) ── */}
            <style>{`
                @page {
                    margin: 0;
                    size: 58mm auto;
                }
                @media print {
                    html, body {
                        width: 58mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div style={{
                fontFamily: "'Courier New', Consolas, 'Liberation Mono', monospace",
                fontSize: '11px',
                lineHeight: 1.4,
                color: '#000',
                background: '#fff',
                width: '58mm',
                maxWidth: '58mm',
                margin: '0 auto',
                padding: '8px',
                WebkitPrintColorAdjust: 'exact',
            }}>

                {/* ════════ HEADER ════════ */}
                <div style={{ textAlign: 'center', marginBottom: '2px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                        BURJOMINANG
                    </div>
                    <div style={{ fontSize: '10px', fontStyle: 'italic' }}>
                        Rasa Mantap Harga Pas
                    </div>
                    <div style={{ fontSize: '9px', marginTop: '2px' }}>
                        Jl. Bunga, Geblagan, Bantul
                    </div>
                </div>

                <Separator />

                {/* ════════ INFO TRANSAKSI ════════ */}
                <InfoRow label="No" value={`#${order.id}`} />
                <InfoRow label="Tgl" value={formatTanggal(order.tanggal_pesan)} />
                <InfoRow label="Kasir" value={order.user?.name || 'Guest'} />
                <InfoRow label="Tipe" value={tipePesananLabel(order)} />
                <InfoRow label="Kasir" value={kasir?.name || '-'} />

                <Separator />

                {/* ════════ DAFTAR ITEM ════════ */}
                {order.order_items?.map((item) => (
                    <div key={item.id} style={{ marginBottom: '4px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '1px' }}>
                            {item.menu?.nama_menu || 'Menu Dihapus'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.jumlah} x {formatRupiah(item.menu?.harga || 0)}</span>
                            <span>{formatRupiah(item.subtotal)}</span>
                        </div>
                    </div>
                ))}

                <Separator />

                {/* ════════ TOTAL ════════ */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    padding: '4px 0',
                }}>
                    <span>TOTAL</span>
                    <span>Rp {formatRupiah(order.total_harga)}</span>
                </div>

                {/* ════════ METODE BAYAR ════════ */}
                {order.payment && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
                            <span>Bayar</span>
                            <span>{order.payment.metode_pembayaran}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
                            <span>Status</span>
                            <span>{order.payment.status_pembayaran.charAt(0).toUpperCase() + order.payment.status_pembayaran.slice(1)}</span>
                        </div>
                    </>
                )}

                <Separator />

                {/* ════════ FOOTER ════════ */}
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                        Terima Kasih!
                    </div>
                    <div>Selamat Menikmati </div>
                </div>

                {/* ════════ TOMBOL CETAK (layar saja) ════════ */}
                <button
                    className="no-print"
                    onClick={() => window.print()}
                    style={{
                        display: 'block',
                        width: '100%',
                        marginTop: '12px',
                        padding: '8px',
                        background: '#b44b1c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                    }}
                >
                    🖨️ Cetak Nota
                </button>
            </div>
        </>
    );
}

// ─── Sub-components ────────────────────────────────────
function Separator() {
    return (
        <hr style={{
            border: 'none',
            borderTop: '1px dashed #000',
            margin: '6px 0',
        }} />
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '4px',
            lineHeight: 1.5,
        }}>
            <span style={{ flexShrink: 0, minWidth: '42px' }}>{label}</span>
            <span style={{ flexShrink: 0, margin: '0 2px' }}>:</span>
            <span style={{ flex: 1, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}
