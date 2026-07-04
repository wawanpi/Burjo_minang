# Hasil Black Box Testing — Sistem Informasi Pemesanan & Manajemen Operasional Burjo Minang

**Metode:** Black Box Testing (pengujian fungsional pada perilaku sistem, bukan struktur internal).
**Alat:** Laravel Feature Test dengan framework Pest 4 + PHPUnit, database uji SQLite in-memory, `RefreshDatabase`.
**Tanggal pelaksanaan:** 2 Juli 2026.
**Basis pengujian:** Kode aplikasi yang sudah ada (tidak ada logika fungsional yang diubah — hanya penambahan berkas uji).

Seluruh kasus uji dijalankan otomatis dan hasil pada laporan ini diambil **langsung dari eksekusi test yang sesungguhnya**.

---

## 4.2.1 Ringkasan Hasil Pengujian

| Aspek | Nilai |
|---|---|
| Fungsi utama diuji (BB-01 s.d. BB-10) | **10 / 10 Valid** |
| Total skenario uji (termasuk jalur normal & jalur galat) | **41** |
| Skenario **Lulus** | **41** |
| Skenario **Gagal** | **0** |
| Total assertion terverifikasi | **250** |

> **Kesimpulan:** **41 dari 41** skenario uji berstatus **Valid** (100%). Seluruh fungsi utama sistem berperilaku sesuai spesifikasi yang diharapkan.

---

## Tabel Hasil Pengujian (Ringkasan per Fungsi)

