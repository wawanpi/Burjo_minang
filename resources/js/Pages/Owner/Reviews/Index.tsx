// resources/js/Pages/Owner/Reviews/ReviewsPage.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import type { Review } from '../../../types/review.types';
import Button from '../../../Components/ui/Button';

declare function route(name: string, params?: any, absolute?: boolean): string;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  reviews: Review[];
  filters: { rating?: number };
}

// ─── Sub-components ──────────────────────────────────────────────────────────
// Bintang statis — nilai 1–5
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-4 h-4 ${star <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-700'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// Distribusi rating — bar chart mini
const RatingDistribution = ({ reviews }: { reviews: Review[] }) => {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className="w-3 text-right text-gray-500 dark:text-gray-400">{star}</span>
          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-4 text-gray-500 dark:text-gray-400 text-xs">{count}</span>
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Ulasan Pelanggan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Semua ulasan dan rating yang diberikan pelanggan
          </p>
        </div>

        {/* Summary + Distribusi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Rata-rata rating */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex items-center gap-5">
            <div className="text-5xl font-bold text-amber-500 leading-none">
              {rataRating.toFixed(1)}
            </div>
            <div>
              <StarRating rating={Math.round(rataRating)} />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                dari {totalReviews} ulasan
              </p>
            </div>
          </div>

          {/* Distribusi */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Distribusi Rating
            </p>
            <RatingDistribution reviews={reviews} />
          </div>
        </div>

        {/* Filter by rating */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">Filter:</span>
          <Button
            variant={selectedRating === '' ? 'primary' : 'outline'}
            onClick={() => applyFilter('')}
          >
            Semua
          </Button>
          {[5, 4, 3, 2, 1].map((star) => (
            <Button
              key={star}
              variant={selectedRating === star ? 'primary' : 'outline'}
              onClick={() => applyFilter(star)}
            >
              {'⭐'.repeat(star)} {star}
            </Button>
          ))}
        </div>

        {/* Review Cards */}
        {reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Belum ada ulasan untuk filter ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
              >
                {/* Header kartu */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar inisial */}
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {review.user.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(review.tanggal_ulasan).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>

                {/* Nama menu */}
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                  🍽️ {review.menu.nama_menu}
                </p>

                {/* Komentar */}
                {review.komentar ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    "{review.komentar}"
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-600 italic">
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