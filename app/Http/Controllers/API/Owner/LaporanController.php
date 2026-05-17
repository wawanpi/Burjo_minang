<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LaporanController extends Controller
{
    // GET /api/owner/laporan?dari=2024-01-01&sampai=2024-01-31
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'dari'    => ['nullable', 'date'],
            'sampai'  => ['nullable', 'date', 'after_or_equal:dari'],
            'status'  => ['nullable', 'in:pending,lunas,batal,kadaluarsa'],
        ]);

        $orders = Order::with('user')
            ->when($request->dari, fn($q) =>
                $q->whereDate('tanggal_pesan', '>=', $request->dari)
            )
            ->when($request->sampai, fn($q) =>
                $q->whereDate('tanggal_pesan', '<=', $request->sampai)
            )
            ->when($request->status, fn($q) =>
                $q->where('status_pembayaran', $request->status)
            )
            ->latest('tanggal_pesan')
            ->paginate(20);

        return response()->json([
            'data'  => OrderResource::collection($orders),
            'meta'  => [
                'total'        => $orders->total(),
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
            ],
            'ringkasan' => [
                'total_pendapatan' => $orders->getCollection()
                    ->where('status_pembayaran', 'lunas')
                    ->sum('total_harga'),
            ],
        ]);
    }
}