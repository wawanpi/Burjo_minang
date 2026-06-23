import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';

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

// ─── Ornamental Divider ───────────────────────────────────────────────
function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <span className="block h-px w-12 bg-yellow-400/40" />
      <span className="text-lg text-yellow-400">✦</span>
      <span className="block h-px w-12 bg-yellow-400/40" />
    </div>
  );
}

export default function CustomerMenu({ menus, kategoriList }: Props) {
  // ─── State animasi load (Anti-Gravity) ─────────────────────────────────────
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  
  // ─── State Keranjang ───────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // ─── Form Checkout State ───────────────────────────────────────────────────
  const [tipeLayanan, setTipeLayanan] = useState<'dine_in' | 'take_away'>('take_away');
  const [waktuKedatangan, setWaktuKedatangan] = useState('');
  const [metodePembayaran, setMetodePembayaran] = useState<'Transfer Bank' | 'QRIS'>('QRIS');
  const [jumlahOrang, setJumlahOrang] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  // ─── Kalkulasi waktu minimal ───────────────────────────────────────────────
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
      minTimeStr
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
    return menus.filter(m => m.kategori === activeCategory);
  }, [menus, activeCategory]);

  const addToCart = (menu: Menu) => {
    if (menu.stok <= 0) return;

    setCart(prev => {
      const exist = prev.find(item => item.menu.id === menu.id);
      if (exist) {
        if (exist.jumlah >= menu.stok) return prev;
        return prev.map(item =>
          item.menu.id === menu.id ? { ...item, jumlah: item.jumlah + 1 } : item
        );
      }
      return [...prev, { menu, jumlah: 1 }];
    });
  };

  const updateQuantity = (menuId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.menu.id === menuId) {
        const newQty = item.jumlah + delta;
        const clampedQty = Math.min(Math.max(0, newQty), item.menu.stok);
        return { ...item, jumlah: clampedQty };
      }
      return item;
    }).filter(item => item.jumlah > 0));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.menu.harga * item.jumlah), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.jumlah, 0), [cart]);

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleCheckout = (e: React.FormEvent) => {
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

    const payload = {
      items: cart.map(item => ({
        menu_id: item.menu.id,
        jumlah: item.jumlah,
        harga: item.menu.harga,
      })),
      tipe_pesanan: tipeLayanan,
      waktu_pengambilan: waktuKedatangan || null,
      metode_pembayaran: metodePembayaran,
      jumlah_orang: tipeLayanan === 'dine_in' ? jumlahOrang : null,
    };

    router.post(route('customer.checkout'), payload, {
      onSuccess: () => {
        setCart([]);
        setShowCart(false);
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
        alert('Gagal memproses checkout. Silakan periksa kembali keranjang Anda.');
      }
    });
  };

  return (
    <CustomerLayout>
      <Head title="Pesan Online - Burjo Minang" />

      <div className="flex flex-col min-h-screen font-sans">
        {/* ═══════════════════════════════════════════════════════════════════════
            HERO SECTION — Dramatic Dark Pekat
            ═══════════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[320px] sm:min-h-[380px] w-full overflow-hidden bg-gray-950 shrink-0">
          {/* Background Image */}
          <img 
            src="https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=1920&q=80" 
            alt="Rendang premium" 
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{ objectPosition: 'center 40%' }}
          />

          {/* Multi-layer gradient overlay (Pekat) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#990000]/30 via-transparent to-[#990000]/20" />

          {/* Decorative grain texture */}
          <div className="absolute inset-0 opacity-[0.04]"
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center justify-center text-center py-16 sm:py-20">
            
            {/* Overline Badge */}
            <div className={`transition-all duration-1000 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm text-white/70 text-[10px] tracking-[0.3em] uppercase font-extrabold shadow-lg">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                Pesan Online
              </span>
            </div>

            {/* Main Headline */}
            <h1 className={`mt-6 font-extrabold tracking-tight leading-[0.95] transition-all duration-1000 ease-out delay-200 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <span className="block text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-2xl">
                Pilih Menu
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl text-yellow-400 mt-1 drop-shadow-2xl">
                Kesukaanmu
              </span>
            </h1>

            {/* Divider */}
            <div className={`mt-5 transition-all duration-1000 ease-out delay-300 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <Divider />
            </div>

            {/* Subtitle */}
            <p className={`mt-3 text-white/80 text-sm sm:text-base max-w-lg font-bold leading-relaxed transition-all duration-1000 ease-out delay-500 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              Cita rasa otentik yang selalu dirindukan — dipilih dan disiapkan khusus untukmu.
            </p>
          </div>

          {/* Bottom Curve */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" className="w-full">
              <path d="M0 80h1440V30c-240 35-480 50-720 50S240 65 0 30v50z" fill="#ffffff" />
            </svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN CONTENT — Clean Light
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 bg-white text-gray-900 pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-4 sm:pt-8">

          {/* ── Category Tabs ─────────────────────────────────────────────── */}
          <div className={`flex overflow-x-auto pb-4 mb-8 gap-2.5 no-scrollbar transition-all duration-1000 ease-out delay-200 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <button
              onClick={() => setActiveCategory('Semua')}
              className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeCategory === 'Semua' 
                  ? 'bg-[#c70024] text-white shadow-lg shadow-red-500/30 scale-105' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#c70024] hover:text-[#c70024]'
              }`}
            >
              Semua
            </button>
            {kategoriList.map(kat => (
              <button
                key={kat}
                onClick={() => setActiveCategory(kat)}
                className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeCategory === kat 
                    ? 'bg-[#c70024] text-white shadow-lg shadow-red-500/30 scale-105' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#c70024] hover:text-[#c70024]'
                }`}
              >
                {kat}
              </button>
            ))}
          </div>

          {/* ── Menu Grid ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredMenus.map((menu, index) => {
              const cartItem = cart.find(c => c.menu.id === menu.id);
              const qty = cartItem ? cartItem.jumlah : 0;
              const animDelay = 200 + (index * 50);

              return (
                <div 
                  key={menu.id} 
                  style={{ transitionDelay: `${animDelay}ms` }}
                  className={`group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#c70024]/15 ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {/* Image Container */}
                  <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                    {menu.gambar ? (
                      <img src={`/storage/${menu.gambar}`} alt={menu.nama_menu} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <span className="text-4xl opacity-20">🍽️</span>
                      </div>
                    )}
                    
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    {/* Kategori Badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#990000]/95 backdrop-blur-sm text-[10px] font-extrabold uppercase tracking-widest text-white rounded-full shadow-lg">
                      {menu.kategori}
                    </span>

                    {/* Rating Badge */}
                    {menu.reviews_avg_rating !== null && menu.reviews_avg_rating > 0 && (
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-extrabold text-gray-900 shadow-sm flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span> {Number(menu.reviews_avg_rating).toFixed(1)}
                      </div>
                    )}

                    {/* Floating Price on hover */}
                    <div className="absolute bottom-3 right-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                      <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-[#c70024] font-extrabold tracking-tight text-xs shadow-xl">
                        {formatRupiah(menu.harga)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 relative bg-white">
                    <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-[#c70024] transition-colors duration-300">
                      {menu.nama_menu}
                    </h3>
                    
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <div className="font-extrabold tracking-tight text-[#c70024] mb-3 text-base sm:text-lg">{formatRupiah(menu.harga)}</div>
                      
                      {/* Add to Cart Control */}
                      {menu.stok <= 0 ? (
                        <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-xl text-xs sm:text-sm border border-gray-200 cursor-not-allowed transition-all">
                          Habis
                        </button>
                      ) : qty === 0 ? (
                        <button onClick={() => addToCart(menu)} className="w-full py-2.5 bg-[#c70024] hover:bg-[#a3001e] text-white font-bold rounded-xl transition-all duration-300 text-xs sm:text-sm shadow-md hover:shadow-red-500/30 active:scale-95">
                          + Tambah
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-1.5 shadow-inner">
                          <button onClick={() => updateQuantity(menu.id, -1)} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-[#c70024] font-bold active:bg-red-100 hover:scale-110 transition-all duration-200">-</button>
                          <span className="font-extrabold text-gray-900 text-sm sm:text-base w-8 text-center">{qty}</span>
                          <button onClick={() => updateQuantity(menu.id, 1)} disabled={qty >= menu.stok} className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg shadow-sm font-bold transition-all duration-200 ${qty >= menu.stok ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#c70024] text-white active:bg-[#a3001e] hover:scale-110'}`}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredMenus.length === 0 && (
            <div className={`text-center py-20 transition-all duration-700 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="text-6xl mb-4 opacity-30">🍽️</div>
              <h3 className="font-extrabold tracking-tight text-gray-900 text-xl mb-2">Menu Belum Tersedia</h3>
              <p className="text-gray-500 font-bold text-sm">Belum ada menu di kategori ini. Coba kategori lain!</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FLOATING CART BUTTON
          ═══════════════════════════════════════════════════════════════════════ */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-toast-in md:bottom-8 md:max-w-md md:left-auto md:right-8 font-sans">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-[#c70024] hover:bg-[#a3001e] border border-[#a3001e] text-white rounded-full p-4 flex items-center justify-between shadow-2xl shadow-red-500/40 transition-all duration-300 active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2.5 relative group-hover:scale-110 group-hover:rotate-[-8deg] transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 border-2 border-[#c70024] text-gray-900 text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              </div>
              <span className="font-extrabold tracking-tight text-sm sm:text-base">
                Lihat Pesanan
              </span>
            </div>
            
            <span className="font-extrabold tracking-tight text-yellow-400 text-sm sm:text-base pr-2">
              {formatRupiah(cartTotal)}
            </span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL CHECKOUT
          ═══════════════════════════════════════════════════════════════════════ */}
      {showCart && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center font-sans">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCart(false)} />
          
          {/* Container Modal */}
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100 shrink-0">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Rincian Pesanan</h2>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#990000] mt-1">{cartCount} item · {formatRupiah(cartTotal)}</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-[#c70024] transition-all duration-300 font-bold hover:rotate-90">
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 mb-4 custom-scrollbar">
              {/* List Item Keranjang */}
              <div className="space-y-3 mb-8">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3 opacity-30">🛒</div>
                    <p className="text-gray-400 font-bold">Keranjang masih kosong.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.menu.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-[#c70024]/20 hover:bg-red-50/30 transition-all duration-300">
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100">
                        {item.menu.gambar ? (
                           <img src={`/storage/${item.menu.gambar}`} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-50">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold tracking-tight text-gray-900 text-sm line-clamp-1">{item.menu.nama_menu}</h4>
                        <p className="text-[#c70024] font-extrabold tracking-tight text-sm mt-0.5">{formatRupiah(item.menu.harga)}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm shrink-0">
                        <button type="button" onClick={() => updateQuantity(item.menu.id, -1)} className="w-7 h-7 rounded bg-red-50 flex items-center justify-center font-bold text-[#c70024] hover:bg-red-100 transition-colors">-</button>
                        <span className="font-extrabold text-sm w-5 text-center text-gray-900">{item.jumlah}</span>
                        <button type="button" onClick={() => updateQuantity(item.menu.id, 1)} className="w-7 h-7 rounded bg-[#c70024] flex items-center justify-center font-bold text-white hover:bg-[#a3001e] transition-colors">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ── Form Checkout ─────────────────────────────────────────── */}
              {cart.length > 0 && (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                  
                  {/* Input 1: Tipe Layanan */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#990000] mb-3">
                      Pilih Layanan
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex flex-col items-center justify-center py-4 px-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${tipeLayanan === 'take_away' ? 'border-[#c70024] bg-red-50 text-[#c70024] shadow-md shadow-red-500/10' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}>
                        <input type="radio" name="layanan" value="take_away" className="sr-only" 
                          checked={tipeLayanan === 'take_away'} onChange={() => setTipeLayanan('take_away')} />
                        <span className="text-2xl mb-1">🛍️</span>
                        <span className="font-bold text-sm">Take Away</span>
                      </label>
                      <label className={`flex flex-col items-center justify-center py-4 px-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${tipeLayanan === 'dine_in' ? 'border-[#c70024] bg-red-50 text-[#c70024] shadow-md shadow-red-500/10' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}>
                        <input type="radio" name="layanan" value="dine_in" className="sr-only" 
                          checked={tipeLayanan === 'dine_in'} onChange={() => setTipeLayanan('dine_in')} />
                        <span className="text-2xl mb-1">🍽️</span>
                        <span className="font-bold text-sm">Dine In</span>
                      </label>
                    </div>
                  </div>

                  {/* Input 1b: Jumlah Orang — HANYA tampil saat Dine In */}
                  {tipeLayanan === 'dine_in' && (
                    <div className="animate-fade-in bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <label htmlFor="jumlah-orang" className="block text-[10px] font-extrabold uppercase tracking-widest text-[#990000] mb-3">
                        Jumlah Orang <span className="text-[#c70024]">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setJumlahOrang(prev => Math.max(1, prev - 1))}
                          disabled={jumlahOrang <= 1}
                          className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-extrabold text-xl hover:border-[#c70024] hover:text-[#c70024] disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-400 transition-all duration-300 shadow-sm"
                        >
                          −
                        </button>
                        <input
                          id="jumlah-orang"
                          type="number"
                          min={1}
                          max={50}
                          value={jumlahOrang}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= 50) setJumlahOrang(val);
                          }}
                          className="w-24 text-center text-2xl font-extrabold tracking-tight px-3 py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:border-[#c70024] focus:ring-0 text-gray-900 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => setJumlahOrang(prev => Math.min(50, prev + 1))}
                          disabled={jumlahOrang >= 50}
                          className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-extrabold text-xl hover:border-[#c70024] hover:text-[#c70024] disabled:opacity-50 disabled:border-gray-200 disabled:text-gray-400 transition-all duration-300 shadow-sm"
                        >
                          +
                        </button>
                        <span className="text-sm font-bold text-gray-500 ml-2">Orang</span>
                      </div>
                    </div>
                  )}

                  {/* Input 2: Jam Kedatangan */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#990000] mb-1">
                      Jam Kedatangan (Opsional)
                    </label>
                    <p className="text-[11px] text-gray-500 font-bold mb-3">Dikosongkan jika pesanan ingin langsung diproses sekarang.</p>
                    <input 
                      type="time" 
                      value={waktuKedatangan}
                      onChange={handleTimeChange}
                      className={`w-full px-0 py-3 bg-transparent border-0 border-b-2 text-lg font-bold text-gray-900 focus:ring-0 transition-colors ${
                        timeError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#c70024]'
                      }`}
                    />
                    {timeError && <p className="text-[#c70024] text-xs font-bold mt-2">{timeError}</p>}
                    <p className="text-[11px] font-bold text-yellow-600 mt-2 bg-yellow-50 inline-block px-2.5 py-1 rounded-full">Min. {getMinTimeStr()} WIB (Waktu Persiapan)</p>
                  </div>

                  {/* Input 3: Metode Pembayaran */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#990000] mb-3">
                      Metode Pembayaran
                    </label>
                    <select 
                      value={metodePembayaran}
                      onChange={e => setMetodePembayaran(e.target.value as 'Transfer Bank' | 'QRIS')}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-300 focus:border-[#c70024] focus:ring-0 text-lg font-bold text-gray-900 transition-colors"
                    >
                      <option value="QRIS">💳 QRIS (Direkomendasikan)</option>
                      <option value="Transfer Bank">🏦 Transfer Bank</option>
                    </select>
                  </div>
                </form>
              )}
            </div>

            {/* ── Total Bayar & Tombol Konfirmasi ─────────────────────────── */}
            {cart.length > 0 && (
              <div className="pt-6 border-t-2 border-gray-100 shrink-0 mt-2">
                <div className="flex items-end justify-between mb-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#990000]">Total Pembayaran</span>
                  <span className="text-3xl font-extrabold tracking-tight text-[#c70024] leading-none">{formatRupiah(cartTotal)}</span>
                </div>
                <button 
                  type="submit" 
                  form="checkout-form"
                  className={`w-full py-4 rounded-full text-white font-extrabold tracking-wide transition-all duration-300 shadow-xl ${
                    timeError || isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-[#c70024] hover:bg-[#a3001e] hover:shadow-red-500/40 hover:-translate-y-1 active:scale-[0.98]'
                  }`}
                  disabled={isSubmitting || !!timeError}
                >
                  {isSubmitting ? 'Memproses Pesanan...' : timeError ? 'Perbaiki Waktu Kedatangan' : 'Lanjutkan ke Pembayaran'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </CustomerLayout>
  );
}