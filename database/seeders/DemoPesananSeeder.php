<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * DemoPesananSeeder — data demo LENGKAP untuk pengujian/sidang (LOKAL SAJA).
 *
 * ⚠️  JANGAN dipanggil dari DatabaseSeeder — agar TIDAK ikut ter-deploy ke
 *     produksi lewat `db:seed --force` di docker/entrypoint.sh.
 *     Jalankan manual di lokal:
 *         php artisan db:seed --class=DemoPesananSeeder
 *
 * Mengisi pesanan di SEMUA kondisi:
 *   - SELESAI + LUNAS  → tersebar 60 hari terakhir (mengisi Laporan Keuangan & Dashboard)
 *   - BATAL + GAGAL    → contoh pesanan dibatalkan
 *   - PO MENDATANG     → take_away, waktu_pengambilan di masa depan, diproses + lunas
 *   - DIPROSES HARI INI→ antrean dapur aktif
 *   - MENUNGGU BAYAR   → pesanan aktif baru (akan auto-cancel setelah 5 menit — perilaku normal)
 *   - ULASAN           → untuk sebagian pesanan selesai (rating 1–5)
 *
 * Idempotent: ditandai transaction_id 'DEMO-...' & email '@demo.local'.
 * Cara membersihkan (lokal):
 *   DELETE order_items/payments/orders yang transaction_id LIKE 'DEMO-%'
 *   lalu users email LIKE '%@demo.local'.
 */
class DemoPesananSeeder extends Seeder
{
    private const MARK = 'DEMO-';

    public function run(): void
    {
        // ── Guard idempotensi ────────────────────────────────────────────
        if (Payment::where('transaction_id', 'like', self::MARK.'%')->exists()) {
            $this->command?->warn('Data demo pesanan sudah ada — dilewati. Bersihkan dulu untuk regenerate.');
            return;
        }

        $menus = Menu::all();
        if ($menus->isEmpty()) {
            $this->command?->error('Tidak ada menu. Jalankan `php artisan db:seed --class=MenuSeeder` dulu.');
            return;
        }

        $users  = $this->pelangganDemo();
        $metode = ['Tunai', 'QRIS', 'Transfer Bank', 'E-Wallet'];
        $tipe   = ['dine_in', 'take_away'];

        $selesai = $batal = $po = $diprosesHariIni = $menunggu = 0;

        // ── 1) SELESAI + LUNAS (Laporan & Dashboard) — 20 pesanan, 1–60 hari lalu ──
        $selesaiOrders = [];
        for ($i = 0; $i < 20; $i++) {
            $tgl = Carbon::now()->subDays(random_int(1, 60))->setTime(random_int(8, 20), random_int(0, 59));
            $selesaiOrders[] = $this->buatPesanan(
                $users->random(), $menus,
                tipe: $tipe[array_rand($tipe)],
                status: 'selesai',
                paymentStatus: 'lunas',
                metode: $metode[array_rand($metode)],
                tanggal: $tgl,
                diprosesAt: (clone $tgl)->subMinutes(random_int(10, 40)),
            );
            $selesai++;
        }

        // ── 2) BATAL + GAGAL — 6 pesanan, 1–30 hari lalu ──
        for ($i = 0; $i < 6; $i++) {
            $tgl = Carbon::now()->subDays(random_int(1, 30))->setTime(random_int(8, 20), random_int(0, 59));
            $this->buatPesanan(
                $users->random(), $menus,
                tipe: $tipe[array_rand($tipe)],
                status: 'batal',
                paymentStatus: 'gagal',
                metode: $metode[array_rand($metode)],
                tanggal: $tgl,
            );
            $batal++;
        }

        // ── 3) PO MENDATANG — take_away, ambil 1–6 hari ke depan, diproses + lunas ──
        for ($i = 0; $i < 5; $i++) {
            $ambil = Carbon::now()->addDays(random_int(1, 6))->setTime(random_int(9, 20), [0, 15, 30, 45][array_rand([0, 1, 2, 3])]);
            $tgl   = Carbon::now()->subHours(random_int(1, 12));
            $this->buatPesanan(
                $users->random(), $menus,
                tipe: 'take_away',
                status: 'diproses',
                paymentStatus: 'lunas',
                metode: $metode[array_rand($metode)],
                tanggal: $tgl,
                waktuAmbil: $ambil,
                diprosesAt: (clone $tgl)->addMinutes(random_int(1, 10)),
            );
            $po++;
        }

        // ── 4) DIPROSES HARI INI (antrean dapur aktif) — 4 pesanan ──
        for ($i = 0; $i < 4; $i++) {
            $tgl  = Carbon::now()->subMinutes(random_int(5, 120));
            $t    = $tipe[array_rand($tipe)];
            $this->buatPesanan(
                $users->random(), $menus,
                tipe: $t,
                status: 'diproses',
                paymentStatus: 'lunas',
                metode: $metode[array_rand($metode)],
                tanggal: $tgl,
                // take_away hari ini → jam ambil beberapa jam ke depan hari ini
                waktuAmbil: $t === 'take_away' ? Carbon::now()->addMinutes(random_int(20, 120)) : null,
                diprosesAt: (clone $tgl)->addMinutes(2),
            );
            $diprosesHariIni++;
        }

        // ── 5) MENUNGGU PEMBAYARAN (aktif, baru dibuat) — 3 pesanan ──
        // Catatan: akan otomatis dibatalkan sistem setelah 5 menit (perilaku normal).
        for ($i = 0; $i < 3; $i++) {
            $this->buatPesanan(
                $users->random(), $menus,
                tipe: $tipe[array_rand($tipe)],
                status: 'menunggu_pembayaran',
                paymentStatus: 'pending',
                metode: ['QRIS', 'Transfer Bank'][array_rand([0, 1])],
                tanggal: Carbon::now()->subMinutes(random_int(0, 2)),
            );
            $menunggu++;
        }

        // ── 6) ULASAN — untuk ~12 pesanan selesai (rating condong positif) ──
        $ulasan = $this->buatUlasan($selesaiOrders);

        $this->command?->info(
            "Selesai membuat data demo: {$selesai} selesai, {$batal} batal, {$po} PO mendatang, "
            ."{$diprosesHariIni} diproses hari ini, {$menunggu} menunggu bayar, {$ulasan} ulasan."
        );
    }

