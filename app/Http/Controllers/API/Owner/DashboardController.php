<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // GET /api/owner/dashboard
    public function index(): JsonResponse
    {
        $data = [
            'total_pendapatan' => Order::where('status_pembayaran', 'lunas')
                ->sum('total_harga'),

            'jumlah_pesanan' => Order::count(),

            'pesanan_hari_ini' => Order::whereDate('tanggal_pesan', today())->count(),

            'pendapatan_bulan' => Order::where('status_pembayaran', 'lunas')
                ->whereMonth('tanggal_pesan', now()->month)
                ->whereYear('tanggal_pesan', now()->year)
                ->sum('total_harga'),
        ];

        return response()->json(new DashboardResource($data));
    }
}