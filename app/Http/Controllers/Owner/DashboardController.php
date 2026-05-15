<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalPendapatan = Order::where('status_pembayaran', 'lunas')
            ->sum('total_harga');

        $jumlahPesanan = Order::count();

        $pesananHariIni = Order::whereDate('tanggal_pesan', today())
            ->count();

        return Inertia::render('Owner/Dashboard', [
            'stats' => [
                'total_pendapatan' => (float) $totalPendapatan,
                'jumlah_pesanan'   => $jumlahPesanan,
                'pesanan_hari_ini' => $pesananHariIni,
            ],
        ]);
    }
}