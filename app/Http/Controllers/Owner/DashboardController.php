<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Inertia\Inertia;

/**
 * DashboardController — Menampilkan ringkasan statistik bisnis.
 *
 * Data yang disajikan:
 * - Total pendapatan (seluruh waktu & bulan ini)
 * - Jumlah pesanan (total, hari ini, pending)
 * - Grafik pendapatan 30 hari terakhir
 * - 5 pesanan terbaru
 */
class DashboardController extends Controller
{
    /**
     * Menampilkan halaman dashboard dengan statistik dan grafik.
     *
     * @return \Inertia\Response
     */
    public function index(): \Inertia\Response
    {
        $user = auth()->user();

        // ─── LOGIKA KHUSUS KASIR ───
        if ($user->role === 'kasir') {
            $pesananDiproses = Order::where('status_pesanan', 'diproses')->count();
            $pesananHarusDiselesaikan = Order::where('status_pesanan', 'menunggu_pembayaran')->count();
            $pesananSelesaiHariIni = Order::where('status_pesanan', 'selesai')
                ->whereDate('tanggal_pesan', today())->count();
            $pesananHariIni = Order::whereDate('tanggal_pesan', today())->count();

            $stats = [
                'pesanan_diproses'       => $pesananDiproses,
                'harus_diselesaikan'     => $pesananHarusDiselesaikan,
                'pesanan_selesai'        => $pesananSelesaiHariIni,
                'pesanan_hari_ini'       => $pesananHariIni,
            ];

            // Antrean terbaru hari ini: prioritaskan yang butuh tindakan (diproses/pending dulu)
            $antrean_terbaru = Order::with(['user:id,name'])
                ->whereDate('tanggal_pesan', today())
                ->orderByRaw("FIELD(status_pesanan, 'menunggu_pembayaran', 'diproses', 'selesai', 'dibatalkan')")
                ->latest('tanggal_pesan')
                ->take(7)
                ->get()
                ->map(fn($o) => [
                    'id'                => $o->id,
                    'waktu'             => Carbon::parse($o->tanggal_pesan)->timezone('Asia/Jakarta')->isoFormat('HH:mm'),
                    'pelanggan'         => $o->user->name ?? 'Walk-in',
                    'status'            => $o->status_pesanan,
                    'total'             => (int) $o->total_harga,
                    'waktu_pengambilan' => $o->waktu_pengambilan ? Carbon::parse($o->waktu_pengambilan)->timezone('Asia/Jakarta')->format('H:i') : null,
                    'sisa_menit'        => $o->waktu_pengambilan
                        ? (int) round(now('Asia/Jakarta')->diffInMinutes(Carbon::parse($o->waktu_pengambilan, 'Asia/Jakarta'), false))
                        : null,
                ]);

            return Inertia::render('Kasir/Dashboard/DashboardPage', compact('stats', 'antrean_terbaru'));
        }

        // ─── LOGIKA KHUSUS OWNER ───
        // 1. Total Pendapatan: Sum total_harga dari orders yang payment-nya lunas
        $totalPendapatan = Order::whereHas('payment', function ($query) {
            $query->where('status_pembayaran', 'lunas');
        })->sum('total_harga');

        // 2. Pesanan Pending: Count orders yang statusnya menunggu_pembayaran atau diproses
        $pesananPending = Order::whereIn('status_pesanan', ['menunggu_pembayaran', 'diproses'])->count();

        // 3. Total Pesanan: Hitung semua pesanan
        $totalPesanan = Order::count();

        // Menjaga kompatibilitas dengan stats lama (pesanan_hari_ini & pendapatan_bulan)
        $pesananHariIni = Order::whereDate('tanggal_pesan', today())->count();
        $pendapatanBulan = Order::whereHas('payment', function ($query) {
            $query->where('status_pembayaran', 'lunas');
        })
        ->whereMonth('tanggal_pesan', now()->month)
        ->whereYear('tanggal_pesan', now()->year)
        ->sum('total_harga');

        $stats = [
            'total_pendapatan' => $totalPendapatan,
            'pesanan_pending'  => $pesananPending,
            'jumlah_pesanan'   => $totalPesanan,
            'pesanan_hari_ini' => $pesananHariIni,
            'pendapatan_bulan' => $pendapatanBulan,
        ];

        // Chart data: 30 hari terakhir berdasarkan transaksi lunas
        $chart_data = Order::whereHas('payment', function ($query) {
                $query->where('status_pembayaran', 'lunas');
            })
            ->where('tanggal_pesan', '>=', now()->subDays(29))
            ->selectRaw('DATE(tanggal_pesan) as date, SUM(total_harga) as pendapatan')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => [
                'tanggal'    => Carbon::parse($row->date)->isoFormat('D MMM'),
                'pendapatan' => (float) $row->pendapatan,
            ]);

        // 4. Recent Orders (Pesanan Terbaru): 5 pesanan terbaru dengan eager load user & payment
        $recent_orders = Order::with([
                'user:id,name,email', 
                'payment:id,order_id,metode_pembayaran,status_pembayaran'
            ])
            ->latest('tanggal_pesan')
            ->take(5)
            ->get();

        return Inertia::render('Owner/Dashboard/DashboardPage', compact('stats', 'chart_data', 'recent_orders'));
    }
}