    /**
     * Buat satu pesanan lengkap (order + order_items + payment) dengan harga
     * dihitung dari harga menu asli. Semua payment ditandai transaction_id 'DEMO-'.
     */
    private function buatPesanan(
        User $user,
        $menus,
        string $tipe,
        string $status,
        string $paymentStatus,
        string $metode,
        Carbon $tanggal,
        ?Carbon $waktuAmbil = null,
        ?Carbon $diprosesAt = null,
    ): Order {
        $items = $menus->random(random_int(1, min(3, $menus->count())));
        if (! $items instanceof \Illuminate\Support\Collection) {
            $items = collect([$items]);
        }

        $total = 0;
        $rows  = [];
        foreach ($items as $menu) {
            $jumlah   = random_int(1, 3);
            $subtotal = (float) $menu->harga * $jumlah;
            $total   += $subtotal;
            $rows[]   = ['menu_id' => $menu->id, 'jumlah' => $jumlah, 'subtotal' => $subtotal];
        }

        $order = Order::create([
            'user_id'           => $user->id,
            'total_harga'       => $total,
            'status_pesanan'    => $status,
            'tipe_pesanan'      => $tipe,
            'waktu_pengambilan' => $waktuAmbil,
            'diproses_at'       => $diprosesAt,
            'jumlah_orang'      => $tipe === 'dine_in' ? random_int(1, 4) : null,
            'tanggal_pesan'     => $tanggal,
        ]);
        // Backdate created_at agar konsisten dengan tanggal_pesan (dipakai chart & filter tanggal)
        $order->forceFill(['created_at' => $tanggal, 'updated_at' => $tanggal])->save();

        foreach ($rows as $row) {
            OrderItem::create(array_merge(['order_id' => $order->id], $row));
        }

        Payment::create([
            'order_id'          => $order->id,
            'metode_pembayaran' => $metode,
            'status_pembayaran' => $paymentStatus,
            'transaction_id'    => self::MARK.$order->id.'-'.$tanggal->timestamp,
            'payment_token'     => null,
            'payment_url'       => null,
        ]);

        return $order;
    }

    /**
     * Buat ulasan untuk sebagian pesanan selesai. Mematuhi aturan F-1:
     * hanya mengulas menu yang ADA di pesanan itu, satu ulasan per (user, menu).
     */
    private function buatUlasan(array $selesaiOrders): int
    {
        $komentar = [
            5 => ['Enak banget, porsinya pas!', 'Bumbunya meresap, pasti pesan lagi.', 'Favorit keluarga, recommended!'],
            4 => ['Rasanya mantap, harga bersahabat.', 'Cepat dan masih hangat.', 'Oke banget buat makan siang.'],
            3 => ['Lumayan, standar sesuai harga.', 'Cukup mengenyangkan.'],
            2 => ['Kurang asin menurut saya.', 'Porsinya agak sedikit.'],
            1 => ['Sayang datangnya lama.', 'Kurang sesuai ekspektasi.'],
        ];
        $distribusi = [5, 5, 5, 4, 4, 4, 3, 3, 2, 1];

        $total = 0;
        foreach (array_slice($selesaiOrders, 0, 12) as $order) {
            $order->loadMissing('orderItems');
            foreach ($order->orderItems as $item) {
                $sudah = Review::where('user_id', $order->user_id)
                    ->where('menu_id', $item->menu_id)
                    ->exists();
                if ($sudah) {
                    continue;
                }

                $rating = $distribusi[array_rand($distribusi)];
                Review::create([
                    'user_id'        => $order->user_id,
                    'menu_id'        => $item->menu_id,
                    'rating'         => $rating,
                    'komentar'       => $komentar[$rating][array_rand($komentar[$rating])],
                    'tanggal_ulasan' => Carbon::parse($order->tanggal_pesan)->addHours(random_int(1, 48)),
                ]);
                $total++;
            }
        }

        return $total;
    }

    /**
     * Ambil / buat 6 pelanggan demo (@demo.local, sudah terverifikasi).
     *
     * @return \Illuminate\Support\Collection<int, User>
     */
    private function pelangganDemo()
    {
        $data = [
            ['name' => 'Demo Andi',   'email' => 'andi@demo.local',   'no_hp' => '081200000001'],
            ['name' => 'Demo Bunga',  'email' => 'bunga@demo.local',  'no_hp' => '081200000002'],
            ['name' => 'Demo Candra', 'email' => 'candra@demo.local', 'no_hp' => '081200000003'],
            ['name' => 'Demo Dinda',  'email' => 'dinda@demo.local',  'no_hp' => '081200000004'],
            ['name' => 'Demo Eka',    'email' => 'eka@demo.local',    'no_hp' => '081200000005'],
            ['name' => 'Demo Fajar',  'email' => 'fajar@demo.local',  'no_hp' => '081200000006'],
        ];

        return collect($data)->map(fn ($p) => User::firstOrCreate(
            ['email' => $p['email']],
            [
                'name'              => $p['name'],
                'no_hp'             => $p['no_hp'],
                'password'          => Hash::make('password123'),
                'role'              => 'pelanggan',
                'email_verified_at' => now(),
            ]
        ));
    }
}
