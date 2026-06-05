<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanController extends Controller
{
    /**
     * Halaman Laporan Owner dengan sistem Dual-Tab.
     *
     * Tab "keuangan" → hanya order lunas & selesai (audit keuangan murni).
     * Tab "riwayat"  → semua order tanpa filter status (audit operasional).
     *
     * GET /owner/laporan?tab=keuangan&dari=2024-01-01&sampai=2024-01-31&tipe=dine_in
     */
    public function index(Request $request)
    {
        $request->validate([
            'tab'    => ['nullable', 'in:keuangan,riwayat'],
            'dari'   => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'tipe'   => ['nullable', 'in:dine_in,take_away,online'],
        ]);

        $tab = $request->input('tab', 'keuangan');

        // ── Base Query: filter tanggal & tipe pesanan ──
        $baseQuery = Order::with([
                'user:id,name,email,no_hp',
                'payment:id,order_id,metode_pembayaran,status_pembayaran',
                'orderItems.menu:id,nama_menu,harga',
            ])
            ->when($request->dari, fn($q) =>
                $q->whereDate('tanggal_pesan', '>=', $request->dari)
            )
            ->when($request->sampai, fn($q) =>
                $q->whereDate('tanggal_pesan', '<=', $request->sampai)
            )
            ->when($request->tipe, fn($q) =>
                $q->where('tipe_pesanan', $request->tipe)
            );

        // ── Percabangan berdasarkan Tab ──
        if ($tab === 'keuangan') {
            // Tab Keuangan: HANYA lunas + selesai
            $baseQuery
                ->whereHas('payment', function ($sub) {
                    $sub->where('status_pembayaran', 'lunas');
                })
                ->where('status_pesanan', 'selesai');
        }
        // Tab Riwayat: tidak ada filter status tambahan — tampilkan semua

        $paginated = $baseQuery
            ->latest('tanggal_pesan')
            ->paginate(20)
            ->withQueryString();

        // ── Transform data untuk frontend ──
        $transformedData = collect($paginated->items())->map(function ($order) {
            return [
                'id'                 => $order->id,
                'user'               => $order->user ? [
                    'id'    => $order->user->id,
                    'name'  => $order->user->name,
                    'email' => $order->user->email,
                ] : null,
                'tanggal_pesan'      => $order->tanggal_pesan?->toISOString(),
                'total_harga'        => (float) $order->total_harga,
                'tipe_pesanan'       => $order->tipe_pesanan ?? 'dine_in',
                'status_pesanan'     => $order->status_pesanan,
                'metode_pembayaran'  => $order->payment?->metode_pembayaran ?? '-',
                'status_pembayaran'  => $order->payment?->status_pembayaran ?? 'pending',
            ];
        });

        $orders = [
            'data' => $transformedData,
            'meta' => [
                'total'        => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
            ],
        ];

        // ── Ringkasan Pendapatan ──
        if ($tab === 'keuangan') {
            // Hitung pendapatan hanya dari lunas + selesai, dengan filter tanggal & tipe
            $totalPendapatan = (float) Order::whereHas('payment', function ($q) {
                    $q->where('status_pembayaran', 'lunas');
                })
                ->where('status_pesanan', 'selesai')
                ->when($request->dari, fn($q) =>
                    $q->whereDate('tanggal_pesan', '>=', $request->dari)
                )
                ->when($request->sampai, fn($q) =>
                    $q->whereDate('tanggal_pesan', '<=', $request->sampai)
                )
                ->when($request->tipe, fn($q) =>
                    $q->where('tipe_pesanan', $request->tipe)
                )
                ->sum('total_harga');
        } else {
            // Tab riwayat tidak menghitung uang
            $totalPendapatan = 0;
        }

        return Inertia::render('Owner/Laporan/Index', [
            'orders'    => $orders,
            'ringkasan' => [
                'total_pendapatan' => $totalPendapatan,
            ],
            'filters' => [
                'dari'   => $request->dari,
                'sampai' => $request->sampai,
                'tipe'   => $request->tipe ?? '',
            ],
            'tab' => $tab,
        ]);
    }

    /**
     * Halaman Print Laporan (Blade view sederhana tanpa layout SPA).
     * Print selalu menggunakan data tab keuangan (lunas + selesai).
     *
     * GET /owner/laporan/print?dari=...&sampai=...&tipe=dine_in
     */
    public function print(Request $request)
    {
        $request->validate([
            'dari'   => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'tipe'   => ['nullable', 'in:dine_in,take_away,online'],
        ]);

        // Ambil SEMUA order LUNAS + SELESAI tanpa pagination untuk keperluan cetak
        $orders = Order::with([
                'user:id,name,email',
                'payment:id,order_id,metode_pembayaran,status_pembayaran',
            ])
            ->whereHas('payment', function ($sub) {
                $sub->where('status_pembayaran', 'lunas');
            })
            ->where('status_pesanan', 'selesai')
            ->when($request->dari, fn($q) =>
                $q->whereDate('tanggal_pesan', '>=', $request->dari)
            )
            ->when($request->sampai, fn($q) =>
                $q->whereDate('tanggal_pesan', '<=', $request->sampai)
            )
            ->when($request->tipe, fn($q) =>
                $q->where('tipe_pesanan', $request->tipe)
            )
            ->latest('tanggal_pesan')
            ->get();

        // Total Pendapatan (lunas + selesai + filtered)
        $totalPendapatan = (float) Order::whereHas('payment', function ($q) {
                $q->where('status_pembayaran', 'lunas');
            })
            ->where('status_pesanan', 'selesai')
            ->when($request->dari, fn($q) =>
                $q->whereDate('tanggal_pesan', '>=', $request->dari)
            )
            ->when($request->sampai, fn($q) =>
                $q->whereDate('tanggal_pesan', '<=', $request->sampai)
            )
            ->when($request->tipe, fn($q) =>
                $q->where('tipe_pesanan', $request->tipe)
            )
            ->sum('total_harga');

        // Label tipe pesanan untuk ditampilkan di header
        $tipeLabel = match ($request->tipe) {
            'dine_in'   => 'Dine In',
            'take_away' => 'Take Away',
            'online'    => 'Online',
            default     => 'Semua Tipe',
        };

        return Inertia::render('Owner/Laporan/Print', [
            'orders'          => $orders,
            'totalPendapatan' => $totalPendapatan,
            'tipeFilter'      => $request->tipe,
            'tipeLabel'       => $tipeLabel,
            'dari'            => $request->dari,
            'sampai'          => $request->sampai,
        ]);
    }
}