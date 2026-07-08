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
 * LaporanUlasanDummySeeder — data dummy (non-produksi) untuk mengisi
 * halaman Laporan Keuangan Owner dan halaman Ulasan.
 *
 * - Membuat beberapa pelanggan dummy.
 * - Membuat banyak order SELESAI + LUNAS tersebar di ~90 hari terakhir
 *   (dengan tipe & metode bayar bervariasi) agar Laporan Keuangan berisi.
 * - Membuat sejumlah ulasan bintang 1–5 pada menu acak.
 *
 * Idempotent: dilewati jika data dummy sudah ada, jadi aman dijalankan ulang.
 *
 * Jalankan manual:
 *   php artisan db:seed --class=LaporanUlasanDummySeeder
 */
class LaporanUlasanDummySeeder extends Seeder
{
    /** Jumlah order & ulasan dummy yang dibuat. */
    private const JUMLAH_ORDER  = 40;
    private const JUMLAH_ULASAN = 30;

    public function run(): void
    {
        // ── Guard idempotensi ─────────────────────────────────────────
        // Tandai lewat pelanggan dummy pertama. Jika sudah ada, anggap
        // seeder pernah jalan → hentikan agar tidak menumpuk data.
        if (User::where('email', 'budi.santoso@contoh.com')->exists()) {
            $this->command?->warn('Data dummy laporan & ulasan sudah ada — dilewati.');
            return;
        }

        // ── 1. Pelanggan dummy ────────────────────────────────────────
        $pelangganDummy = [
            ['name' => 'Budi Santoso',   'email' => 'budi.santoso@contoh.com'],
            ['name' => 'Siti Aminah',    'email' => 'siti.aminah@contoh.com'],
            ['name' => 'Andi Pratama',   'email' => 'andi.pratama@contoh.com'],
            ['name' => 'Rina Wulandari', 'email' => 'rina.wulandari@contoh.com'],
            ['name' => 'Dewi Lestari',   'email' => 'dewi.lestari@contoh.com'],
            ['name' => 'Joko Susilo',    'email' => 'joko.susilo@contoh.com'],
        ];

        $users = collect($pelangganDummy)->map(function ($p) {
            return User::firstOrCreate(
                ['email' => $p['email']],
                [
                    'name'              => $p['name'],
                    'password'          => Hash::make('password123'),
                    'role'              => 'pelanggan',
                    'email_verified_at' => now(),
                ]
            );
        });

        $menus = Menu::all();
        if ($menus->isEmpty()) {
            $this->command?->error('Tidak ada menu. Jalankan MenuSeeder dulu.');
            return;
        }

        $metodeBayar = ['Tunai', 'QRIS', 'Transfer Bank', 'E-Wallet'];
        $tipePesanan = ['dine_in', 'take_away', 'online'];

        // ── 2. Order SELESAI + LUNAS (untuk Laporan Keuangan) ─────────
        for ($i = 0; $i < self::JUMLAH_ORDER; $i++) {
            $user    = $users->random();
            $tanggal = Carbon::now()
                ->subDays(random_int(0, 89))
                ->setTime(random_int(8, 20), random_int(0, 59));
            $tipe    = $tipePesanan[array_rand($tipePesanan)];

            // 1–3 item menu berbeda per order
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
                'waktu_pengambilan' => $tipe === 'take_away' ? (clone $tanggal)->addHour() : null,
                'tanggal_pesan'     => $tanggal,
            ]);
            // Samakan created_at agar konsisten dengan tanggal_pesan
            $order->forceFill(['created_at' => $tanggal, 'updated_at' => $tanggal])->save();

            foreach ($rows as $row) {
                OrderItem::create(array_merge(['order_id' => $order->id], $row, [
                    'created_at' => $tanggal,
                    'updated_at' => $tanggal,
                ]));
            }

            Payment::create([
                'order_id'          => $order->id,
                'metode_pembayaran' => $metodeBayar[array_rand($metodeBayar)],
                'status_pembayaran' => 'lunas',
                'transaction_id'    => 'DUMMY-'.$order->id.'-'.$tanggal->timestamp,
                'created_at'        => $tanggal,
                'updated_at'        => $tanggal,
            ]);
        }

        // ── 3. Ulasan bervariasi (untuk halaman Ulasan) ──────────────
        // Komentar dikelompokkan per rentang rating agar terasa realistis.
        $komentarPositif = [
            'Rasanya enak banget, porsinya pas!',
            'Bumbunya meresap, pasti pesan lagi.',
            'Pelayanan cepat dan makanan masih hangat.',
            'Favorit keluarga, recommended!',
            'Harga terjangkau dengan rasa mantap.',
            'Nasinya pulen, lauknya melimpah.',
        ];
        $komentarNetral = [
            'Lumayan enak, tapi agak lama datangnya.',
            'Rasanya standar, sesuai harga.',
            'Cukup mengenyangkan, biasa saja.',
            'Oke lah untuk makan siang cepat.',
        ];
        $komentarNegatif = [
            'Kurang asin menurut saya.',
            'Porsinya sedikit untuk harganya.',
            'Sayang datangnya kelamaan.',
            'Bumbunya kurang meresap.',
        ];

        // Distribusi rating condong ke positif (mayoritas 4–5), sesekali 1–3.
        $distribusiRating = [5, 5, 5, 4, 4, 4, 3, 3, 2, 1];

        for ($i = 0; $i < self::JUMLAH_ULASAN; $i++) {
            $rating = $distribusiRating[array_rand($distribusiRating)];

            $komentar = match (true) {
                $rating >= 4 => $komentarPositif[array_rand($komentarPositif)],
                $rating == 3 => $komentarNetral[array_rand($komentarNetral)],
                default      => $komentarNegatif[array_rand($komentarNegatif)],
            };

            $tanggal = Carbon::now()
                ->subDays(random_int(0, 89))
                ->setTime(random_int(8, 21), random_int(0, 59));

            Review::create([
                'user_id'        => $users->random()->id,
                'menu_id'        => $menus->random()->id,
                'rating'         => $rating,
                'komentar'       => $komentar,
                'tanggal_ulasan' => $tanggal,
                'created_at'     => $tanggal,
                'updated_at'     => $tanggal,
            ]);
        }

        $this->command?->info(
            'Selesai: '.self::JUMLAH_ORDER.' order selesai/lunas + '
            .self::JUMLAH_ULASAN.' ulasan dummy dibuat.'
        );
    }
}
