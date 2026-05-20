<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    // GET /api/owner/reviews?menu_id=1&rating=5
    public function index(Request $request)
    {
        $request->validate([
            'menu_id' => ['nullable', 'integer', 'exists:menus,id'],
            'rating'  => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $reviews = Review::with(['user', 'menu'])
            ->when($request->menu_id, fn($q) =>
                $q->where('menu_id', $request->menu_id)
            )
            ->when($request->rating, fn($q) =>
                $q->where('rating', $request->rating)
            )
            ->latest('tanggal_ulasan')
            ->get();

        return Inertia::render('Owner/Reviews/Index', [
            'reviews' => $reviews,
            'filters' => $request->only(['rating']),
        ]);
    }
}