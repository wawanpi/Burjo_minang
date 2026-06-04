import React, { useState } from 'react';
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

export default function CustomerOrders({ orders, tab }: Props) {
  const { flash } = usePage().props as any;
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  
  // Review Form State: { menu_id: { rating: number, komentar: string } }
  const [reviewForms, setReviewForms] = useState<Record<number, { rating: number, komentar: string }>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const switchTab = (newTab: TabType) => {
    router.get(route('customer.orders'), { tab: newTab }, { preserveState: true });
  };

  const openReviewModal = (order: Order) => {
    setSelectedOrderForReview(order);
    // Initialize review forms for items that don't have reviews yet
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
    
    // Transform object state to array for backend
    const reviewsArray = Object.entries(reviewForms)
      .map(([menu_id, data]) => ({
        menu_id: Number(menu_id),
        rating: data.rating,
        komentar: data.komentar
      }))
      .filter(r => r.rating > 0); // Only submit if rating is selected

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

      {/* Flash Messages */}
      {flash?.success && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 flex items-center gap-2">
          <span className="text-xl">✅</span> {flash.success}
        </div>
      )}
      {flash?.error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <span className="text-xl">❌</span> {flash.error}
        </div>
      )}

      {/* Dual Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => switchTab('aktif')}
          className={`flex-1 sm:flex-none relative py-3 px-6 text-sm font-medium transition-colors ${
            tab === 'aktif' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Pesanan Aktif
          {tab === 'aktif' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => switchTab('riwayat')}
          className={`flex-1 sm:flex-none relative py-3 px-6 text-sm font-medium transition-colors ${
            tab === 'riwayat' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Riwayat
          {tab === 'riwayat' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <span className="text-5xl opacity-30 block mb-4">🧾</span>
            <h3 className="text-gray-500 dark:text-gray-400 font-medium">Belum ada pesanan di kategori ini.</h3>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-gray-900 dark:text-white">#{order.id}</span>
                    <Badge label={statusLabel(order.status_pesanan)} variant={statusVariant(order.status_pesanan)} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(order.tanggal_pesan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white mb-1">{formatRupiah(order.total_harga)}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                     order.payment?.status_pembayaran === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.payment?.status_pembayaran || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 space-y-3">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 w-6">{item.jumlah}x</span>
                      <span className="text-gray-600 dark:text-gray-400 line-clamp-1">{item.menu?.nama_menu || 'Menu Dihapus'}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-200">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Footer Alerts / Actions */}
              {(order.status_pesanan === 'menunggu_pembayaran' && order.payment?.payment_url) && (
                <div className="px-4 py-4 bg-red-50/50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-800/30 text-center flex flex-col items-center">
                  <a 
                    href={order.payment.payment_url}
                    className="inline-block w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm mb-2"
                  >
                    💸 Bayar Sekarang
                  </a>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Selesaikan pembayaran dalam 5 menit atau pesanan otomatis dibatalkan.
                  </p>
                </div>
              )}

              {(order.status_pesanan === 'diproses' && order.waktu_pengambilan) && (
                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-400">Estimasi Pengambilan:</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-500">
                    {order.sisa_menit !== null && order.sisa_menit > 0 
                      ? `${Math.round(order.sisa_menit)} menit lagi` 
                      : 'Sekarang'}
                  </span>
                </div>
              )}

              {/* Review Button for completed orders */}
              {tab === 'riwayat' && order.can_review && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  <Button onClick={() => openReviewModal(order)} className="w-full">
                    ⭐ Beri Ulasan
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ═══ REVIEW MODAL ═══ */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrderForReview(null)} />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 sm:rounded-3xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Beri Ulasan</h3>
              <button onClick={() => setSelectedOrderForReview(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">✕</button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Bagaimana rasa dan kualitas makanan yang Anda pesan?</p>

            <form onSubmit={submitReviews} className="space-y-6">
              {selectedOrderForReview.order_items.map(item => {
                if (!item.menu || item.has_review) return null; // Skip if menu is deleted or already reviewed
                
                const menuId = item.menu_id;
                const currentRating = reviewForms[menuId]?.rating || 0;
                const currentKomentar = reviewForms[menuId]?.komentar || '';

                return (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                      {item.menu.gambar ? (
                        <img src={`/storage/${item.menu.gambar}`} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-xl">🍽️</div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{item.menu.nama_menu}</h4>
                        <p className="text-xs text-gray-500">{item.menu.kategori}</p>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex gap-2 mb-4 justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(menuId, star)}
                          className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${
                            star <= currentRating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600 grayscale opacity-50'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>

                    {/* Comment */}
                    <textarea
                      placeholder="Tambahkan komentar (opsional)..."
                      className="w-full text-sm rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:border-amber-500 focus:ring-amber-500 p-3"
                      rows={2}
                      value={currentKomentar}
                      onChange={(e) => setKomentar(menuId, e.target.value)}
                    />
                  </div>
                );
              })}

              <div className="pt-4 sticky bottom-0 bg-white dark:bg-gray-900">
                <Button type="submit" className="w-full py-4 text-base shadow-lg" disabled={isSubmittingReview}>
                  {isSubmittingReview ? 'Mengirim Ulasan...' : 'Kirim Ulasan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </CustomerLayout>
  );
}
