<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanController extends Controller
{
    // GET /api/owner/laporan?dari=2024-01-01&sampai=2024-01-31
    public function index(Request $request)
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

        return Inertia::render('Owner/Laporan/Index', [
            'orders'  => OrderResource::collection($orders),
            'ringkasan' => [
                'total_pendapatan' => (float) Order::where('status_pembayaran', 'lunas')
                    ->when($request->dari, fn($q) => $q->whereDate('tanggal_pesan', '>=', $request->dari))
                    ->when($request->sampai, fn($q) => $q->whereDate('tanggal_pesan', '<=', $request->sampai))
                    ->when($request->status, fn($q) => $q->where('status_pembayaran', $request->status))
                    ->sum('total_harga'),
            ],
            'filters' => $request->only(['dari', 'sampai', 'status']),
        ]);
    }
}