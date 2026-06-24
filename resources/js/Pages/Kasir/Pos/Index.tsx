import { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';

// ─── Deklarasi window.snap untuk TypeScript ────────────────────────────────
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

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Menu {
    id: number;
    nama_menu: string;
    kategori: string;
    harga: number | string;
    stok: number;
    gambar: string | null;
}

interface CartItem {
    menu_id: number;
    nama_menu: string;
    harga: number;
    jumlah: number;
    subtotal: number;
    max_stok: number;
}

interface Props {
    menus: Menu[];
    kategoriList: string[];
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function PosIndex({ menus, kategoriList }: Props) {
    const { flash, errors, is_store_open } = usePage().props as any;
    const isStoreOpen = is_store_open ?? true;
    const [selectedKategori, setSelectedKategori] = useState('Semua');
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // Payment & Order State
    const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
    const [tipePesanan, setTipePesanan] = useState('dine_in');
    const [uangDiterima, setUangDiterima] = useState<number | ''>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchMenu, setSearchMenu] = useState('');

    // Modal State
    const [showConfirmModal, setShowConfirmModal]     = useState(false);
    const [showClearCartModal, setShowClearCartModal] = useState(false);

    // State khusus untuk alur Digital Payment (QRIS / VA)
    type DigitalStatus = 'idle' | 'loading' | 'success' | 'pending' | 'error';
    const [digitalStatus, setDigitalStatus]   = useState<DigitalStatus>('idle');
    const [digitalMessage, setDigitalMessage] = useState('');
    const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);

    // ── Inject Midtrans Snap.js sekali saat komponen mount ───────────────────
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

    // Format mata uang Rupiah
    const formatRupiah = (val: number | string) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

    // Filter menu berdasarkan kategori dan pencarian
    const filteredMenus = useMemo(() => {
        let filtered = menus;
        if (selectedKategori !== 'Semua') {
            filtered = filtered.filter(m => m.kategori === selectedKategori);
        }
        if (searchMenu.trim()) {
            const keyword = searchMenu.toLowerCase();
            filtered = filtered.filter(m => m.nama_menu.toLowerCase().includes(keyword));
        }
        return filtered;
    }, [menus, selectedKategori, searchMenu]);

    // Tambah ke keranjang
    const addToCart = (menu: Menu) => {
        const harga = Number(menu.harga);
        setCart(prev => {
            const existing = prev.find(item => item.menu_id === menu.id);
            if (existing) {
                if (existing.jumlah >= menu.stok) return prev;
                return prev.map(item =>
                    item.menu_id === menu.id
                        ? { ...item, jumlah: item.jumlah + 1, subtotal: (item.jumlah + 1) * harga }
                        : item
                );
            }
            return [...prev, {
                menu_id: menu.id,
                nama_menu: menu.nama_menu,
                harga,
                jumlah: 1,
                subtotal: harga,
                max_stok: menu.stok,
            }];
        });
    };

    // Update jumlah item di keranjang
    const updateJumlah = (menu_id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.menu_id === menu_id) {
                const newJumlah = item.jumlah + delta;
                if (newJumlah < 1) return item;
                if (newJumlah > item.max_stok) return item;
                return { ...item, jumlah: newJumlah, subtotal: newJumlah * item.harga };
            }
            return item;
        }));
    };

    // Hapus dari keranjang
    const removeFromCart = (menu_id: number) => {
        setCart(prev => prev.filter(item => item.menu_id !== menu_id));
    };

    // Kosongkan keranjang — tampilkan modal konfirmasi
    const clearCart = () => {
        if (cart.length === 0) return;
        setShowClearCartModal(true);
    };

    // Eksekusi kosongkan keranjang setelah konfirmasi modal
    const confirmClearCart = () => {
        setCart([]);
        setUangDiterima('');
        setTipePesanan('dine_in');
        setShowClearCartModal(false);
    };

    // Hitung total harga
    const totalHarga = cart.reduce((total, item) => total + item.subtotal, 0);
    const totalItem = cart.reduce((acc, item) => acc + item.jumlah, 0);
    const kembalian = Number(uangDiterima) - totalHarga;
    const isUangCukup = Number(uangDiterima) >= totalHarga;

    // ── Handler utama — cabangkan ke Tunai atau Digital ─────────────────────
    const handleCheckout = () => {
        if (cart.length === 0) return;

        if (metodePembayaran === 'Tunai') {
            if (!isUangCukup) {
                alert('Uang yang diterima kurang dari total tagihan!');
                return;
            }
            setShowConfirmModal(true);
        } else {
            // QRIS atau Virtual Account → alur Midtrans Snap
            handleCheckoutDigital();
        }
    };

    // ── Alur Digital: Fetch snap_token → buka popup Midtrans ─────────────────
    const handleCheckoutDigital = async () => {
        setIsProcessing(true);
        setDigitalStatus('loading');
        setDigitalMessage('');

        const payload = {
            cart_items: cart.map(item => ({
                menu_id: item.menu_id,
                jumlah:  item.jumlah,
                subtotal: item.subtotal,
            })),
            total_harga:       totalHarga,
            metode_pembayaran: metodePembayaran, // 'QRIS' atau 'Virtual Account'
            tipe_pesanan:      tipePesanan,
        };

        try {
            // Ambil CSRF token dari meta tag (wajib untuk POST Laravel)
            const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
            const csrfToken = csrfMeta?.content ?? '';

            const response = await fetch(route('kasir.pos.digital'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                // Validasi atau error dari Laravel
                const errMsg = data?.errors?.cart ?? data?.message ?? 'Terjadi kesalahan pada server.';
                setDigitalStatus('error');
                setDigitalMessage(errMsg);
                setIsProcessing(false);
                return;
            }

            const snapToken = data.snap_token as string;
            const orderId   = data.order_id   as number;

            // Pastikan Snap.js sudah dimuat
            if (!window.snap) {
                setDigitalStatus('error');
                setDigitalMessage('Midtrans Snap.js belum termuat. Pastikan koneksi internet stabil dan coba lagi.');
                setIsProcessing(false);
                return;
            }

            setIsProcessing(false);

            // Buka popup Midtrans — pelanggan yang ada di depan kasir bisa
            // langsung scan QRIS atau catat nomor VA di layar kasir/tablet.
            window.snap.pay(snapToken, {
                onSuccess: (result) => {
                    console.log('[Midtrans] Sukses:', result);
                    setCompletedOrderId(orderId);
                    setDigitalStatus('success');
                    setDigitalMessage(`Pembayaran #${orderId} berhasil dikonfirmasi! Pesanan langsung masuk ke dapur.`);
                    // Reset keranjang
                    setCart([]);
                    setUangDiterima('');
                    setTipePesanan('dine_in');
                },
                onPending: (result) => {
                    console.log('[Midtrans] Pending:', result);
                    setCompletedOrderId(orderId);
                    setDigitalStatus('pending');
                    setDigitalMessage(`Pembayaran #${orderId} menunggu konfirmasi dari pelanggan. Pesanan sudah tercatat.`);
                    setCart([]);
                    setUangDiterima('');
                },
                onError: (result) => {
                    console.error('[Midtrans] Error:', result);
                    setDigitalStatus('error');
                    setDigitalMessage('Pembayaran gagal atau dibatalkan. Silakan coba lagi atau pilih metode lain.');
                },
                onClose: () => {
                    // Pelanggan menutup popup tanpa bayar
                    if (digitalStatus === 'idle' || digitalStatus === 'loading') {
                        setDigitalStatus('error');
                        setDigitalMessage('Popup pembayaran ditutup sebelum transaksi selesai.');
                    }
                },
            });

        } catch (networkError) {
            console.error('[POS Digital] Network error:', networkError);
            setDigitalStatus('error');
            setDigitalMessage('Gagal terhubung ke server. Periksa koneksi internet Anda.');
            setIsProcessing(false);
        }
    };

    // Reset status modal digital
    const resetDigitalStatus = () => {
        setDigitalStatus('idle');
        setDigitalMessage('');
        setCompletedOrderId(null);
    };

    // Eksekusi pembayaran setelah konfirmasi modal
    const confirmCheckout = () => {
        setShowConfirmModal(false);
        setIsProcessing(true);

        const payload = {
            cart_items: cart.map(item => ({
                menu_id: item.menu_id,
                jumlah: item.jumlah,
                subtotal: item.subtotal,
            })),
            total_harga: totalHarga,
            uang_diterima: Number(uangDiterima),
            metode_pembayaran: 'Tunai',
            tipe_pesanan: tipePesanan,
        };

        router.post('/kasir/pos', payload, {
            onSuccess: () => {
                setCart([]);
                setUangDiterima('');
                setTipePesanan('dine_in');
                setIsProcessing(false);
            },
            onError: () => setIsProcessing(false),
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <OwnerLayout title="Kasir POS">
            <Head title="Kasir POS" />

            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 lg:h-[calc(100vh-7rem)] w-full lg:overflow-hidden">
                {/* ═══ Bagian Kiri: Daftar Menu ═══ */}
                <div className="flex-none h-[65vh] lg:h-auto lg:flex-1 flex flex-col bg-white rounded-2xl shadow-soft border border-black/[0.05] overflow-hidden relative">
                    {/* Header & Filter Kategori */}
                    <div className="p-4 lg:p-5 border-b border-black/[0.05] space-y-3">
                        {/* Search Bar */}
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchMenu}
                                onChange={(e) => setSearchMenu(e.target.value)}
                                placeholder="Cari menu..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-bm-cream/60 text-sm focus:outline-none focus:ring-2 focus:ring-bm-gold-400 focus:border-transparent focus:bg-white transition-all placeholder:text-bm-text-muted"
                            />
                        </div>
                        {/* Kategori Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            <button
                                onClick={() => setSelectedKategori('Semua')}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                    selectedKategori === 'Semua'
                                        ? 'bg-bm-gold-400 text-bm-charcoal-900 shadow-soft'
                                        : 'bg-transparent text-bm-text-muted border border-gray-200 hover:bg-bm-cream'
                                }`}
                            >
                                Semua Menu
                            </button>
                            {kategoriList.map(kat => (
                                <button
                                    key={kat}
                                    onClick={() => setSelectedKategori(kat)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 capitalize ${
                                        selectedKategori === kat
                                            ? 'bg-bm-gold-400 text-bm-charcoal-900 shadow-soft'
                                            : 'bg-transparent text-bm-text-muted border border-gray-200 hover:bg-bm-cream'
                                    }`}
                                >
                                    {kat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid Menu */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-5 custom-scrollbar bg-bm-cream/30">
                        {filteredMenus.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-bm-text-muted">
                                <span className="text-5xl mb-3 opacity-40 animate-float">🍽️</span>
                                <p className="font-serif italic text-lg text-bm-charcoal-800">
                                    {searchMenu ? `Tidak ada menu "${searchMenu}"` : 'Belum ada menu di kategori ini.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                                {filteredMenus.map(menu => {
                                    const cartItem = cart.find(c => c.menu_id === menu.id);
                                    const qtyInCart = cartItem?.jumlah || 0;

                                    return (
                                        <button
                                            key={menu.id}
                                            onClick={() => addToCart(menu)}
                                            disabled={menu.stok <= 0}
                                            className={`group flex flex-col bg-white rounded-2xl shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 border overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-bm-gold-400/50 focus:ring-offset-1 relative ${
                                                menu.stok <= 0
                                                    ? 'opacity-50 cursor-not-allowed border-gray-200'
                                                    : 'border-black/[0.05] hover:border-bm-gold-400/60'
                                            }`}
                                        >
                                            <div className="w-full h-32 bg-gray-100 relative overflow-hidden">
                                                {menu.gambar ? (
                                                    <img
                                                        src={`/storage/${menu.gambar}`}
                                                        alt={menu.nama_menu}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                                    </div>
                                                )}
                                                {/* Badge Stok */}
                                                <div className={`absolute top-2 right-2 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    menu.stok <= 0 ? 'bg-bm-red-500/90 text-white' : menu.stok < 3 ? 'bg-bm-red-50/90 text-bm-red-700 border border-bm-red-600/20' : 'bg-bm-gold-100/90 text-bm-charcoal-900 border border-bm-gold-500/30'
                                                }`}>
                                                    {menu.stok <= 0 ? 'Habis' : `Stok ${menu.stok}`}
                                                </div>
                                                {/* Badge qty in cart */}
                                                {qtyInCart > 0 && (
                                                    <div className="absolute top-2 left-2 bg-bm-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md ring-2 ring-white/80">
                                                        {qtyInCart}
                                                    </div>
                                                )}
                                                {/* Overlay "+ Tambah" muncul saat hover */}
                                                {menu.stok > 0 && (
                                                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-bm-charcoal-900/85 to-transparent flex items-end justify-center pb-2.5 pt-6">
                                                        <span className="inline-flex items-center gap-1 text-white text-xs font-bold bg-bm-red-600 rounded-full px-3 py-1 shadow-lg">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                            Tambah
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-serif font-semibold text-bm-charcoal-900 line-clamp-1 text-[15px] leading-snug">
                                                    {menu.nama_menu}
                                                </h3>
                                                <p className="text-base font-bold text-bm-red-600 mt-1 tracking-tight">
                                                    {formatRupiah(menu.harga)}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ Bagian Kanan: Keranjang ═══ */}
                <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-white rounded-2xl shadow-soft border border-black/[0.05] overflow-hidden shrink-0 z-20">
                    {/* Header Keranjang */}
                    <div className="p-4 border-b border-black/[0.05] bg-bm-cream/40 flex items-center justify-between">
                        <h2 className="text-lg font-serif font-bold text-bm-charcoal-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-bm-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Keranjang
                            {totalItem > 0 && (
                                <span className="bg-bm-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {totalItem}
                                </span>
                            )}
                        </h2>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-xs text-bm-red-500 hover:text-bm-red-700 font-semibold transition-colors"
                            >
                                Kosongkan
                            </button>
                        )}
                    </div>

                    {/* Container Scroll untuk Isi Keranjang & Checkout */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        {/* Alert Errors dari Backend */}
                        {errors?.cart && (
                            <div className="m-4 mb-0 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 shrink-0">
                                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{errors.cart}</span>
                            </div>
                        )}
                        {flash?.success && (
                            <div className="m-4 mb-0 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-start gap-2 animate-toast-in shrink-0">
                                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{flash.success}</span>
                            </div>
                        )}

                        {/* Daftar Item */}
                        <div className="flex-1 p-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-sm py-8">
                                <div className="w-16 h-16 rounded-2xl bg-bm-cream flex items-center justify-center mb-3 opacity-60">
                                    <svg className="w-8 h-8 text-bm-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                                <p className="font-serif italic text-base text-bm-charcoal-800">Keranjang masih kosong</p>
                                <p className="text-xs mt-1 text-bm-text-muted">Klik menu di sebelah kiri untuk menambah pesanan</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.menu_id} className="flex flex-col gap-2 p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                                                    {item.nama_menu}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{formatRupiah(item.harga)} / pcs</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.menu_id)}
                                                className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                                title="Hapus item"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center gap-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                                <button
                                                    onClick={() => updateJumlah(item.menu_id, -1)}
                                                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
                                                    disabled={item.jumlah <= 1}
                                                >
                                                    −
                                                </button>
                                                <span className="text-sm font-semibold w-8 text-center border-x border-gray-200 py-1.5">
                                                    {item.jumlah}
                                                </span>
                                                <button
                                                    onClick={() => updateJumlah(item.menu_id, 1)}
                                                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
                                                    disabled={item.jumlah >= item.max_stok}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="font-extrabold text-gray-900 text-sm tracking-tight">
                                                {formatRupiah(item.subtotal)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                        {/* Ringkasan & UI Checkout */}
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 space-y-4 shrink-0 mt-auto">
                        {/* Summary */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Total Item</span>
                                <span className="font-semibold text-gray-900">{totalItem} item</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="text-base font-bold text-bm-charcoal-900">Total Tagihan</span>
                                <span className="font-serif text-xl font-bold text-bm-red-600">{formatRupiah(totalHarga)}</span>
                            </div>
                        </div>

                        {/* Tipe Pesanan (Visual Selector) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Tipe Layanan
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'dine_in', icon: '🍽️', label: 'Dine In' },
                                    { value: 'take_away', icon: '🛍️', label: 'Take Away' },
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setTipePesanan(type.value)}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                                            tipePesanan === type.value
                                                ? 'border-bm-red-600 bg-bm-red-50 text-bm-red-700 ring-1 ring-bm-red-600'
                                                : 'border-gray-200 bg-white text-bm-text-muted hover:bg-bm-cream'
                                        }`}
                                    >
                                        <span>{type.icon}</span>
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Metode Pembayaran (Visual Selector — 3 Opsi) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Metode Pembayaran
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'Tunai',           icon: '💵', label: 'Tunai'    },
                                    { value: 'QRIS',            icon: '📱', label: 'QRIS'     },
                                    { value: 'Virtual Account', icon: '🏦', label: 'VA Bank'  },
                                ].map(method => (
                                    <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => { setMetodePembayaran(method.value); resetDigitalStatus(); }}
                                        className={`relative flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                                            metodePembayaran === method.value
                                                ? 'border-bm-gold-500 bg-gradient-to-b from-bm-gold-100 to-bm-gold-300/40 text-bm-charcoal-900 ring-1 ring-bm-gold-500 shadow-soft'
                                                : 'border-gray-200 bg-white text-bm-text-muted hover:bg-bm-cream'
                                        }`}
                                    >
                                        {metodePembayaran === method.value && (
                                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-bm-gold-500 text-white flex items-center justify-center shadow-sm">
                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </span>
                                        )}
                                        <span className="text-lg">{method.icon}</span>
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                            {/* Info hint untuk metode digital */}
                            {(metodePembayaran === 'QRIS' || metodePembayaran === 'Virtual Account') && (
                                <p className="mt-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                                    💡 Popup Midtrans akan muncul di layar ini. Arahkan pelanggan untuk
                                    {metodePembayaran === 'QRIS' ? ' scan QR Code.' : ' catat nomor Virtual Account.'}
                                </p>
                            )}
                        </div>

                        {/* Panel Kalkulator Tunai (Conditional rendering hanya jika Tunai) */}
                        {metodePembayaran === 'Tunai' && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-3 animate-fade-in shadow-sm">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                                        Uang Diterima (Rp)
                                    </label>
                                    <input 
                                        type="number"
                                        min={0}
                                        value={uangDiterima}
                                        onChange={e => setUangDiterima(e.target.value ? Number(e.target.value) : '')}
                                        placeholder="Contoh: 50000"
                                        className={`w-full text-right text-lg font-bold rounded-lg border focus:ring-2 focus:outline-none transition-colors ${
                                            uangDiterima !== '' && !isUangCukup
                                                ? 'border-red-300 focus:border-red-400 focus:ring-red-400 bg-bm-red-50 text-bm-red-700'
                                                : 'border-gray-300 focus:border-bm-gold-400 focus:ring-bm-gold-400'
                                        }`}
                                    />
                                    {uangDiterima !== '' && !isUangCukup && (
                                        <p className="text-xs text-red-500 mt-1 font-medium">Uang kurang {formatRupiah(totalHarga - Number(uangDiterima))}</p>
                                    )}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                    <span className="text-sm font-semibold text-gray-600">Kembalian</span>
                                    <span className={`text-lg font-bold ${kembalian > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                        {uangDiterima === '' ? 'Rp 0' : formatRupiah(kembalian > 0 ? kembalian : 0)}
                                    </span>
                                </div>
                            </div>
                        )}

                        </div>
                    </div>

                    {/* Area Tombol Bottom (Sticky) */}
                    <div className="p-4 border-t border-black/[0.05] bg-white mt-auto shrink-0 z-10 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.06)]">
                        {/* Tombol Final Checkout */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleCheckout}
                                disabled={
                                    !isStoreOpen ||
                                    cart.length === 0 ||
                                    isProcessing ||
                                    (metodePembayaran === 'Tunai' && !isUangCukup) ||
                                    digitalStatus === 'loading'
                                }
                                className={`w-full py-3.5 text-[15px] font-bold rounded-full shadow-soft transition-all duration-200 inline-flex items-center justify-center gap-2 text-white disabled:bg-none disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed hover:shadow-elevated hover:-translate-y-0.5 active:translate-y-0 ${
                                    metodePembayaran === 'Tunai' ? 'bg-gradient-to-r from-bm-red-500 to-bm-red-700' : 'bg-gradient-to-r from-bm-charcoal-700 to-bm-charcoal-900'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Menghubungi Midtrans...
                                    </>
                                ) : metodePembayaran === 'Tunai' ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Proses Pembayaran Tunai
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H2a1 1 0 00-1 1v5a1 1 0 001 1h3m10-11h3a1 1 0 011 1v5a1 1 0 01-1 1h-3m-6.5 0H8.5" />
                                        </svg>
                                        Buka Pembayaran {metodePembayaran}
                                    </>
                                )}
                            </button>
                            {!isStoreOpen && (
                                <p className="text-center text-xs text-red-600 font-medium tracking-wide animate-fade-in">
                                    Toko Tutup. Transaksi dihentikan.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ MODAL: Konfirmasi Pembayaran Tunai ═══ */}
            {showConfirmModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-modal-overlay"
                    onClick={() => setShowConfirmModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon Dompet */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-bm-gold-100 flex items-center justify-center ring-4 ring-bm-gold-100/50">
                                <svg className="w-8 h-8 text-bm-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
                                </svg>
                            </div>
                        </div>

                        {/* Judul */}
                        <h3 className="text-xl font-serif font-bold text-bm-charcoal-900 text-center">
                            Konfirmasi Pembayaran
                        </h3>

                        {/* Deskripsi Dinamis */}
                        <p className="text-gray-600 text-center mt-2 text-sm leading-relaxed">
                            Proses pembayaran <span className="font-semibold text-gray-800">Tunai</span> sebesar{' '}
                            <span className="font-bold text-bm-red-600">{formatRupiah(totalHarga)}</span>{' '}
                            dengan uang diterima{' '}
                            <span className="font-bold text-green-600">{formatRupiah(Number(uangDiterima))}</span>?
                        </p>

                        {/* Rincian Pesanan (Order Read-back) */}
                        <div className="mt-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Rincian Pesanan
                            </h4>
                            <div className="max-h-40 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
                                {cart.map(item => (
                                    <div key={item.menu_id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <span className="text-gray-700">
                                            <span className="font-bold text-gray-900">{item.jumlah}x</span>{' '}
                                            {item.nama_menu}
                                        </span>
                                        <span className="font-semibold text-gray-800 whitespace-nowrap ml-3">
                                            {formatRupiah(item.subtotal)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detail Ringkasan */}
                        <div className="mt-4 bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Item</span>
                                <span className="font-medium text-gray-800">{totalItem} item</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tipe Layanan</span>
                                <span className="font-medium text-gray-800">
                                    {tipePesanan === 'dine_in' ? '🍽️ Dine In' : '🛍️ Take Away'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                <span className="text-gray-500">Kembalian</span>
                                <span className="font-bold text-green-600">
                                    {formatRupiah(Number(uangDiterima) - totalHarga > 0 ? Number(uangDiterima) - totalHarga : 0)}
                                </span>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmCheckout}
                                className="flex-1 px-4 py-2.5 rounded-full bg-gradient-to-b from-bm-red-500 to-bm-red-600 hover:from-bm-red-600 hover:to-bm-red-700 text-white font-semibold text-sm shadow-soft hover:shadow-elevated transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Ya, Proses Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ MODAL: Konfirmasi Kosongkan Keranjang ═══ */}
            {showClearCartModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-modal-overlay"
                    onClick={() => setShowClearCartModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon Peringatan */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center ring-4 ring-red-50">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                        </div>

                        {/* Judul */}
                        <h3 className="text-lg font-bold text-gray-900 text-center">
                            Kosongkan Keranjang?
                        </h3>

                        {/* Deskripsi */}
                        <p className="text-gray-500 text-center mt-2 text-sm">
                            Semua <span className="font-semibold text-gray-700">{totalItem} item</span> di keranjang akan dihapus. Tindakan ini tidak bisa dibatalkan.
                        </p>

                        {/* Tombol Aksi */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowClearCartModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmClearCart}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Ya, Kosongkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ MODAL: Status Pembayaran Digital (QRIS / VA) ═══ */}
            {(digitalStatus === 'loading' || digitalStatus === 'success' || digitalStatus === 'pending' || digitalStatus === 'error') && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-overlay">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-modal-content">

                        {/* ── Loading State ── */}
                        {digitalStatus === 'loading' && (
                            <>
                                <div className="flex justify-center mb-5">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-blue-50">
                                        <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Menghubungi Midtrans...</h3>
                                <p className="text-sm text-gray-500 mt-2">Menyiapkan session pembayaran. Mohon tunggu sebentar.</p>
                            </>
                        )}

                        {/* ── Success State ── */}
                        {digitalStatus === 'success' && (
                            <>
                                <div className="flex justify-center mb-5">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center ring-4 ring-green-50">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-green-700">Pembayaran Berhasil! 🎉</h3>
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{digitalMessage}</p>
                                {completedOrderId && (
                                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl py-2 px-4 inline-block">
                                        <span className="text-sm font-mono font-bold text-green-700">Order #{completedOrderId}</span>
                                    </div>
                                )}
                                <button
                                    onClick={resetDigitalStatus}
                                    className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                                >
                                    ✓ Transaksi Berikutnya
                                </button>
                            </>
                        )}

                        {/* ── Pending State ── */}
                        {digitalStatus === 'pending' && (
                            <>
                                <div className="flex justify-center mb-5">
                                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center ring-4 ring-amber-50">
                                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-amber-700">Menunggu Pembayaran ⏳</h3>
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{digitalMessage}</p>
                                {completedOrderId && (
                                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl py-2 px-4 inline-block">
                                        <span className="text-sm font-mono font-bold text-amber-700">Order #{completedOrderId} — Sudah Tercatat</span>
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-3">Webhook Midtrans akan mengupdate status otomatis saat pelanggan melunasi pembayaran.</p>
                                <button
                                    onClick={resetDigitalStatus}
                                    className="mt-5 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
                                >
                                    OK, Transaksi Berikutnya
                                </button>
                            </>
                        )}

                        {/* ── Error State ── */}
                        {digitalStatus === 'error' && (
                            <>
                                <div className="flex justify-center mb-5">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center ring-4 ring-red-50">
                                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-red-700">Pembayaran Gagal</h3>
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{digitalMessage || 'Terjadi kesalahan. Silakan coba lagi.'}</p>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={resetDigitalStatus}
                                        className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Tutup
                                    </button>
                                    <button
                                        onClick={() => { resetDigitalStatus(); handleCheckoutDigital(); }}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                                    >
                                        Coba Lagi
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* CSS Tambahan untuk Scrollbar & Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #94a3b8;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                
                @keyframes toastIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-toast-in { animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

                @keyframes modalOverlay {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-modal-overlay { animation: modalOverlay 0.2s ease-out; }

                @keyframes modalContent {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-modal-content { animation: modalContent 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}} />
        </OwnerLayout>
    );
}
