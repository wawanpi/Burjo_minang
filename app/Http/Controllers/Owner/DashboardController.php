<?php

namespace App\Http\Controllers\Owner; // Namespace sudah disesuaikan, tanpa API

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia; // Memanggil Inertia

class DashboardController extends Controller
{
    public function index(): \Inertia\Response
{
    // Stat cards
    $stats = [
        'total_pendapatan'  => Order::where('status_pembayaran', 'lunas')->sum('total_harga'),
        'jumlah_pesanan'    => Order::count(),
        'pesanan_hari_ini'  => Order::whereDate('tanggal_pesan', today())->count(),
        'pendapatan_bulan'  => Order::where('status_pembayaran', 'lunas')
            ->whereMonth('tanggal_pesan', now()->month)
            ->whereYear('tanggal_pesan',  now()->year)
            ->sum('total_harga'),
    ];

    // Chart data: 30 hari terakhir
    $chart_data = Order::where('status_pembayaran', 'lunas')
        ->where('tanggal_pesan', '>=', now()->subDays(29))
        ->selectRaw('DATE(tanggal_pesan) as date, SUM(total_harga) as pendapatan')
        ->groupBy('date')
        ->orderBy('date')
        ->get()
        ->map(fn($row) => [
            'tanggal'    => \Carbon\Carbon::parse($row->date)->isoFormat('D MMM'),
            'pendapatan' => (float) $row->pendapatan,
        ]);

    return Inertia::render('Owner/Dashboard/DashboardPage', compact('stats', 'chart_data'));
}
    
}