| Kode | Skenario / Fungsi | Prosedur | Data Masukan | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| **BB-01** | Registrasi pelanggan | Kirim `POST /register` untuk data valid dan data invalid | Valid: nama, email unik, no_hp `081234567890`, password `Password123`. Invalid: email `bukan-email`, password `abc`, no_hp `12345` | Valid → user tersimpan (role `pelanggan`), sesi login, redirect `/`. Invalid → error validasi, user tidak dibuat | User valid tersimpan & login; data invalid ditolak dengan error pada `name`, `email`, `no_hp`, `password`; jumlah user tetap 0 | **Valid** |
| **BB-02** | Login sesuai peran | Kirim `POST /login` untuk 3 peran + 1 kredensial salah | owner/kasir/pelanggan + password benar; dan 1 password salah | Benar → login & redirect sesuai peran (owner→`/owner/dashboard`, kasir→`/kasir/dashboard`, pelanggan→`/customer/menu`). Salah → gagal, tetap tamu | Ketiga peran diarahkan tepat sesuai dashboard-nya; kredensial salah menghasilkan error `email` dan sesi tetap tamu | **Valid** |
| **BB-03** | Pemesanan mandiri (pelanggan) | Kirim `POST /customer/menu/checkout` tipe dine-in & take-away | 2 menu (2×Rp20.000 + 1×Rp5.000), dine_in `jumlah_orang=3`; serta take-away dengan `waktu_pengambilan` | Order + order_items tersimpan; status awal `menunggu_pembayaran`; total & stok benar | Order tersimpan total **Rp45.000**, 2 order_items benar, stok berkurang (10→8, 10→9); take-away menyimpan `waktu_pengambilan` & `jumlah_orang` null | **Valid** |
| **BB-04** | Inisiasi pembayaran Midtrans | Checkout memicu pembuatan Snap; gateway di-stub | Menu Rp12.000, metode QRIS | Transaksi Snap terbentuk (token), record `payment` status `pending` tercipta, `transaction_id` format `ORDER-{id}-…` | Snap token dikembalikan; `payment` `pending` tersimpan dengan `payment_token`, `payment_url`, dan `transaction_id` berawalan `ORDER-{id}-` | **Valid** |
| **BB-05** | Webhook pembayaran otomatis | Kirim `POST /api/payment-callback` untuk beragam status transaksi | Payload notifikasi (order_id `ORDER-{id}-…`, status: settlement/capture/pending/expire/deny/cancel, + payload tak terverifikasi & order tak dikenal) | settlement/capture→`lunas`+`diproses`; pending→tetap; expire/deny/cancel→`gagal`+`batal`+restock; payload invalid→ditolak; order final→diabaikan | Semua transisi status pada tabel `payments`/`orders` (via FK `order_id`) sesuai; stok dikembalikan saat gagal; notifikasi tak terverifikasi ditolak **400**; order tak dikenal **404**; order final tidak berubah | **Valid** |
| **BB-06** | Status & riwayat pesanan pelanggan | Kirim `GET /customer/orders` tab aktif & riwayat | Pesanan milik pelanggan + pesanan milik pelanggan lain | Hanya menampilkan pesanan milik pelanggan ybs beserta status terkini | Tab aktif menampilkan **2** pesanan milik sendiri (pesanan pelanggan lain tidak muncul); tab riwayat menampilkan pesanan `selesai` | **Valid** |
| **BB-07** | Daftar pesanan kasir | Kirim `GET /kasir/orders` | Pesanan masuk hari ini | Daftar pesanan masuk tampil; mencerminkan kondisi database terkini | Pesanan hari ini tampil pada `pesanan_hari_ini`; penambahan pesanan tercermin pada request berikutnya (lihat Temuan Teknis (c) soal real-time) | **Valid** |
| **BB-08** | Update status pesanan kasir | Kirim `PATCH /kasir/orders/{id}/status` transisi sah & tidak sah | diproses→selesai; diproses→batal; selesai→menunggu_pembayaran; digital menunggu→diproses; status di luar enum | Hanya transisi sah diterima; transisi ilegal & nilai invalid ditolak | diproses→selesai (payment `lunas`) & diproses→batal (restock + payment `gagal`) diterima; rollback dari lunas/selesai, manipulasi pesanan digital pending, & nilai non-enum semuanya ditolak (status tidak berubah) | **Valid** |
| **BB-09** | Kelola menu & cetak nota | `POST/PUT/DELETE /kasir/menus` + `GET /kasir/orders/{id}/nota` & `/struk` | Tambah (dgn gambar), tambah invalid, edit, hapus; order selesai untuk nota/struk | Menu tersimpan/terupdate/terhapus & tervalidasi; nota/struk memuat data pesanan benar | Tambah/edit/hapus menu berhasil; input invalid ditolak (5 field error, menu tidak dibuat); nota (Inertia) & struk (thermal) memuat id, item, jumlah, dan total pesanan yang benar | **Valid** |
| **BB-10** | Laporan keuangan & kelola akun pemilik | `GET /owner/laporan`, `POST/PUT /owner/accounts`, `GET /owner/reviews`, + uji otorisasi | 5 order (2 lunas+selesai, 3 lainnya), data akun kasir, ulasan; akses oleh kasir/pelanggan/tamu | Agregasi pendapatan hanya dari transaksi lunas+selesai; pemilik dapat kelola akun & lihat ulasan; kasir/pelanggan/tamu ditolak | Total pendapatan **Rp80.000** (50.000+30.000) sesuai perhitungan manual, hanya 2 order terhitung; akun kasir dapat dibuat/diubah; ulasan tampil; kasir & pelanggan dialihkan (ditolak), tamu diarahkan ke `/login` | **Valid** |

---

## Tabel Rincian Skenario (41 sub-uji — hasil eksekusi)

