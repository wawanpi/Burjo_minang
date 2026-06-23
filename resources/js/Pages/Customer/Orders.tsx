import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import CustomerLayout from '@/Layouts/CustomerLayout';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';

type TabType = 'aktif' | 'riwayat';

interface OrderItem {
  id: number;
  menu_id: number;
  jumlah: number;
  subtotal: number;
  menu: {
    id: number;
    nama_menu: string;
    harga: number;
    kategori: string;
    gambar: string | null;
  } | null;
  has_review: boolean;
}

interface Order {
  id: number;
  total_harga: number;
  status_pesanan: string;
  tanggal_pesan: string;
  tipe_pesanan: string;
  waktu_pengambilan: string | null;
  sisa_menit: number | null;
  payment: {
    metode_pembayaran: string;
    status_pembayaran: string;
    payment_url?: string;
  } | null;
  order_items: OrderItem[];
  can_review: boolean;
}

interface Props {
  orders: Order[];
  tab: TabType;
}

const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    menunggu_pembayaran: 'warning',
    diproses: 'info',
    selesai: 'success',
    batal: 'danger',
  };
  return map[status] || 'neutral';
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    menunggu_pembayaran: 'Tunggu Bayar',
    diproses: 'Sedang Diproses',
    selesai: 'Selesai',
    batal: 'Dibatalkan',
  };
  return map[status] || status;
};

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

