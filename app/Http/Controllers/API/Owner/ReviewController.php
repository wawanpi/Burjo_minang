<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // GET /api/owner/reviews?menu_id=1&rating=5
    public function index(Request $request): JsonResponse
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
            ->paginate(20);

        return response()->json([
            'data' => ReviewResource::collection($reviews),
            'meta' => [
                'total'        => $reviews->total(),
                'current_page' => $reviews->currentPage(),
                'last_page'    => $reviews->lastPage(),
                'rata_rating'  => round(Review::avg('rating'), 2),
            ],
        ]);
    }
}