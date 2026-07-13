<?php

/*
|--------------------------------------------------------------------------
| Konfigurasi Midtrans
|--------------------------------------------------------------------------
|
| Bug #5: Kredensial Midtrans dibaca lewat file config ini, BUKAN env()
| langsung di controller. Saat `php artisan config:cache` dijalankan
| (umum di produksi/Docker/Railway), fungsi env() di luar file config akan
| mengembalikan null. Dengan membaca via config('midtrans.*'), server key
| tetap tersedia meski config sudah di-cache.
|
*/

return [
    'server_key'    => env('MIDTRANS_SERVER_KEY'),
    'client_key'    => env('MIDTRANS_CLIENT_KEY'),
    'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),
    'is_sanitized'  => true,
    'is_3ds'        => true,

    /*
     * LIM-4: Batas waktu pembayaran (menit) — dipakai untuk custom_expiry Snap
     * Midtrans DAN auto-cancel pesanan menggantung di sisi aplikasi (harus sama
     * agar tidak ada window pembayaran masuk setelah pesanan dibatalkan).
     * Sebelumnya di-hardcode (5 di customer, 3 di POS). Atur via .env bila user
     * menilai terlalu singkat/panjang.
     */
    'payment_expiry_minutes' => (int) env('MIDTRANS_PAYMENT_EXPIRY_MINUTES', 5),
];
