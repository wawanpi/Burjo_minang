// resources/js/Pages/Customer/Menu.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';

// ─── Shared Components ───────────────────────────────────────────────────────
import Divider from '@/Components/Frontend/Divider';
import Footer from '@/Components/Frontend/Footer';
import useScrollReveal from '@/Components/Frontend/useScrollReveal';

// ─── Deklarasi window.snap untuk TypeScript ──────────────────────────────────
declare global {
    interface Window {
        snap?: {
            pay: (token: string, options: {
                onSuccess?:  (result: any) => void;
                onPending?:  (result: any) => void;
                onError?:    (result: any) => void;
                onClose?:    ()           => void;
            }) => void;
        };
    }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Menu {
    id: number;
    nama_menu: string;
    harga: number;
    kategori: string;
    gambar: string | null;
    stok: number;
    reviews_avg_rating: number | null;
    reviews_count: number;
}

interface Props {
    menus: Menu[];
    kategoriList: string[];
}

interface CartItem {
    menu: Menu;
    jumlah: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val);

// ─── Menu Card Component (Identik dengan Landing Page MenuCard) ──────────────
function MenuCard({
    menu,
    delay,
    qty,
    onAdd,
    onUpdate,
    isStoreOpen,
}: {
    menu: Menu;
    delay: number;
    qty: number;
    onAdd: () => void;
    onUpdate: (delta: number) => void;
    isStoreOpen: boolean;
}) {
    const ref = useScrollReveal();

    return (
        <div ref={ref} className="reveal group" style={{ transitionDelay: `${delay}ms` }}>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#990000]/10 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    {menu.gambar ? (
                        <img
                            src={`/storage/${menu.gambar}`}
                            alt={menu.nama_menu}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <span className="text-5xl opacity-20">🍽️</span>
                        </div>
                    )}

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Kategori Badge — Top Left */}
                    <span className="absolute top-4 left-4 px-3 py-1.5 bg-[#990000]/90 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
                        {menu.kategori}
                    </span>

                    {/* Rating Badge — Top Right */}
                    {menu.reviews_avg_rating !== null && menu.reviews_avg_rating > 0 && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-bold text-gray-900 shadow-lg flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            {Number(menu.reviews_avg_rating).toFixed(1)}
                        </div>
                    )}

                    {/* Floating Price on hover */}
                    <div className="absolute bottom-4 right-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                        <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[#990000] font-bold text-sm shadow-lg">
                            {formatRupiah(menu.harga)}
                        </span>
                    </div>

                    {/* Out of Stock Overlay */}
                    {menu.stok <= 0 && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-900 text-sm font-bold tracking-wide shadow-xl">
                                Stok Habis
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-serif font-bold text-lg text-gray-900 group-hover:text-[#990000] transition-colors duration-300 leading-tight line-clamp-2">
                        {menu.nama_menu}
                    </h3>

                    <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[#990000] font-bold text-lg">
                                {formatRupiah(menu.harga)}
                            </span>
                            {menu.reviews_count > 0 && (
                                <span className="text-xs text-gray-400 font-medium">
                                    {menu.reviews_count} ulasan
                                </span>
                            )}
                        </div>

                        {/* Add to Cart Control */}
                        {!isStoreOpen ? (
                            <button
                                disabled
                                className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-full text-sm border border-gray-200 cursor-not-allowed transition-all"
                            >
                                Toko Tutup
                            </button>
                        ) : menu.stok <= 0 ? (
                            <button
                                disabled
                                className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-full text-sm border border-gray-200 cursor-not-allowed transition-all"
                            >
                                Habis
                            </button>
                        ) : qty === 0 ? (
                            <button
                                onClick={onAdd}
                                className="w-full py-2.5 bg-[#990000] hover:bg-[#7a0000] text-white font-semibold rounded-full transition-all duration-300 text-sm shadow-xl shadow-[#990000]/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Tambah
                            </button>
                        ) : (
                            <div className="flex items-center justify-between bg-[#fff0f0] border border-[#990000]/20 rounded-full p-1.5">
                                <button
                                    onClick={() => onUpdate(-1)}
                                    className="w-9 h-9 rounded-full bg-white hover:bg-[#990000] text-[#990000] hover:text-white flex items-center justify-center transition-all duration-300 font-bold shadow-sm"
                                >
                                    −
                                </button>
                                <span className="font-bold text-gray-900 text-sm w-8 text-center">
                                    {qty}
                                </span>
                                <button
                                    onClick={() => onUpdate(1)}
                                    disabled={qty >= menu.stok}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-sm ${
                                        qty >= menu.stok
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#990000] text-white hover:bg-[#7a0000]'
                                    }`}
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CustomerMenu({ menus, kategoriList }: Props) {
    const { props } = usePage();
    const isStoreOpen = (props as any).is_store_open ?? true;

    // ─── State animasi load ──────────────────────────────────────────────────
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const [activeCategory, setActiveCategory] = useState<string>('Semua');

    // ─── Scroll Reveal refs ──────────────────────────────────────────────────
    const headerRef = useScrollReveal();
    const filterRef = useScrollReveal();

    // ─── State Keranjang ─────────────────────────────────────────────────────
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);

    // ─── Form Checkout State ─────────────────────────────────────────────────
    const [tipeLayanan, setTipeLayanan] = useState<'dine_in' | 'take_away'>('take_away');
    const [waktuKedatangan, setWaktuKedatangan] = useState('');
    const [metodePembayaran, setMetodePembayaran] = useState<'Transfer Bank' | 'QRIS'>('QRIS');
    const [jumlahOrang, setJumlahOrang] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeError, setTimeError] = useState<string | null>(null);

    // ─── State Pembayaran Digital (Snap.js Popup) ────────────────────────────
    type PaymentStatus = 'idle' | 'loading' | 'success' | 'pending' | 'error';
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
    const [paymentMessage, setPaymentMessage] = useState('');

    // ─── Inject Midtrans Snap.js sekali saat komponen mount ──────────────────
    useEffect(() => {
        const snapUrl = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string;

        if (document.getElementById('midtrans-snap-script')) return; // sudah ada

        const script = document.createElement('script');
        script.id  = 'midtrans-snap-script';
        script.src = snapUrl;
        script.setAttribute('data-client-key', clientKey);
        document.head.appendChild(script);
    }, []);

    // ─── Kalkulasi waktu minimal ─────────────────────────────────────────────
    const getMinTimeStr = (): string => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const validateTime = (timeStr: string) => {
        const now = new Date();
        const minDate = new Date(now.getTime() + 15 * 60000);

        const [hours, minutes] = timeStr.split(':').map(Number);
        const selectedDate = new Date(now.getTime());
        selectedDate.setHours(hours, minutes, 0, 0);

        if (selectedDate.getTime() < now.getTime()) {
            selectedDate.setDate(selectedDate.getDate() + 1);
        }

        const minTimeStr = `${String(minDate.getHours()).padStart(2, '0')}:${String(minDate.getMinutes()).padStart(2, '0')}`;

        return {
            isValid: selectedDate.getTime() >= minDate.getTime(),
            minTimeStr,
        };
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedTime = e.target.value;
        setWaktuKedatangan(selectedTime);

        if (!selectedTime) {
            setTimeError(null);
            return;
        }

        const { isValid, minTimeStr } = validateTime(selectedTime);

        if (!isValid) {
            setTimeError('Waktu minimal adalah ' + minTimeStr + ' WIB untuk proses memasak.');
        } else {
            setTimeError(null);
        }
    };

    const filteredMenus = useMemo(() => {
        if (activeCategory === 'Semua') return menus;
        return menus.filter((m) => m.kategori === activeCategory);
    }, [menus, activeCategory]);

    const addToCart = (menu: Menu) => {
        if (menu.stok <= 0) return;

        setCart((prev) => {
            const exist = prev.find((item) => item.menu.id === menu.id);
            if (exist) {
                if (exist.jumlah >= menu.stok) return prev;
                return prev.map((item) =>
                    item.menu.id === menu.id ? { ...item, jumlah: item.jumlah + 1 } : item,
                );
            }
            return [...prev, { menu, jumlah: 1 }];
        });
    };

    const updateQuantity = (menuId: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.menu.id === menuId) {
                        const newQty = item.jumlah + delta;
                        const clampedQty = Math.min(Math.max(0, newQty), item.menu.stok);
                        return { ...item, jumlah: clampedQty };
                    }
                    return item;
                })
                .filter((item) => item.jumlah > 0),
        );
    };

    const cartTotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.menu.harga * item.jumlah, 0),
        [cart],
    );
    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.jumlah, 0), [cart]);

    // ─── Helper: Update status pembayaran di backend ──────────────────────────
    const updatePaymentStatusBackend = async (orderId: number, status: 'success' | 'pending') => {
        try {
            const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
            const csrfToken = csrfMeta?.content ?? '';

            await fetch(route('customer.payment.status', { order: orderId }), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ status }),
            });
        } catch (err) {
            console.error('[Snap Callback] Gagal update status di backend:', err);
        }
    };

    // ─── Handle Checkout: Fetch snap_token → Buka Popup Midtrans ─────────────
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;

        if (waktuKedatangan) {
            const { isValid } = validateTime(waktuKedatangan);
            if (!isValid) {
                setWaktuKedatangan('');
                return;
            }
        }

        setIsSubmitting(true);
        setPaymentStatus('loading');
        setPaymentMessage('');

        const payload = {
            items: cart.map((item) => ({
                menu_id: item.menu.id,
                jumlah: item.jumlah,
                harga: item.menu.harga,
            })),
            tipe_pesanan: tipeLayanan,
            waktu_pengambilan: waktuKedatangan || null,
            metode_pembayaran: metodePembayaran,
            jumlah_orang: tipeLayanan === 'dine_in' ? jumlahOrang : null,
        };

        try {
            // Ambil CSRF token
            const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
            const csrfToken = csrfMeta?.content ?? '';

            // Kirim request AJAX ke backend untuk generate snap_token
            const response = await fetch(route('customer.checkout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                const errMsg = data?.message ?? 'Terjadi kesalahan saat memproses pesanan.';
                setPaymentStatus('error');
                setPaymentMessage(errMsg);
                setIsSubmitting(false);
                return;
            }

            const snapToken = data.snap_token as string;
            const orderId   = data.order_id   as number;

            // Pastikan Snap.js sudah dimuat
            if (!window.snap) {
                setPaymentStatus('error');
                setPaymentMessage('Midtrans Snap.js belum termuat. Pastikan koneksi internet stabil dan coba lagi.');
                setIsSubmitting(false);
                return;
            }

            setIsSubmitting(false);
            setPaymentStatus('idle');

            // Tutup modal keranjang agar tidak bertumpuk dengan popup Midtrans
            setShowCart(false);

            // ── Buka Popup Midtrans Snap ─────────────────────────────────────
            window.snap.pay(snapToken, {
                onSuccess: async (result) => {
                    console.log('[Midtrans] Pembayaran Sukses:', result);
                    await updatePaymentStatusBackend(orderId, 'success');
                    setPaymentStatus('success');
                    setPaymentMessage('Pembayaran berhasil! Pesanan Anda sedang diproses oleh dapur.');
                    // Reset keranjang & form
                    setCart([]);
                    setShowCart(false);
                    setWaktuKedatangan('');
                    setJumlahOrang(1);
                },
                onPending: async (result) => {
                    console.log('[Midtrans] Pembayaran Pending:', result);
                    await updatePaymentStatusBackend(orderId, 'pending');
                    setPaymentStatus('pending');
                    setPaymentMessage('Pesanan Anda sudah tercatat. Silakan segera selesaikan pembayaran agar pesanan diproses.');
                    setCart([]);
                    setShowCart(false);
                },
                onError: (result) => {
                    console.error('[Midtrans] Pembayaran Gagal:', result);
                    setPaymentStatus('error');
                    setPaymentMessage('Pembayaran gagal atau ditolak. Silakan coba kembali atau pilih metode pembayaran lain.');
                },
                onClose: async () => {
                    // User menutup popup sebelum selesai bayar
                    console.log('[Midtrans] Popup ditutup sebelum pembayaran selesai');
                    await updatePaymentStatusBackend(orderId, 'pending');
                    setPaymentStatus('pending');
                    setPaymentMessage('Pembayaran belum diselesaikan. Pesanan Anda tetap tersimpan — silakan selesaikan pembayaran melalui halaman Pesanan Saya.');
                    setCart([]);
                    setShowCart(false);
                },
            });

        } catch (networkError) {
            console.error('[Checkout] Network error:', networkError);
            setPaymentStatus('error');
            setPaymentMessage('Gagal terhubung ke server. Periksa koneksi internet Anda.');
            setIsSubmitting(false);
        }
    };

    return (
        <CustomerLayout>
            <Head title="Pesan Online — Burjo Minang | Menu Pilihan" />

            <div className="flex flex-col min-h-screen font-sans antialiased custom-scrollbar">
                <main className="flex-grow">
                {/* ═══════════════════════════════════════════════════════════════════
                    HERO HEADER — Identik dengan Landing Page Hero
                    ═══════════════════════════════════════════════════════════════════ */}
                <section className="relative h-screen w-full overflow-hidden">
                    {/* Background Image */}
                    <img
                        src="https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=1920&q=80"
                        alt="Sajian masakan Padang"
                        className="absolute inset-0 w-full h-full object-cover scale-110 transition-transform duration-[8000ms] ease-out"
                        style={{
                            objectPosition: 'center 40%',
                            transform: loaded ? 'scale(1)' : 'scale(1.1)',
                        }}
                    />

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

                    {/* Decorative grain texture */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage:
                                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                        }}
                    />

                    {/* Hero Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pt-24 sm:pt-28">
                        {/* Overline Badge */}
                        <div
                            className={`transition-all duration-700 ${
                                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        >
                            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white/70 text-xs tracking-[0.3em] uppercase font-medium">
                                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                                Pesan Online
                            </span>
                        </div>

                        {/* Main Headline — Gaya tipografi megah BURJO MINANG */}
                        <h1
                            className={`mt-6 font-serif font-bold text-white leading-[0.95] transition-all duration-1000 delay-200 ${
                                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                        >
                            <span className="block text-4xl sm:text-5xl md:text-6xl">Pilih Menu</span>
                            <span className="block text-5xl sm:text-6xl md:text-7xl text-yellow-400 mt-1">
                                Favoritmu
                            </span>
                        </h1>

                        {/* Divider */}
                        <div
                            className={`mt-5 transition-all duration-1000 delay-500 ${
                                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        >
                            <Divider light />
                        </div>

                        {/* Tagline */}
                        <p
                            className={`mt-3 text-white/50 text-sm sm:text-base max-w-lg font-light leading-relaxed transition-all duration-1000 delay-700 ${
                                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                        >
                            Cita rasa otentik yang selalu dirindukan — dipilih dan disiapkan khusus untukmu.
                        </p>
                    </div>

                    {/* Bottom Curve */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
                            <path
                                d="M0 80h1440V30c-240 35-480 50-720 50S240 65 0 30v50z"
                                fill="#f9fafb"
                            />
                        </svg>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════════
                    MAIN CONTENT AREA
                    ═══════════════════════════════════════════════════════════════════ */}
                <div className="flex-1 bg-gray-50 relative overflow-hidden">
                    {!isStoreOpen && (
                        <div className="max-w-2xl mx-auto mt-8 mb-6 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm py-6 px-8 relative z-10 mx-6 lg:mx-auto">
                            <div className="flex flex-col items-center justify-center text-center gap-3">
                                <span className="text-rose-400 text-xl leading-none">♦</span>
                                <h3 className="text-2xl md:text-3xl font-serif text-rose-900">
                                    Mohon Maaf, Kami Sedang Tutup
                                </h3>
                                <p className="text-sm text-rose-700 max-w-md">
                                    Sistem pemesanan dihentikan sementara waktu. Silakan kembali pada jam operasional kami.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Subtle pattern overlay — identik Landing Page About Section */}
                    <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 1px 1px, #990000 1px, transparent 0)',
                            backgroundSize: '40px 40px',
                        }}
                    />

                    <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
                        {/* ── Section Header ──────────────────────────────────────── */}
                        <div ref={headerRef} className="reveal text-center max-w-2xl mx-auto mb-10">
                            <span className="inline-block text-[#990000] text-xs font-bold tracking-[0.3em] uppercase mb-4">
                                Menu Pilihan
                            </span>
                            <Divider />
                            <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                                Sajian <span className="text-[#990000]">Terbaik</span> Kami
                            </h2>
                            <p className="mt-4 text-gray-500 text-base leading-relaxed">
                                Setiap hidangan disiapkan dengan bahan segar dan rempah pilihan, mengikuti
                                resep tradisional Minangkabau.
                            </p>
                        </div>

                        {/* ── Category Filter Pills ───────────────────────────────── */}
                        <div ref={filterRef} className="reveal mb-12">
                            <div className="flex overflow-x-auto pb-2 gap-2.5 no-scrollbar justify-center flex-wrap">
                                <button
                                    onClick={() => setActiveCategory('Semua')}
                                    className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 ${
                                        activeCategory === 'Semua'
                                            ? 'bg-[#990000] text-white shadow-xl shadow-[#990000]/30 scale-105'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-[#990000]/40 hover:text-[#990000] hover:bg-[#fff0f0]'
                                    }`}
                                >
                                    Semua
                                </button>
                                {kategoriList.map((kat) => (
                                    <button
                                        key={kat}
                                        onClick={() => setActiveCategory(kat)}
                                        className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 ${
                                            activeCategory === kat
                                                ? 'bg-[#990000] text-white shadow-xl shadow-[#990000]/30 scale-105'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#990000]/40 hover:text-[#990000] hover:bg-[#fff0f0]'
                                        }`}
                                    >
                                        {kat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Menu Grid ────────────────────────────────────────────── */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMenus.map((menu, idx) => {
                                const cartItem = cart.find((c) => c.menu.id === menu.id);
                                const qty = cartItem ? cartItem.jumlah : 0;

                                return (
                                    <MenuCard
                                        key={menu.id}
                                        menu={menu}
                                        delay={idx * 100}
                                        qty={qty}
                                        onAdd={() => addToCart(menu)}
                                        onUpdate={(delta) => updateQuantity(menu.id, delta)}
                                        isStoreOpen={isStoreOpen}
                                    />
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {filteredMenus.length === 0 && (
                            <div className="reveal text-center py-24">
                                <div className="text-6xl mb-4 opacity-20">🍽️</div>
                                <h3 className="font-serif font-bold text-gray-900 text-2xl mb-2">
                                    Menu Belum Tersedia
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                                    Belum ada menu di kategori ini. Coba kategori lain!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                </main>

                {/* ═══════════════════════════════════════════════════════════════════
                    FOOTER
                    ═══════════════════════════════════════════════════════════════════ */}
                <Footer />

                {/* ═══════════════════════════════════════════════════════════════════
                    FLOATING CART SUMMARY — Glassmorphism
                    ═══════════════════════════════════════════════════════════════════ */}
                {cartCount > 0 && !showCart && (
                    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up sm:bottom-6 sm:max-w-md sm:left-auto sm:right-6">
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full bg-[#990000]/95 backdrop-blur-2xl hover:bg-[#7a0000] text-white rounded-full px-6 py-4 flex items-center justify-between shadow-2xl shadow-[#990000]/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/10 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 relative group-hover:scale-110 group-hover:rotate-[-8deg] transition-transform duration-300">
                                    <svg
                                        className="w-5 h-5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                        />
                                    </svg>
                                    <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-gray-900 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-[#990000]">
                                        {cartCount}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <span className="font-semibold text-sm tracking-wide block">
                                        Pesanan Saya
                                    </span>
                                    <span className="text-[10px] text-white/60 tracking-[0.2em] uppercase font-medium">
                                        {cartCount} item
                                    </span>
                                </div>
                            </div>

                            <span className="font-bold text-yellow-400 text-sm sm:text-base tracking-wide">
                                {formatRupiah(cartTotal)}
                            </span>
                        </button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    MODAL CHECKOUT — Premium Glassmorphism
                    ═══════════════════════════════════════════════════════════════════ */}
                {showCart && (
                    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center font-sans">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowCart(false)}
                        />

                        {/* Container Modal */}
                        <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col overflow-hidden">
                            {/* Header — Premium Dark Style */}
                            <div className="bg-gray-950 px-6 sm:px-8 pt-6 pb-5 shrink-0 relative overflow-hidden">
                                {/* Decorative gradient */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7a0000] via-[#990000] to-yellow-400" />

                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <span className="text-[10px] tracking-[0.3em] uppercase text-yellow-400 font-medium">
                                            Rincian Pesanan
                                        </span>
                                        <h2 className="font-serif text-2xl font-bold text-white mt-1">
                                            Keranjang Anda
                                        </h2>
                                        <p className="text-white/40 text-xs mt-1 font-medium">
                                            {cartCount} item · {formatRupiah(cartTotal)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowCart(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/20 transition-all duration-300 hover:rotate-90 border border-white/10"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
                                {/* List Item Keranjang */}
                                <div className="space-y-3 mb-8">
                                    {cart.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-5xl mb-3 opacity-20">🛒</div>
                                            <p className="text-gray-400 font-medium text-sm">
                                                Keranjang masih kosong.
                                            </p>
                                        </div>
                                    ) : (
                                        cart.map((item) => (
                                            <div
                                                key={item.menu.id}
                                                className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-[#990000]/20 hover:bg-[#fff0f0]/50 transition-all duration-300"
                                            >
                                                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100">
                                                    {item.menu.gambar ? (
                                                        <img
                                                            src={`/storage/${item.menu.gambar}`}
                                                            className="w-full h-full object-cover"
                                                            alt={item.menu.nama_menu}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-50">
                                                            🍽️
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-serif font-bold text-gray-900 text-sm line-clamp-1">
                                                        {item.menu.nama_menu}
                                                    </h4>
                                                    <p className="text-[#990000] font-bold text-sm mt-0.5">
                                                        {formatRupiah(item.menu.harga)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-gray-200 shadow-sm shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(item.menu.id, -1)
                                                        }
                                                        className="w-7 h-7 rounded-full bg-[#fff0f0] flex items-center justify-center font-bold text-[#990000] hover:bg-[#990000] hover:text-white transition-all duration-300 text-sm"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="font-bold text-sm w-5 text-center text-gray-900">
                                                        {item.jumlah}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(item.menu.id, 1)
                                                        }
                                                        className="w-7 h-7 rounded-full bg-[#990000] flex items-center justify-center font-bold text-white hover:bg-[#7a0000] transition-all duration-300 text-sm"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* ── Form Checkout ────────────────────────────────── */}
                                {cart.length > 0 && (
                                    <form
                                        id="checkout-form"
                                        onSubmit={handleCheckout}
                                        className="space-y-6"
                                    >
                                        {/* Divider */}
                                        <Divider />

                                        {/* Input 1: Tipe Layanan */}
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#990000] mb-3">
                                                Pilih Layanan
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <label
                                                    className={`flex flex-col items-center justify-center py-4 px-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                                        tipeLayanan === 'take_away'
                                                            ? 'border-[#990000] bg-[#fff0f0] text-[#990000] shadow-md shadow-[#990000]/10'
                                                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="layanan"
                                                        value="take_away"
                                                        className="sr-only"
                                                        checked={tipeLayanan === 'take_away'}
                                                        onChange={() => setTipeLayanan('take_away')}
                                                    />
                                                    <span className="text-2xl mb-1">🛍️</span>
                                                    <span className="font-bold text-sm">Take Away</span>
                                                </label>
                                                <label
                                                    className={`flex flex-col items-center justify-center py-4 px-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                                        tipeLayanan === 'dine_in'
                                                            ? 'border-[#990000] bg-[#fff0f0] text-[#990000] shadow-md shadow-[#990000]/10'
                                                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="layanan"
                                                        value="dine_in"
                                                        className="sr-only"
                                                        checked={tipeLayanan === 'dine_in'}
                                                        onChange={() => setTipeLayanan('dine_in')}
                                                    />
                                                    <span className="text-2xl mb-1">🍽️</span>
                                                    <span className="font-bold text-sm">Dine In</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Input 1b: Jumlah Orang — HANYA tampil saat Dine In */}
                                        {tipeLayanan === 'dine_in' && (
                                            <div className="animate-fade-in bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <label
                                                    htmlFor="jumlah-orang"
                                                    className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#990000] mb-3"
                                                >
                                                    Jumlah Orang{' '}
                                                    <span className="text-[#990000]">*</span>
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setJumlahOrang((prev) =>
                                                                Math.max(1, prev - 1),
                                                            )
                                                        }
                                                        disabled={jumlahOrang <= 1}
                                                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-xl hover:border-[#990000] hover:text-[#990000] disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-400 transition-all duration-300 shadow-sm"
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        id="jumlah-orang"
                                                        type="number"
                                                        min={1}
                                                        max={50}
                                                        value={jumlahOrang}
                                                        onChange={(e) => {
                                                            const val = parseInt(
                                                                e.target.value,
                                                                10,
                                                            );
                                                            if (
                                                                !isNaN(val) &&
                                                                val >= 1 &&
                                                                val <= 50
                                                            )
                                                                setJumlahOrang(val);
                                                        }}
                                                        className="w-24 text-center text-2xl font-bold tracking-tight px-3 py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:border-[#990000] focus:ring-0 text-gray-900 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setJumlahOrang((prev) =>
                                                                Math.min(50, prev + 1),
                                                            )
                                                        }
                                                        disabled={jumlahOrang >= 50}
                                                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-xl hover:border-[#990000] hover:text-[#990000] disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-400 transition-all duration-300 shadow-sm"
                                                    >
                                                        +
                                                    </button>
                                                    <span className="text-sm font-bold text-gray-500 ml-2">
                                                        Orang
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Input 2: Jam Kedatangan */}
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#990000] mb-1">
                                                Jam Kedatangan (Opsional)
                                            </label>
                                            <p className="text-xs text-gray-500 font-medium mb-3">
                                                Dikosongkan jika pesanan ingin langsung diproses
                                                sekarang.
                                            </p>
                                            <input
                                                type="time"
                                                value={waktuKedatangan}
                                                onChange={handleTimeChange}
                                                className={`w-full px-0 py-3 bg-transparent border-0 border-b-2 text-lg font-bold text-gray-900 focus:ring-0 transition-colors ${
                                                    timeError
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:border-[#990000]'
                                                }`}
                                            />
                                            {timeError && (
                                                <p className="text-[#990000] text-xs font-bold mt-2">
                                                    {timeError}
                                                </p>
                                            )}
                                            <p className="text-[11px] font-bold text-yellow-600 mt-2 bg-yellow-50 inline-block px-2.5 py-1 rounded-full">
                                                Min. {getMinTimeStr()} WIB (Waktu Persiapan)
                                            </p>
                                        </div>

                                        {/* Input 3: Metode Pembayaran */}
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#990000] mb-3">
                                                Metode Pembayaran
                                            </label>
                                            <select
                                                value={metodePembayaran}
                                                onChange={(e) =>
                                                    setMetodePembayaran(
                                                        e.target.value as
                                                            | 'Transfer Bank'
                                                            | 'QRIS',
                                                    )
                                                }
                                                className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-300 focus:border-[#990000] focus:ring-0 text-lg font-bold text-gray-900 transition-colors"
                                            >
                                                <option value="QRIS">
                                                    💳 QRIS (Direkomendasikan)
                                                </option>
                                                <option value="Transfer Bank">
                                                    🏦 Transfer Bank
                                                </option>
                                            </select>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* ── Total Bayar & Tombol Konfirmasi ─────────────────── */}
                            {cart.length > 0 && (
                                <div className="px-6 sm:px-8 pt-5 pb-6 border-t border-gray-100 shrink-0 bg-white">
                                    <div className="flex items-end justify-between mb-5">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#990000]">
                                            Total Pembayaran
                                        </span>
                                        <span className="text-2xl font-serif font-bold text-[#990000] leading-none">
                                            {formatRupiah(cartTotal)}
                                        </span>
                                    </div>
                                    <button
                                        type="submit"
                                        form="checkout-form"
                                        className={`w-full py-4 rounded-full text-white font-semibold tracking-wide transition-all duration-300 shadow-xl ${
                                            timeError || isSubmitting || !isStoreOpen
                                                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                                                : 'bg-[#990000] hover:bg-[#7a0000] hover:shadow-[#990000]/40 hover:scale-105 active:scale-[0.98]'
                                        }`}
                                        disabled={isSubmitting || !!timeError || !isStoreOpen}
                                    >
                                        {!isStoreOpen
                                            ? 'Toko Sedang Tutup'
                                            : isSubmitting
                                                ? 'Memproses Pesanan...'
                                                : timeError
                                                  ? 'Perbaiki Waktu Kedatangan'
                                                  : 'Lanjutkan ke Pembayaran'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    PAYMENT STATUS NOTIFICATION — Modal Overlay
                    Muncul setelah popup Midtrans Snap.js ditutup (sukses/pending/error)
                    ═══════════════════════════════════════════════════════════════════ */}
                {paymentStatus !== 'idle' && paymentStatus !== 'loading' && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center font-sans">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Notification Card */}
                        <div className="relative w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center animate-slide-up">
                            {/* Icon */}
                            <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${
                                paymentStatus === 'success'
                                    ? 'bg-green-100'
                                    : paymentStatus === 'pending'
                                      ? 'bg-yellow-100'
                                      : 'bg-red-100'
                            }`}>
                                {paymentStatus === 'success' && (
                                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {paymentStatus === 'pending' && (
                                    <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {paymentStatus === 'error' && (
                                    <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className={`font-serif font-bold text-xl mb-2 ${
                                paymentStatus === 'success'
                                    ? 'text-green-700'
                                    : paymentStatus === 'pending'
                                      ? 'text-yellow-700'
                                      : 'text-red-700'
                            }`}>
                                {paymentStatus === 'success' && 'Pembayaran Berhasil!'}
                                {paymentStatus === 'pending' && 'Menunggu Pembayaran'}
                                {paymentStatus === 'error' && 'Pembayaran Gagal'}
                            </h3>

                            {/* Message */}
                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                {paymentMessage}
                            </p>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {(paymentStatus === 'success' || paymentStatus === 'pending') && (
                                    <button
                                        onClick={() => {
                                            setPaymentStatus('idle');
                                            setPaymentMessage('');
                                            router.visit(route('customer.orders'));
                                        }}
                                        className="w-full py-3.5 bg-[#990000] hover:bg-[#7a0000] text-white font-semibold rounded-full transition-all duration-300 shadow-xl shadow-[#990000]/20 hover:scale-105 active:scale-[0.98]"
                                    >
                                        Lihat Pesanan Saya
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setPaymentStatus('idle');
                                        setPaymentMessage('');
                                    }}
                                    className={`w-full py-3.5 rounded-full font-semibold transition-all duration-300 ${
                                        paymentStatus === 'error'
                                            ? 'bg-[#990000] hover:bg-[#7a0000] text-white shadow-xl shadow-[#990000]/20 hover:scale-105 active:scale-[0.98]'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {paymentStatus === 'error' ? 'Coba Lagi' : 'Tutup'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}