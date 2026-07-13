<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * LaporanKeuanganTambahanSeeder — data dummy (non-produksi) tambahan untuk
 * Laporan Keuangan agar terisi dari Januari tahun berjalan sampai sekarang.
 *
 * ⚠️  HANYA UNTUK LOKAL / DEMO — JANGAN dipanggil dari DatabaseSeeder.
 *     Seeder ini membuat order/payment PALSU (penanda transaction_id
 *     'DUMMYJAN-'). Karena docker/entrypoint.sh menjalankan `db:seed --force`
 *     otomatis tiap deploy, memanggilnya di jalur production akan mengotori
 *     data keuangan. Jalankan manual di lokal saja:
 *        php artisan db:seed --class=LaporanKeuanganTambahanSeeder
 *
 * Menghasilkan order SELESAI + LUNAS pada SETIAP bulan (Jan..bulan ini),
 * sehingga laporan/grafik bulanan punya data di seluruh rentang.
 *
 * Idempotent: ditandai lewat prefix transaction_id 'DUMMYJAN-'. Jika sudah
 * ada, seeder dilewati.
 */
class LaporanKeuanganTambahanSeeder extends Seeder
{
    /** Rentang jumlah order per bulan. */
    private const MIN_PER_BULAN = 10;
    private const MAX_PER_BULAN = 18;

    private const PENANDA = 'DUMMYJAN-';

    public function run(): void
    {
        // ── Guard idempotensi ─────────────────────────────────────────
        if (Payment::where('transaction_id', 'like', self::PENANDA.'%')->exists()) {
            $this->command?->warn('Data dummy laporan Januari–sekarang sudah ada — dilewati.');
            return;
        }

        $menus = Menu::all();
        if ($menus->isEmpty()) {
            $this->command?->error('Tidak ada menu. Jalankan MenuSeeder dulu.');
            return;
        }

        $users = $this->pelanggan();
        $metodeBayar = ['Tunai', 'QRIS', 'Transfer Bank', 'E-Wallet'];
        $tipePesanan = ['dine_in', 'take_away', 'online'];

        $now   = Carbon::now();
        $total = 0;

        // ── Iterasi tiap bulan: Januari s/d bulan berjalan ────────────
        for ($bulan = 1; $bulan <= $now->month; $bulan++) {
            $awalBulan  = Carbon::create($now->year, $bulan, 1)->startOfDay();
            // Untuk bulan berjalan, batasi sampai sekarang (jangan tanggal masa depan).
            $akhirBulan = $bulan === $now->month
                ? $now->copy()
                : $awalBulan->copy()->endOfMonth();

            $jumlah = random_int(self::MIN_PER_BULAN, self::MAX_PER_BULAN);

            for ($k = 0; $k < $jumlah; $k++) {
                $tanggal = Carbon::createFromTimestamp(
                    random_int($awalBulan->timestamp, $akhirBulan->timestamp)
                )->setTime(random_int(8, 20), random_int(0, 59));

                // Jaga-jaga jangan melewati waktu sekarang.
                if ($tanggal->greaterThan($now)) {
                    $tanggal = $now->copy()->subMinutes(random_int(5, 180));
                }

                $this->buatOrder(
                    $users->random(),
                    $menus,
                    $tanggal,
                    $tipePesanan[array_rand($tipePesanan)],
                    $metodeBayar[array_rand($metodeBayar)]
                );
                $total++;
            }
        }

        $this->command?->info("Selesai: {$total} order selesai/lunas (Jan–sekarang) dibuat.");
    }

    /**
     * Ambil daftar pelanggan; buat set dummy bila belum ada.
     *
     * @return \Illuminate\Support\Collection<int, User>
     */
    private function pelanggan()
    {
        $users = User::where('role', 'pelanggan')->get();
        if ($users->isNotEmpty()) {
            return $users;
        }

        $dummy = [
            ['name' => 'Budi Santoso',   'email' => 'budi.santoso@contoh.com'],
            ['name' => 'Siti Aminah',    'email' => 'siti.aminah@contoh.com'],
            ['name' => 'Andi Pratama',   'email' => 'andi.pratama@contoh.com'],
            ['name' => 'Rina Wulandari', 'email' => 'rina.wulandari@contoh.com'],
        ];

        return collect($dummy)->map(fn ($p) => User::firstOrCreate(
            ['email' => $p['email']],
            [
                'name'              => $p['name'],
                'password'          => Hash::make('password123'),
                'role'              => 'pelanggan',
                'email_verified_at' => now(),
            ]
        ));
    }

    /** Buat satu order selesai/lunas beserta item & pembayarannya. */
    private function buatOrder(User $user, $menus, Carbon $tanggal, string $tipe, string $metode): void
    {
        $items = $menus->random(random_int(1, min(3, $menus->count())));
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
            'status_pesanan'    => 'selesai',
            'tipe_pesanan'      => $tipe,
            'jumlah_orang'      => $tipe === 'dine_in' ? random_int(1, 4) : null,
            'waktu_pengambilan' => $tipe === 'take_away' ? $tanggal->copy()->addHour() : null,
            'tanggal_pesan'     => $tanggal,
        ]);
        $order->forceFill(['created_at' => $tanggal, 'updated_at' => $tanggal])->save();

        foreach ($rows as $row) {
            OrderItem::create(array_merge(['order_id' => $order->id], $row, [
                'created_at' => $tanggal,
                'updated_at' => $tanggal,
            ]));
        }

        Payment::create([
            'order_id'          => $order->id,
            'metode_pembayaran' => $metode,
            'status_pembayaran' => 'lunas',
            'transaction_id'    => self::PENANDA.$order->id.'-'.$tanggal->timestamp,
            'created_at'        => $tanggal,
            'updated_at'        => $tanggal,
        ]);
    }
}