export default function CustomerOrders({ orders, tab }: Props) {
  const { flash } = usePage().props as any;
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  
  // Anti-Gravity Animation State
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Review Form State
  const [reviewForms, setReviewForms] = useState<Record<number, { rating: number, komentar: string }>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const switchTab = (newTab: TabType) => {
    router.get(route('customer.orders'), { tab: newTab }, { preserveState: true });
  };

  const openReviewModal = (order: Order) => {
    setSelectedOrderForReview(order);
    const initialForms: Record<number, { rating: number, komentar: string }> = {};
    order.order_items.forEach(item => {
      if (item.menu && !item.has_review) {
        initialForms[item.menu_id] = { rating: 0, komentar: '' };
      }
    });
    setReviewForms(initialForms);
  };

  const setRating = (menuId: number, rating: number) => {
    setReviewForms(prev => ({ ...prev, [menuId]: { ...prev[menuId], rating } }));
  };

  const setKomentar = (menuId: number, komentar: string) => {
    setReviewForms(prev => ({ ...prev, [menuId]: { ...prev[menuId], komentar } }));
  };

  const submitReviews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;
    
    const reviewsArray = Object.entries(reviewForms)
      .map(([menu_id, data]) => ({
        menu_id: Number(menu_id),
        rating: data.rating,
        komentar: data.komentar
      }))
      .filter(r => r.rating > 0);

    if (reviewsArray.length === 0) {
      alert("Silakan berikan minimal 1 bintang untuk menu yang ingin diulas.");
      return;
    }

    setIsSubmittingReview(true);
    router.post(route('customer.reviews.store', selectedOrderForReview.id), { reviews: reviewsArray }, {
      onSuccess: () => {
        setIsSubmittingReview(false);
        setSelectedOrderForReview(null);
      },
      onError: () => {
        setIsSubmittingReview(false);
        alert("Terjadi kesalahan saat mengirim ulasan.");
      }
    });
  };

  return (
    <CustomerLayout title="Pesanan Saya">
      <Head title="Pesanan Saya - Burjo Minang" />
      
      <div className="flex flex-col min-h-screen font-sans">
        
        {/* ═══════════════════════════════════════════════════════════════════════
            DRAMATIC HERO SECTION — Dark Pekat
            ═══════════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[280px] sm:min-h-[320px] w-full overflow-hidden bg-gray-950 shrink-0">
          {/* Background Image */}
          <img 
            src="https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=1920&q=80" 
            alt="Riwayat Pesanan" 
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{ objectPosition: 'center 40%' }}
          />

          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#990000]/30 via-transparent to-[#990000]/20" />

          {/* Texture */}
          <div className="absolute inset-0 opacity-[0.04]"
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center justify-center text-center py-16 sm:py-20">
            <div className={`transition-all duration-1000 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm text-white/70 text-[10px] tracking-[0.3em] uppercase font-extrabold shadow-lg">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                Aktivitas Anda
              </span>
            </div>

            <h1 className={`mt-6 font-extrabold tracking-tight leading-[0.95] transition-all duration-1000 ease-out delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="block text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-2xl">
                Riwayat
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl text-yellow-400 mt-1 drop-shadow-2xl">
                Pesanan
              </span>
            </h1>

            <div className={`mt-5 transition-all duration-1000 ease-out delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Divider />
            </div>

            <p className={`mt-3 text-white/80 text-sm sm:text-base max-w-lg font-bold leading-relaxed transition-all duration-1000 ease-out delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Lacak status pesanan Anda dan berikan ulasan untuk pelayanan kami.
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
          <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-4 sm:pt-8">

            {/* Flash Messages */}
            {flash?.success && (
              <div className={`mb-6 rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 font-bold flex items-center gap-2 shadow-sm transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="text-xl">✅</span> {flash.success}
              </div>
            )}
            {flash?.error && (
              <div className={`mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-bold flex items-center gap-2 shadow-sm transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="text-xl">❌</span> {flash.error}
              </div>
            )}

            {/* Dual Tab Navigation */}
            <div className={`flex border-b-2 border-gray-100 mb-8 transition-all duration-1000 ease-out delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <button
                onClick={() => switchTab('aktif')}
                className={`flex-1 sm:flex-none relative py-4 px-8 text-sm font-extrabold uppercase tracking-widest transition-colors ${
                  tab === 'aktif' ? 'text-[#990000]' : 'text-gray-400 hover:text-[#c70024]'
                }`}
              >
                Pesanan Aktif
                {tab === 'aktif' && <span className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[#990000] rounded-t-full shadow-[0_-2px_10px_rgba(153,0,0,0.3)]" />}
              </button>
              <button
                onClick={() => switchTab('riwayat')}
                className={`flex-1 sm:flex-none relative py-4 px-8 text-sm font-extrabold uppercase tracking-widest transition-colors ${
                  tab === 'riwayat' ? 'text-[#990000]' : 'text-gray-400 hover:text-[#c70024]'
                }`}
              >
                Riwayat
                {tab === 'riwayat' && <span className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[#990000] rounded-t-full shadow-[0_-2px_10px_rgba(153,0,0,0.3)]" />}
              </button>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className={`text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 transition-all duration-1000 ease-out delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  <span className="text-6xl opacity-30 block mb-4">🧾</span>
                  <h3 className="text-gray-900 font-extrabold text-xl mb-2">Belum Ada Pesanan</h3>
                  <p className="text-gray-500 font-bold text-sm">Pesanan Anda akan muncul di sini setelah Anda melakukan pemesanan.</p>
                </div>
              ) : (
                orders.map((order, index) => {
                  const animDelay = 200 + (index * 50);

                  return (
                    <div 
                      key={order.id} 
                      style={{ transitionDelay: `${animDelay}ms` }}
                      className={`group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#c70024]/15 hover:border-gray-200 ${
                        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/80">
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="font-extrabold text-gray-900 text-lg">#{order.id}</span>
                            <Badge label={statusLabel(order.status_pesanan)} variant={statusVariant(order.status_pesanan)} />
                          </div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            {new Date(order.tanggal_pesan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-[#c70024] text-xl mb-1.5">{formatRupiah(order.total_harga)}</div>
                          <span className={`text-[9px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest shadow-sm ${
                             order.payment?.status_pembayaran === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.payment?.status_pembayaran || 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-5 space-y-4">
                        {order.order_items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-[#990000] bg-red-50 px-2 py-1 rounded-lg w-8 text-center">{item.jumlah}x</span>
                              <span className="font-bold text-gray-700 line-clamp-1">{item.menu?.nama_menu || 'Menu Dihapus'}</span>
                            </div>
                            <span className="font-extrabold text-gray-900">{formatRupiah(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Alerts / Actions */}
                      {(order.status_pesanan === 'menunggu_pembayaran' && order.payment?.payment_url) && (
                        <div className="px-5 py-5 bg-red-50 border-t border-red-100 text-center flex flex-col items-center">
                          <a 
                            href={order.payment.payment_url}
                            className="inline-block w-full sm:w-auto px-8 py-3.5 bg-[#c70024] hover:bg-[#a3001e] text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-red-500/30 hover:-translate-y-1 mb-3"
                          >
                            💸 Bayar Sekarang
                          </a>
                          <p className="text-[11px] text-[#990000] font-extrabold uppercase tracking-widest">
                            Selesaikan pembayaran segera agar pesanan diproses.
                          </p>
                        </div>
                      )}

                      {(order.status_pesanan === 'diproses' && order.waktu_pengambilan) && (
                        <div className="px-5 py-4 bg-yellow-50 border-t border-yellow-100 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-800">Estimasi Pengambilan:</span>
                          <span className="text-sm font-extrabold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                            {order.sisa_menit !== null && order.sisa_menit > 0 
                              ? `${Math.round(order.sisa_menit)} menit lagi` 
                              : 'Sekarang'}
                          </span>
                        </div>
                      )}

                      {/* Review Button for completed orders */}
                      {tab === 'riwayat' && order.can_review && (
                        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                          <button 
                            onClick={() => openReviewModal(order)} 
                            className="w-full py-3.5 bg-white border-2 border-gray-200 hover:border-[#c70024] text-gray-700 hover:text-[#c70024] font-extrabold rounded-full transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
                          >
                            ⭐ Berikan Ulasan
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* ═══ REVIEW MODAL (Anti-Gravity) ═══ */}
        {selectedOrderForReview && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedOrderForReview(null)} />
            
            {/* Modal Container */}
            <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
              
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100 shrink-0">
                <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">Beri Ulasan</h3>
                <button onClick={() => setSelectedOrderForReview(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-[#c70024] hover:rotate-90 transition-all duration-300 font-bold">✕</button>
              </div>
              
              <p className="text-sm font-bold text-gray-500 mb-6 shrink-0">Bagaimana rasa dan kualitas makanan yang Anda pesan?</p>

              <form onSubmit={submitReviews} className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {selectedOrderForReview.order_items.map(item => {
                  if (!item.menu || item.has_review) return null;
                  
                  const menuId = item.menu_id;
                  const currentRating = reviewForms[menuId]?.rating || 0;
                  const currentKomentar = reviewForms[menuId]?.komentar || '';

                  return (
                    <div key={item.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-4 mb-4 border-b border-gray-200 pb-4">
                        {item.menu.gambar ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm shrink-0">
                            <img src={`/storage/${item.menu.gambar}`} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-2xl shadow-sm shrink-0">🍽️</div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-gray-900 text-base">{item.menu.nama_menu}</h4>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#990000] mt-1">{item.menu.kategori}</p>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="flex gap-2 mb-5 justify-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(menuId, star)}
                            className={`text-4xl transition-all duration-300 hover:scale-125 focus:outline-none ${
                              star <= currentRating ? 'text-yellow-400 drop-shadow-md scale-110' : 'text-gray-300 grayscale opacity-40 hover:opacity-80'
                            }`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>

                      {/* Comment */}
                      <textarea
                        placeholder="Tambahkan komentar (opsional)..."
                        className="w-full text-sm font-bold rounded-xl border-gray-200 bg-white focus:border-[#c70024] focus:ring-[#c70024] p-4 transition-colors"
                        rows={3}
                        value={currentKomentar}
                        onChange={(e) => setKomentar(menuId, e.target.value)}
                      />
                    </div>
                  );
                })}

                <div className="pt-4 sticky bottom-0 bg-white">
                  <button type="submit" className={`w-full py-4 text-white font-extrabold tracking-wide rounded-full transition-all duration-300 shadow-xl ${
                    isSubmittingReview ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-[#c70024] hover:bg-[#a3001e] hover:-translate-y-1 hover:shadow-red-500/40 active:scale-[0.98]'
                  }`} disabled={isSubmittingReview}>
                    {isSubmittingReview ? 'Mengirim Ulasan...' : 'Kirim Ulasan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  );
}
