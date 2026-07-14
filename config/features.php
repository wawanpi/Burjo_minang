<?php

/*
|--------------------------------------------------------------------------
| Feature Flags
|--------------------------------------------------------------------------
|
| email_verification: mengaktifkan verifikasi email pelanggan.
| Sengaja OFF secara default (produksi Railway memblokir SMTP, sehingga
| memaksa verifikasi akan mengunci pelanggan). Aktifkan HANYA di lokal
| dengan menyetel EMAIL_VERIFICATION_ENABLED=true di .env — kode di
| repo tetap aman di-deploy karena tanpa flag ini fitur tidak menyala.
|
*/

return [
    'email_verification' => (bool) env('EMAIL_VERIFICATION_ENABLED', false),
];
