<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
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
            // CASE WHEN dipakai (bukan FIELD()) agar portabel di semua database (MySQL/MariaDB/SQLite)
            $antrean_terbaru = Order::with(['user' => fn ($q) => $q->withTrashed()])
                ->whereDate('tanggal_pesan', today())
                ->orderByRaw("CASE status_pesanan WHEN 'menunggu_pembayaran' THEN 1 WHEN 'diproses' THEN 2 WHEN 'selesai' THEN 3 WHEN 'batal' THEN 4 ELSE 5 END")
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
                'user' => fn ($q) => $q->withTrashed(), // Bug #3: nama pelanggan nonaktif tetap tampil
                'payment:id,order_id,metode_pembayaran,status_pembayaran'
            ])
            ->latest('tanggal_pesan')
            ->take(5)
            ->get()
            ->map(fn($o) => [
                'id'                => $o->id,
                'pelanggan'         => $o->user->name ?? 'Walk-in',
                'tanggal'           => Carbon::parse($o->tanggal_pesan)->timezone('Asia/Jakarta')->isoFormat('D MMM, HH:mm'),
                'total'             => (int) $o->total_harga,
                'tipe_pesanan'      => $o->tipe_pesanan,
                'status_pesanan'    => $o->status_pesanan,
                'metode_pembayaran' => $o->payment->metode_pembayaran ?? '-',
            ]);

        // 5. Menu Terlaris: top 5 menu berdasarkan qty terjual dari transaksi lunas
        $maxTerjual = null;
        $menu_terlaris = OrderItem::whereHas('order.payment', function ($query) {
                $query->where('status_pembayaran', 'lunas');
            })
            ->selectRaw('menu_id, SUM(jumlah) as total_terjual, SUM(subtotal) as total_pendapatan')
            ->groupBy('menu_id')
            ->orderByDesc('total_terjual')
            // withTrashed: menu yang sudah dinonaktifkan (soft delete) tetap muncul
            // di riwayat penjualan agar data historis tidak hilang (Bug #2)
            ->with(['menu' => fn ($q) => $q->withTrashed()])
            ->take(5)
            ->get()
            ->filter(fn($row) => $row->menu !== null)
            ->values()
            ->map(function ($row) use (&$maxTerjual) {
                $maxTerjual ??= (int) $row->total_terjual; // baris pertama = terlaris
                return [
                    'id'               => $row->menu_id,
                    'nama_menu'        => $row->menu->nama_menu,
                    'kategori'         => $row->menu->kategori,
                    'gambar'           => $row->menu->gambar,
                    'total_terjual'    => (int) $row->total_terjual,
                    'total_pendapatan' => (float) $row->total_pendapatan,
                    // persentase relatif terhadap menu paling laris (untuk bar visual)
                    'persen'           => $maxTerjual > 0 ? round(((int) $row->total_terjual / $maxTerjual) * 100) : 0,
                ];
            });

        return Inertia::render('Owner/Dashboard/DashboardPage', compact('stats', 'chart_data', 'recent_orders', 'menu_terlaris'));
    }
}