| No | Kode | Nama Skenario Uji | Status |
|---|---|---|---|
| 1 | BB-01 | Registrasi dengan data valid menyimpan user pelanggan & otomatis login | ✅ Lulus |
| 2 | BB-01 | Registrasi dengan data invalid ditolak dengan error validasi | ✅ Lulus |
| 3 | BB-02 | Login kredensial benar mengarahkan sesuai peran — **owner** | ✅ Lulus |
| 4 | BB-02 | Login kredensial benar mengarahkan sesuai peran — **kasir** | ✅ Lulus |
| 5 | BB-02 | Login kredensial benar mengarahkan sesuai peran — **pelanggan** | ✅ Lulus |
| 6 | BB-02 | Login kredensial salah gagal dan tetap tamu | ✅ Lulus |
| 7 | BB-03 | Checkout dine-in menyimpan order + order_items dengan status & total benar | ✅ Lulus |
| 8 | BB-03 | Checkout take-away (pre-order) menyimpan waktu_pengambilan & tanpa jumlah_orang | ✅ Lulus |
| 9 | BB-04 | Konfirmasi pesanan membentuk transaksi Snap & record payment `pending` | ✅ Lulus |
| 10 | BB-05 | settlement → payment `lunas` & order `diproses` | ✅ Lulus |
| 11 | BB-05 | capture (credit_card, accept) → payment `lunas` & order `diproses` | ✅ Lulus |
| 12 | BB-05 | pending → payment tetap `pending` & order tetap `menunggu_pembayaran` | ✅ Lulus |
| 13 | BB-05 | expire → payment `gagal`, order `batal`, stok dikembalikan | ✅ Lulus |
| 14 | BB-05 | deny → payment `gagal`, order `batal`, stok dikembalikan | ✅ Lulus |
| 15 | BB-05 | cancel → payment `gagal`, order `batal`, stok dikembalikan | ✅ Lulus |
| 16 | BB-05 | Notifikasi tak terverifikasi ke Midtrans (transaksi invalid) ditolak **HTTP 400** | ✅ Lulus |
| 17 | BB-05 | Order sudah final (`selesai`) → webhook diabaikan tanpa mengubah status | ✅ Lulus |
| 18 | BB-05 | order_id tidak ditemukan di database ditolak **HTTP 404** | ✅ Lulus |
| 19 | BB-06 | Pelanggan hanya melihat pesanannya sendiri beserta status terkini (tab aktif) | ✅ Lulus |
| 20 | BB-06 | Tab riwayat menampilkan pesanan `selesai`/`batal` milik pelanggan | ✅ Lulus |
| 21 | BB-07 | Kasir melihat daftar pesanan masuk hari ini | ✅ Lulus |
| 22 | BB-07 | Daftar mencerminkan kondisi terkini database pada tiap request (basis reload) | ✅ Lulus |
| 23 | BB-08 | Transisi sah: tunai `diproses` → `selesai` (payment jadi `lunas`) | ✅ Lulus |
| 24 | BB-08 | Transisi sah: tunai `diproses` → `batal` (restock & payment `gagal`) | ✅ Lulus |
| 25 | BB-08 | Transisi tidak sah: lunas/selesai tidak dapat dikembalikan ke `menunggu_pembayaran` | ✅ Lulus |
| 26 | BB-08 | Transisi tidak sah: kasir dilarang mengubah pesanan digital yang masih `menunggu_pembayaran` | ✅ Lulus |
| 27 | BB-08 | Nilai status di luar enum ditolak validasi | ✅ Lulus |
| 28 | BB-09 | Tambah menu valid tersimpan ke database | ✅ Lulus |
| 29 | BB-09 | Tambah menu invalid ditolak validasi (tanpa gambar & harga negatif) | ✅ Lulus |
| 30 | BB-09 | Edit menu memperbarui data (nama & harga) | ✅ Lulus |
| 31 | BB-09 | Hapus menu menghilangkan data dari database | ✅ Lulus |
| 32 | BB-09 | Cetak nota menghasilkan data pesanan yang benar | ✅ Lulus |
| 33 | BB-09 | Cetak struk thermal memuat identitas pesanan | ✅ Lulus |
| 34 | BB-10 | Laporan keuangan menjumlahkan hanya transaksi lunas+selesai dengan total benar | ✅ Lulus |
| 35 | BB-10 | Pemilik dapat menambah akun kasir | ✅ Lulus |
| 36 | BB-10 | Pemilik dapat memperbarui akun kasir | ✅ Lulus |
| 37 | BB-10 | Pemilik dapat melihat ulasan pelanggan | ✅ Lulus |
| 38 | BB-10 | Kasir dialihkan (ditolak) saat mengakses laporan keuangan pemilik | ✅ Lulus |
| 39 | BB-10 | Kasir tidak dapat menambah akun via endpoint pemilik | ✅ Lulus |
| 40 | BB-10 | Pelanggan juga ditolak mengakses endpoint pemilik | ✅ Lulus |
| 41 | BB-10 | Tamu (belum login) dialihkan ke halaman login | ✅ Lulus |

