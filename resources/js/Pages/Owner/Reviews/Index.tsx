// resources/js/Pages/Owner/Reviews/ReviewsPage.tsx
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import type { Review } from '../../../types/review.types';

declare function route(name: string, params?: any, absolute?: boolean): string;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  reviews: Review[];
  filters: { rating?: number };
}

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// ─── Sub-components ──────────────────────────────────────────────────────────
// Bintang statis — nilai 1–5, optional pop animation saat mount
const StarRating = ({ rating, size = 'w-4 h-4', animate = false }: { rating: number; size?: string; animate?: boolean }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={animate ? 'animate-star-pop' : ''}
        style={animate ? { animationDelay: `${star * 90}ms` } : undefined}
      >
        <StarIcon className={`${size} ${star <= rating ? 'text-bm-gold-400' : 'text-gray-300 dark:text-gray-700'}`} />
      </span>
    ))}
  </div>
);

// Distribusi rating — bar mini, animasi fill dari 0 saat mount
const RatingDistribution = ({ reviews, dark = false }: { reviews: Review[]; dark?: boolean }) => {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className={`w-3 text-right ${dark ? 'text-white/60' : 'text-gray-500'}`}>{star}</span>
          <StarIcon className="w-3.5 h-3.5 text-bm-gold-400" />
          <div className={`flex-1 rounded-full h-2 overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-100'}`}>
            <div
              className="h-2 bg-bm-gold-400 rounded-full transition-all duration-[1000ms] ease-out"
              style={{ width: mounted ? `${(count / max) * 100}%` : '0%' }}
            />
          </div>
          <span className={`w-4 text-xs ${dark ? 'text-white/60' : 'text-gray-500'}`}>{count}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Index({ reviews, filters }: Props) {
  const [selectedRating, setSelectedRating] = useState<number | ''>(filters.rating ?? '');

  const totalReviews = reviews.length;
  const rataRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0;

  const applyFilter = (rating: number | '') => {
    setSelectedRating(rating);
    router.get(
      route('owner.reviews'),
      rating !== '' ? { rating } : {},
      { preserveState: true, only: ['reviews', 'filters'] }
    );
  };



  return (
    <OwnerLayout title="Ulasan Pelanggan">
      <div className="space-y-6 animate-page-enter">
        {/* Header */}
        <div>
          <span className="bm-eyebrow block mb-1.5">Suara Pelanggan</span>
          <div className="flex items-center gap-2.5">
            <span className="text-bm-gold-500 text-lg leading-none select-none">✦</span>
            <h1 className="text-2xl lg:text-[28px] font-serif font-bold text-bm-charcoal-900 leading-tight">Ulasan Pelanggan</h1>
          </div>
          <div className="bm-gold-underline mt-3" />
          <p className="text-sm text-bm-text-muted mt-2">
            Semua ulasan dan rating yang diberikan pelanggan
          </p>
        </div>

        {/* Summary + Distribusi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Rata-rata rating — kartu gelap */}
          <div className="bg-gradient-to-br from-bm-charcoal-800 to-bm-charcoal-900 rounded-[18px] border border-white/[0.06] p-6 flex items-center gap-5 shadow-soft">
            <div className="font-serif text-[64px] font-bold text-bm-gold-400 leading-none">
              {rataRating.toFixed(1)}
            </div>
            <div>
              <StarRating rating={Math.round(rataRating)} size="w-5 h-5" animate />
              <p className="text-sm text-white/60 mt-2">
                dari {totalReviews} ulasan
              </p>
            </div>
          </div>

          {/* Distribusi — kartu gelap */}
          <div className="bg-gradient-to-br from-bm-charcoal-800 to-bm-charcoal-900 rounded-[18px] border border-white/[0.06] p-6 shadow-soft">
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.08em] mb-3">
              Distribusi Rating
            </p>
            <RatingDistribution reviews={reviews} dark />
          </div>
        </div>

        {/* Filter by rating */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bm-eyebrow mr-1">Filter:</span>
          <button
            onClick={() => applyFilter('')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
              selectedRating === ''
                ? 'bg-bm-charcoal-900 text-white border-bm-charcoal-900'
                : 'bg-white text-bm-charcoal-800 border-gray-300 hover:bg-bm-cream'
            }`}
          >
            Semua
          </button>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const active = selectedRating === star;
            return (
              <button
                key={star}
                onClick={() => applyFilter(star)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  active
                    ? 'bg-bm-charcoal-900 text-white border-bm-charcoal-900'
                    : 'bg-white text-bm-charcoal-800 border-gray-300 hover:bg-bm-cream'
                }`}
              >
                <StarIcon className="w-3.5 h-3.5 text-bm-gold-400" />
                {star}
                <span className={`text-xs ${active ? 'text-white/60' : 'text-bm-text-muted'}`}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Review Cards */}
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl opacity-40 animate-float block mb-2">💬</span>
            <p className="font-serif italic text-lg text-bm-charcoal-800">Belum ada ulasan untuk filter ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="group bg-gradient-to-br from-bm-charcoal-800 to-bm-charcoal-900 rounded-2xl border border-white/[0.06] p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-bm-gold-400/40 hover:shadow-elevated"
              >
                {/* Header kartu */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar inisial */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-bm-red-500 to-bm-charcoal-700 flex items-center justify-center text-sm font-bold text-white ring-1 ring-bm-gold-400/30">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {review.user.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {new Date(review.tanggal_ulasan).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>

                {/* Nama menu */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-bm-gold-400 bg-bm-gold-500/10 ring-1 ring-bm-gold-500/20 rounded-full px-2.5 py-0.5 mb-2.5">
                  🍽️ {review.menu.nama_menu}
                </span>

                {/* Komentar */}
                {review.komentar ? (
                  <p className="text-sm text-white/90 italic leading-relaxed mt-1">
                    "{review.komentar}"
                  </p>
                ) : (
                  <p className="text-sm text-white/40 italic mt-1">
                    Tidak ada komentar.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}


      </div>
    </OwnerLayout>
  );
}