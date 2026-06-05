import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import Button from '@/Components/ui/Button';

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

export default function CustomerMenu({ menus, kategoriList }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  
  // State Keranjang
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Form Checkout State sesuai Activity Diagram
  const [tipeLayanan, setTipeLayanan] = useState<'dine_in' | 'take_away'>('take_away');
  const [waktuKedatangan, setWaktuKedatangan] = useState('');
  const [metodePembayaran, setMetodePembayaran] = useState<'Transfer Bank' | 'QRIS'>('QRIS');
  const [jumlahOrang, setJumlahOrang] = useState<number>(1); // default 1 orang
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Kalkulasi waktu minimal kedatangan: 15 menit dari sekarang (untuk tampilan teks statis)
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

    // Logika Rollover: Jika jam yang dipilih lebih kecil dari jam sekarang, asumsikan untuk keesokan harinya
    if (selectedDate.getTime() < now.getTime()) {
      selectedDate.setDate(selectedDate.getDate() + 1);
    }

    const minTimeStr = `${String(minDate.getHours()).padStart(2, '0')}:${String(minDate.getMinutes()).padStart(2, '0')}`;
    
    return {
      isValid: selectedDate.getTime() >= minDate.getTime(),
      minTimeStr
    };
  };

  // Real-time validasi waktu: inline error + button lock (tanpa alert popup)
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

  // Filter menus based on category
  const filteredMenus = useMemo(() => {
    if (activeCategory === 'Semua') return menus;
    return menus.filter(m => m.kategori === activeCategory);
  }, [menus, activeCategory]);

  // Cart operations
  const addToCart = (menu: Menu) => {
    // Guard: jangan izinkan jika stok habis
    if (menu.stok <= 0) return;

    setCart(prev => {
      const exist = prev.find(item => item.menu.id === menu.id);
      if (exist) {
        // Jangan melebihi stok yang tersedia
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
        // Batasi agar tidak melebihi stok yang tersedia
        const clampedQty = Math.min(Math.max(0, newQty), item.menu.stok);
        return { ...item, jumlah: clampedQty };
      }
      return item;
    }).filter(item => item.jumlah > 0));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.menu.harga * item.jumlah), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.jumlah, 0), [cart]);

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Submit Handler
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Pengaman ganda: jika entah bagaimana waktu invalid lolos, silent reset
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
      // Kirim jumlah_orang hanya jika Dine In, null jika Take Away
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
    <CustomerLayout title="Pilih Menu Kesukaanmu">
      <Head title="Pesan Online - Burjo Minang" />

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
        <button
          onClick={() => setActiveCategory('Semua')}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === 'Semua' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          Semua
        </button>
        {kategoriList.map(kat => (
          <button
            key={kat}
            onClick={() => setActiveCategory(kat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === kat ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pb-24">
        {filteredMenus.map(menu => {
          const cartItem = cart.find(c => c.menu.id === menu.id);
          const qty = cartItem ? cartItem.jumlah : 0;

          return (
            <div key={menu.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col active:scale-[0.98] transition-transform">
              <div className="aspect-square bg-gray-50 dark:bg-gray-900 relative">
                {menu.gambar ? (
                  <img src={`/storage/${menu.gambar}`} alt={menu.nama_menu} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🍽️</div>
                )}
                {/* Rating Badge */}
                {menu.reviews_avg_rating !== null && menu.reviews_avg_rating > 0 && (
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-orange-500 shadow-sm flex items-center gap-1">
                    ⭐ {Number(menu.reviews_avg_rating).toFixed(1)}
                  </div>
                )}
              </div>
              
              <div className="p-3 sm:p-4 flex flex-col flex-1">
                <div className="text-[10px] text-orange-500 font-bold mb-1 uppercase tracking-wider">{menu.kategori}</div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2">{menu.nama_menu}</h3>
                
                <div className="mt-auto pt-2">
                  <div className="font-bold text-orange-500 mb-3 text-sm sm:text-base">{formatRupiah(menu.harga)}</div>
                  
                  {/* Add to Cart Control */}
                  {menu.stok <= 0 ? (
                    <button disabled className="w-full py-2 bg-gray-100 text-gray-400 font-bold rounded-xl text-xs sm:text-sm border border-gray-200 cursor-not-allowed">
                      Habis
                    </button>
                  ) : qty === 0 ? (
                    <button onClick={() => addToCart(menu)} className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-xs sm:text-sm shadow-sm hover:shadow active:scale-95">
                      + Tambah
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-xl p-1">
                      <button onClick={() => updateQuantity(menu.id, -1)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm text-orange-600 font-bold active:bg-orange-100">-</button>
                      <span className="font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">{qty}</span>
                      <button onClick={() => updateQuantity(menu.id, 1)} disabled={qty >= menu.stok} className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg shadow-sm font-bold ${qty >= menu.stok ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white active:bg-orange-600'}`}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Button (Mobile-First Sticky Bottom) */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-toast-in md:bottom-8 md:max-w-md md:left-auto md:right-8">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-gray-900 dark:bg-gray-800 border border-gray-800 dark:border-gray-700 text-white rounded-full p-4 flex items-center justify-between shadow-2xl hover:bg-black transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2.5 relative">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 border-2 border-gray-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-wide">
                Lihat Keranjang
              </span>
            </div>
            
            <span className="font-bold text-orange-400 text-sm sm:text-base tracking-wide">
              {formatRupiah(cartTotal)}
            </span>
          </button>
        </div>
      )}

      {/* Modal Checkout */}
      {showCart && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Checkout Pesanan</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 mb-4">
              {/* Rincian Pesanan */}
              <div className="space-y-4 mb-6">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Keranjang kosong.</div>
                ) : (
                  cart.map(item => (
                    <div key={item.menu.id} className="flex gap-4 items-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        {item.menu.gambar ? (
                           <img src={`/storage/${item.menu.gambar}`} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{item.menu.nama_menu}</h4>
                        <p className="text-amber-600 font-semibold text-sm">{formatRupiah(item.menu.harga)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => updateQuantity(item.menu.id, -1)} className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200">-</button>
                        <span className="font-semibold text-sm w-4 text-center">{item.jumlah}</span>
                        <button type="button" onClick={() => updateQuantity(item.menu.id, 1)} className="w-7 h-7 rounded bg-amber-100 flex items-center justify-center font-bold text-amber-600 hover:bg-amber-200">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                  
                  {/* Input 1: Tipe Layanan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pilih Layanan
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center justify-center py-3 px-4 rounded-xl border cursor-pointer transition-all ${tipeLayanan === 'take_away' ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                        <input type="radio" name="layanan" value="take_away" className="sr-only" 
                          checked={tipeLayanan === 'take_away'} onChange={() => setTipeLayanan('take_away')} />
                        🛍️ Take Away
                      </label>
                      <label className={`flex items-center justify-center py-3 px-4 rounded-xl border cursor-pointer transition-all ${tipeLayanan === 'dine_in' ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                        <input type="radio" name="layanan" value="dine_in" className="sr-only" 
                          checked={tipeLayanan === 'dine_in'} onChange={() => setTipeLayanan('dine_in')} />
                        🍽️ Dine In
                      </label>
                    </div>
                  </div>

                  {/* Input 1b: Jumlah Orang — HANYA tampil saat Dine In */}
                  {tipeLayanan === 'dine_in' && (
                    <div className="animate-fade-in">
                      <label
                        htmlFor="jumlah-orang"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Jumlah Orang <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        {/* Tombol kurang */}
                        <button
                          type="button"
                          onClick={() => setJumlahOrang(prev => Math.max(1, prev - 1))}
                          disabled={jumlahOrang <= 1}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-lg hover:bg-amber-100 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Kurangi jumlah orang"
                        >
                          −
                        </button>

                        {/* Input angka langsung */}
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
                          className="w-20 text-center text-xl font-bold px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          aria-label="Jumlah orang"
                        />

                        {/* Tombol tambah */}
                        <button
                          type="button"
                          onClick={() => setJumlahOrang(prev => Math.min(50, prev + 1))}
                          disabled={jumlahOrang >= 50}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-lg hover:bg-amber-100 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Tambah jumlah orang"
                        >
                          +
                        </button>

                        <span className="text-sm text-gray-500 dark:text-gray-400">orang</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Maksimal 50 orang. Hubungi kami untuk reservasi lebih besar.
                      </p>
                    </div>
                  )}

                  {/* Input 2: Jam Kedatangan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jam Kedatangan (Opsional)
                    </label>
                    <input 
                      type="time" 
                      value={waktuKedatangan}
                      onChange={handleTimeChange}
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white ${
                        timeError ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-300 dark:border-gray-700'
                      }`}
                    />
                    {timeError && <p className="text-red-500 text-xs mt-1">{timeError}</p>}
                    <p className="text-xs text-gray-500 mt-2">Minimal {getMinTimeStr()} WIB. Dikosongkan jika pesanan ingin langsung diproses sekarang.</p>
                  </div>

                  {/* Input 3: Metode Pembayaran */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Metode Pembayaran
                    </label>
                    <select 
                      value={metodePembayaran}
                      onChange={e => setMetodePembayaran(e.target.value as 'Transfer Bank' | 'QRIS')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-white appearance-none"
                    >
                      <option value="QRIS">QRIS</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                    </select>
                  </div>
                </form>
              )}
            </div>

            {/* Total Bayar & Tombol Konfirmasi */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Total Bayar</span>
                  <span className="text-2xl font-bold text-amber-600">{formatRupiah(cartTotal)}</span>
                </div>
                <Button 
                  type="submit" 
                  form="checkout-form"
                  className={`w-full py-4 text-lg shadow-lg ${timeError ? 'opacity-50 cursor-not-allowed !bg-gray-400 hover:!bg-gray-400' : ''}`}
                  disabled={isSubmitting || !!timeError}
                >
                  {isSubmitting ? 'Memproses...' : timeError ? '⚠ Perbaiki Waktu Kedatangan' : 'Lakukan Pembayaran'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