**Total: 41 Lulus / 0 Gagal.**

---

## Temuan Teknis (Catatan Arsitektur)

Selama penelusuran kode ditemukan tiga hal yang **berbeda dari asumsi awal spesifikasi**. Temuan ini tidak menggagalkan pengujian, namun penting dicatat pada laporan agar deskripsi sistem di skripsi akurat. Semua bersifat observasi arsitektur — **bukan cacat aplikasi**.

**(a) Arsitektur: Inertia.js + React (monolit), bukan REST API + SPA token.**
Proyek memakai **Inertia.js** (`inertiajs/inertia-laravel` + `@inertiajs/react`), sehingga frontend React dan backend Laravel berjalan dalam satu aplikasi dengan **autentikasi berbasis session (cookie)**, bukan REST API terpisah dengan token. Berkas `routes/api.php` hanya berisi satu endpoint (webhook Midtrans); seluruh interaksi peran (pelanggan/kasir/pemilik) melewati `routes/web.php`. Implikasi pengujian: kasus uji fungsional diarahkan ke route web berbasis session (Feature Test), bukan uji REST bertoken.

**(b) Webhook Midtrans memverifikasi status via panggilan balik API, bukan signature lokal.**
Handler `PaymentCallbackController` membuat objek `\Midtrans\Notification`. Pada versi SDK yang terpasang (`midtrans/midtrans-php v2.6.x`), konstruktor kelas ini **tidak menghitung `signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)` secara lokal**. Sebaliknya, ia membaca `transaction_id` dari payload lalu **memanggil ulang `Transaction::status()` ke server Midtrans** untuk mengambil status transaksi yang otoritatif (verifikasi *server-to-server*). Konsekuensinya: payload palsu tidak dapat memanipulasi status karena status selalu diambil ulang dari Midtrans; notifikasi yang tidak dapat diverifikasi (transaksi tidak ada) otomatis ditolak dengan **HTTP 400**. Pada pengujian, panggilan HTTP ini di-stub melalui seam bawaan SDK (`\Midtrans\MT_Tests::$stubHttp`) agar uji berjalan offline & deterministik tanpa mengubah kode aplikasi. Field `signature_key` tetap disertakan pada payload uji agar menyerupai notifikasi asli.

**(c) Tidak ada polling/websocket untuk pembaruan real-time daftar pesanan kasir.**
Penelusuran seluruh `resources/js` tidak menemukan mekanisme *real-time* (tidak ada `setInterval` untuk memuat ulang daftar, `router.reload`, Laravel Echo, Pusher, maupun WebSocket) pada halaman `Kasir/Orders/Index.tsx`. Satu-satunya `setInterval` berada di `LandingPage.tsx` (animasi carousel). Artinya, pembaruan daftar pesanan kasir terjadi saat halaman **dimuat ulang / dinavigasi**, bukan melalui *push* otomatis. BB-07 memverifikasi bahwa endpoint mengembalikan data terkini dari database pada setiap request (basis reload).

---

## Cara Menjalankan Ulang Pengujian (Reproducible)

Prasyarat: PHP 8.3+, dependensi Composer sudah ter-install (`composer install`). Database uji memakai SQLite in-memory (tidak menyentuh database MySQL produksi/pengembangan). Menjalankan test **tidak memerlukan koneksi internet** karena gateway Midtrans di-stub.

Jalankan **hanya** suite Black Box:

```bash
# via Laravel Artisan (disarankan)
php artisan test --testsuite=BlackBox

# atau langsung via Pest
php vendor/bin/pest --testsuite=BlackBox

# atau satu berkas tertentu, mis. webhook
php artisan test tests/Feature/BlackBox/Bb05_WebhookMidtransTest.php
```

Menghasilkan berkas bukti berformat JUnit XML:

```bash
php vendor/bin/pest --testsuite=BlackBox --log-junit tests/Feature/BlackBox/_hasil-junit.xml
```

**Hasil yang diharapkan:** `Tests: 41 passed (250 assertions)`.

> Catatan: perintah `php artisan test` **tanpa** `--testsuite=BlackBox` akan turut menjalankan berkas uji bawaan scaffold Laravel Breeze (mis. `tests/Feature/Auth/*`, `ProfileTest`) yang **sudah usang** terhadap kustomisasi aplikasi ini (mereferensikan route `dashboard` yang tidak ada, dan belum mengetahui field `no_hp` wajib). Kegagalan pada berkas-berkas tersebut **bukan** bagian dari Black Box Testing ini dan tidak mencerminkan cacat fungsional pada fitur yang diuji.

---

## Berkas Pengujian yang Ditambahkan

Semua berkas di bawah bersifat **penambahan (aditif)** — tidak ada logika aplikasi yang diubah.

| Berkas | Peran |
|---|---|
| `tests/Feature/BlackBox/Bb01_02_AuthTest.php` | BB-01 Registrasi, BB-02 Login |
| `tests/Feature/BlackBox/Bb03_04_PemesananTest.php` | BB-03 Pemesanan, BB-04 Inisiasi pembayaran |
| `tests/Feature/BlackBox/Bb05_WebhookMidtransTest.php` | BB-05 Webhook Midtrans |
| `tests/Feature/BlackBox/Bb06_RiwayatPelangganTest.php` | BB-06 Riwayat pesanan pelanggan |
| `tests/Feature/BlackBox/Bb07_08_KasirPesananTest.php` | BB-07 Daftar pesanan, BB-08 Update status |
| `tests/Feature/BlackBox/Bb09_MenuNotaTest.php` | BB-09 Kelola menu & cetak nota/struk |
| `tests/Feature/BlackBox/Bb10_LaporanAkunOwnerTest.php` | BB-10 Laporan, akun, ulasan, otorisasi |
| `tests/Support/BlackBoxSupport.php` | Trait bantu: factory data uji + stub Midtrans |
| `tests/Support/MidtransHttpStub.php` | Test-double `\Midtrans\MT_Tests` (memutus cURL ke Midtrans) |
| `tests/Support/PhpInputStub.php` | Stream wrapper untuk men-stub `php://input` (dibaca SDK Notification) |
| `tests/Feature/BlackBox/_hasil-junit.xml` | Bukti hasil eksekusi (JUnit XML) |
| `phpunit.xml` | Penambahan `<testsuite name="BlackBox">` (tidak mengubah konfigurasi lain) |

---

## Catatan Bukti Gambar (Screenshot) untuk Skripsi

Bukti uji pada laporan ini berupa **keluaran eksekusi test otomatis** (bukan screenshot browser), karena alur pembayaran QRIS Midtrans yang sesungguhnya bersifat eksternal/asinkron dan tidak deterministik untuk diotomasi end-to-end. Untuk lampiran gambar pada Subbab 4.2.1, disarankan:

1. Menjalankan `php artisan test --testsuite=BlackBox` pada terminal, lalu mengambil **screenshot ringkasan hasil** (`Tests: 41 passed`).
2. (Opsional) Menjalankan tiap berkas BB secara terpisah untuk menampilkan rincian per-kode uji, lalu men-*screenshot* daftar centang hijau (✓) tiap skenario.
3. Berkas `tests/Feature/BlackBox/_hasil-junit.xml` dapat dilampirkan sebagai bukti mesin.

Bila pengujian *end-to-end* di browser diperlukan (mis. Playwright dengan screenshot tiap langkah), hal itu dapat ditambahkan terpisah namun membutuhkan aplikasi berjalan penuh (server Laravel + Vite) serta akun sandbox Midtrans aktif.
