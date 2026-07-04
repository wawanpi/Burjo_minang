# Hasil Black Box Testing — Sistem Informasi Burjo Minang

**Tanggal pelaksanaan:** 2 Juli 2026
**Metode:** Black Box Testing (pengujian fungsional pada perilaku sistem).
**Cara eksekusi:**
- **Alur UI (Pelanggan, Kasir, Pemilik):** dijalankan **nyata** di browser terhadap aplikasi yang berjalan (`php artisan serve` + aset Vite hasil `npm run build`), dikendalikan lewat automasi browser (klik, isi form, submit) lalu hasil aktual dibaca langsung dari DOM/screenshot.
- **Alur webhook Midtrans:** dieksekusi nyata via **Laravel Feature Test** dengan stub SDK Midtrans (lihat Catatan Teknis W-1), memverifikasi transisi status di database.
- **Verifikasi database:** dibaca langsung dari DB melalui `php artisan tinker` setelah tiap aksi.

> **Catatan lingkungan uji (penting):** Database MySQL/MariaDB lokal (XAMPP) **gagal start** karena tabel privilege korup (`Incorrect file format 'db'` + InnoDB LSN in the future), sehingga pengujian dijalankan di atas **database SQLite terisolasi** (`database/bb_testing.sqlite`) — engine yang sama dengan suite uji bawaan proyek. Substitusi ini tidak mengubah logika aplikasi. Satu-satunya konsekuensi: query khusus MySQL `FIELD()` di **dashboard kasir** tidak dikenali SQLite — temuan ini kemudian **diperbaiki** menjadi `CASE WHEN` portabel (lihat Temuan T-1).

---

## Verifikasi Kode vs Cakupan Pengujian (Penyimpangan)

Sebelum pengujian, struktur A–D ditelusuri ke kode nyata (routes, controllers, komponen React/Inertia). Ditemukan penyimpangan berikut:

| Kode | Penyimpangan terhadap spesifikasi A–D | Dampak |
|---|---|---|
| **PENY-1** | **D.3.d "Mencari Akun" semula TIDAK diimplementasikan** — `AccountController@index` mengembalikan seluruh user tanpa parameter pencarian; halaman akun tidak punya input pencarian. → **Fitur kemudian DIIMPLEMENTASIKAN** (backend: filter `search` pada name/email/no_hp dengan grouping agar tidak membocorkan akun owner; frontend: input debounced 400ms + tombol clear + empty-state, pola sama dengan Cari Menu) dan **diuji ulang: Pass** (D-13/D-13b). Regression test: `tests/Feature/BlackBox/AccountSearchTest.php` (4 tes / 73 assertion, lulus). | Skenario D.3.d kini teruji penuh. |
| **PENY-2** | **Cetak Nota berformat HTML, bukan PDF.** Nota = halaman Inertia (`Kasir/Orders/Nota.tsx`, auto `window.print()`); struk = Blade thermal (`kasir.struk`). Tidak ada generator PDF. | Pengujian C.3 mengacu ke output HTML. |
| **PENY-3** | **Teks empty-state berbeda dari spesifikasi.** Laporan periode kosong menampilkan **"Belum ada transaksi"** (bukan "Data Kosong"); ulasan kosong menampilkan **"Belum ada ulasan untuk filter ini."** (bukan "Belum Ada Ulasan"). | Fungsional benar; hanya beda kalimat. Dicatat pada hasil aktual. |
| **PENY-4** | Tipe pesanan pelanggan pada alur checkout dibatasi **`dine_in` / `take_away`** (nilai enum `online` ada di DB namun tidak dipakai UI pelanggan). | Sesuai spesifikasi (Take Away/Dine In). |
| **PENY-5** | Registrasi menolak password lemah secara **client-side** (tombol "Daftar" dinonaktifkan hingga password memenuhi ≥2 kriteria & konfirmasi cocok), sebelum sempat ke server. | Perilaku negatif sah; dicatat pada A.1. |

Enum aktual terverifikasi: `orders.status_pesanan` ∈ {menunggu_pembayaran, diproses, selesai, batal}; `payments.status_pembayaran` ∈ {pending, lunas, gagal, kadaluarsa}.

---

## A. FITUR UMUM (Semua Aktor)

| No | Fitur | Skenario Uji | Data Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| A-1 | Registrasi akun | Registrasi data valid | nama `Budi Pelanggan`, email `budipelanggan@gmail.com`, no_hp `081377778888`, password `Password123` (+konfirmasi) | User `pelanggan` tersimpan, otomatis login, diarahkan sesuai peran | User dibuat (role `pelanggan`), auto-login, redirect ke `/customer/menu` | **Pass** |
| A-2 | Registrasi akun | Registrasi data tidak valid (server) | email `pelanggan@gmail.com` (duplikat), no_hp `12345`, password `Password123` | Ditolak validasi, user tidak dibuat | Tetap di `/register`; error `email: The email has already been taken.`, `no_hp: The no hp field format is invalid.`; user tidak dibuat | **Pass** |
| A-3 | Registrasi akun | Registrasi password lemah | password `abc` / konfirmasi `abc` | Tidak dapat submit | Tombol **"Daftar" dinonaktifkan** (guard client-side, `canSubmit=false`) — form tidak terkirim | **Pass** |
| A-4 | Login | Login kredensial valid — **Owner** | `owner@burjominang.com` / `password123` | Login, redirect `/owner/dashboard` | Redirect ke `/owner/dashboard` (h1 "Dashboard") | **Pass** |
| A-5 | Login | Login kredensial valid — **Kasir** | `kasir@burjominang.com` / `password123` | Login, redirect `/kasir/dashboard` | Terautentikasi sebagai kasir (redirect ke `/kasir/dashboard`). *Catatan: saat uji awal halaman dashboard kasir error 500 di SQLite — sudah DIPERBAIKI, lihat T-1* | **Pass** |
| A-6 | Login | Login kredensial valid — **Pelanggan** | `pelanggan@gmail.com` / `password123` | Login, redirect `/customer/menu` | Redirect ke `/customer/menu` | **Pass** |
| A-7 | Login | Login kredensial salah | `owner@burjominang.com` / `salahpassword` | Gagal, tetap tamu, pesan error | Tetap di `/login`; error **"These credentials do not match our records."** | **Pass** |
| A-8 | Login | Login field kosong | email & password kosong → klik Masuk | Tidak dapat submit / ditolak | Form diblokir validasi HTML5 (`required`, "Please fill out this field."), tetap `/login` | **Pass** |
| A-9 | Logout | Logout dari sesi aktif | klik "Keluar" (sesi Owner) | Sesi berakhir, kembali ke tamu | Redirect ke `/` (Landing Page tamu); sesi berakhir | **Pass** |

**Ringkasan Grup A: 9 Pass / 0 Fail.**

---

## B. PELANGGAN

| No | Fitur | Skenario Uji | Data Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| B-1 | Pesan Online | Alur lengkap: pilih menu → keranjang → checkout → Take Away → waktu kedatangan → QRIS → inisiasi pembayaran | 1× Nasi Telur (Rp12.000), Take Away, Hari Ini `22:30`, metode QRIS | Order tersimpan `menunggu_pembayaran`, payment QRIS `pending`, stok berkurang, Snap token & popup Midtrans muncul | **Order #4** dibuat: `menunggu_pembayaran`, take_away, total **Rp12.000**, waktu_pengambilan `22:30`, payment QRIS `pending`, `transaction_id=ORDER-4-…`, Snap token 36 char; **popup Midtrans sandbox terbuka** (`snap/v4/popup → 200`); stok Nasi Telur 50→**49** | **Pass** |
| B-2 | Pesan Online — Webhook | Notifikasi **settlement** (berhasil) | payload settlement, order online | payment `lunas`, order `diproses` | payment→`lunas`, order→`diproses` (HTTP 200) | **Pass** |
| B-3 | Pesan Online — Webhook | Notifikasi **capture** kartu (accept) | payload capture/credit_card/accept | payment `lunas`, order `diproses` | payment→`lunas`, order→`diproses` (HTTP 200) | **Pass** |
| B-4 | Pesan Online — Webhook | Notifikasi **pending** | payload pending | status tetap menunggu_pembayaran/pending | order tetap `menunggu_pembayaran`, payment tetap `pending` (HTTP 200) | **Pass** |
| B-5 | Pesan Online — Webhook | Notifikasi **gagal/retry**: expire, deny, cancel | 3 payload (expire/deny/cancel), order 2 item stok 8 | payment `gagal`, order `batal`, stok dikembalikan (restock) | Ketiganya → payment `gagal`, order `batal`, stok 8→**10** (restock) | **Pass** |
| B-6 | Pesan Online — Webhook | Notifikasi tak terverifikasi (transaksi invalid) | payload transaksi tidak ada di Midtrans | Ditolak, status tak berubah (cegah retry) | HTTP **400**; order tetap `menunggu_pembayaran`, payment tetap `pending` | **Pass** |
| B-7 | Pesan Online — Webhook | Order sudah final + `order_id` tak dikenal | order `selesai`; `order_id`=999999 | webhook diabaikan / 404 | Order final: diabaikan (200, tetap `selesai`/`lunas`); order tak dikenal: **404** | **Pass** |
| B-8 | Melihat Status Pesanan | Tab "Pesanan Aktif" | sesi `pelanggan@gmail.com` | Menampilkan status terkini pesanan milik sendiri | Menampilkan Order #2 **"Sedang Diproses"** (hanya pesanan milik pelanggan ybs) | **Pass** |
| B-9 | Melihat Riwayat Pesanan | Tab "Riwayat" | sesi `pelanggan@gmail.com` | Menampilkan pesanan selesai & batal | Order #1 **Selesai** (dengan tombol Ulasan) + Order #3 **Dibatalkan** | **Pass** |
| B-10 | Memberikan Ulasan | Ulasan pada pesanan **Completed** (positif) | Order #1 (selesai), rating **5**, komentar "Nasi telurnya enak…" | Ulasan tersimpan | Review tersimpan di DB: menu Nasi Telur, rating 5, komentar sesuai, user `pelanggan@gmail.com` | **Pass** |
| B-11 | Memberikan Ulasan | Status belum Completed (negatif) | Order #3 (batal) & Order #2 (diproses) | Tidak bisa memberi ulasan | Tombol "Berikan Ulasan" **tidak muncul** untuk pesanan non-selesai; POST ulasan ke Order #2 (diproses) → **HTTP 403 Forbidden** | **Pass** |

**Ringkasan Grup B: 11 Pass / 0 Fail.**

---

## C. KASIR

| No | Fitur | Skenario Uji | Data Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| C-1 | Daftar Pesanan | Melihat daftar pesanan (online + offline tergabung) | sesi kasir, GET `/kasir/orders` | Daftar pesanan masuk tampil, mencerminkan DB | 4 pesanan tampil (#1 Selesai, #2 Diproses, #3 Batal, #4 Batal) beserta status & pembayaran; pesanan offline muncul setelah C-4 | **Pass** |
| C-2 | Perbarui Status | Transisi sah: `diproses` → `selesai` | Order #2 (diproses, QRIS lunas) via select status | Status berubah ke selesai | Order #2 → `selesai`; payment tetap `lunas` | **Pass** |
| C-3 | Perbarui Status | Transisi tidak sah (negatif) | Order #1 (selesai/lunas) → `menunggu_pembayaran` (PATCH) | Ditolak, status tak berubah | Guard backend menolak; Order #1 tetap `selesai`/`lunas` | **Pass** |
| C-4 | Cetak Nota | Cetak nota pesanan (HTML) | Order #1, GET `/kasir/orders/1/nota` | Nota memuat data pesanan benar | Nota HTML tampil: No #1, Pelanggan Setia, Dine In (2 Org), Nasi Telur 2×12.000, **TOTAL Rp 24.000**, QRIS/Lunas (auto-print) | **Pass** |
| C-5 | Pesanan Langsung (Tunai) | Bayar tunai, nominal cukup (cek kembalian) | 1× Nasi Ayam (Rp18.000), Tunai, uang diterima **Rp20.000** | Order tersimpan `diproses`/`lunas`, kembalian benar | UI kembalian **Rp 2.000**; **Order #5** dibuat `diproses`, Tunai `lunas`, total Rp18.000, stok Nasi Ayam 40→39 | **Pass** |
| C-6 | Pesanan Langsung (Tunai) | Nominal tunai kurang (negatif) | total Rp18.000, uang diterima **Rp10.000** | Ditolak, transaksi tidak diproses | Pesan **"Uang kurang Rp 8.000"**, tombol checkout **disabled** | **Pass** |
| C-7 | Pesanan Langsung (Nontunai) | Bayar nontunai QRIS (verifikasi via Midtrans) | 1× Es Teh (Rp5.000), metode QRIS | Order `menunggu_pembayaran`, Snap token dibuat | **Order #6** `menunggu_pembayaran`, QRIS `pending`, `transaction_id=KASIR-6-…`, Snap token 36 char | **Pass** |
| C-8 | Pesanan Langsung | Cetak nota/struk hasil transaksi offline | GET `/kasir/orders/5/struk` | Struk memuat data pesanan | Struk (thermal HTML) HTTP 200 memuat BURJO, Nasi Ayam, 18.000, Tunai | **Pass** |
| C-9 | Kelola Menu — Lihat | Melihat daftar menu | GET `/kasir/menus` | Daftar menu tampil | 6 menu tampil (Total 6 menu terdaftar) | **Pass** |
| C-10 | Kelola Menu — Tambah | Tambah menu valid (dengan gambar) | nama `Teh Tarik Spesial`, kategori Minuman, harga 10000, stok 20, gambar PNG | Menu tersimpan | Menu dibuat, jumlah 6→**7** | **Pass** |
| C-11 | Kelola Menu — Tambah | Tambah menu tidak valid | nama/kategori/harga valid, **tanpa gambar** | Ditolak validasi | Modal tetap terbuka, error **"The gambar field is required."**; menu tidak dibuat | **Pass** |
| C-12 | Kelola Menu — Ubah | Ubah menu valid | Mie Rebus harga 15000 → **16000** | Data menu terupdate | Harga Mie Rebus → **Rp 16.000** | **Pass** |
| C-13 | Kelola Menu — Ubah/Cari | Menu tidak ditemukan saat pencarian | pencarian `ZZZ999` | Data kosong / tidak ditemukan | 0 hasil, pesan **"Tidak ada menu yang cocok dengan \"ZZZ999\""** | **Pass** |
| C-14 | Kelola Menu — Cari | Cari menu (ditemukan) | pencarian `Nasi` | Menampilkan menu cocok | 2 hasil: Nasi Telur, Nasi Ayam (`?search=Nasi`, server-side) | **Pass** |
| C-15 | Kelola Menu — Hapus | Batal konfirmasi hapus | klik Hapus (Teh Tarik Spesial), konfirmasi = **Batal** | Menu tidak terhapus | Konfirmasi dibatalkan → tetap 7 menu, item masih ada | **Pass** |
| C-16 | Kelola Menu — Hapus | Hapus menu (dikonfirmasi) | klik Hapus, konfirmasi = **OK** | Menu terhapus | Teh Tarik Spesial terhapus → kembali 6 menu | **Pass** |

**Ringkasan Grup C: 16 Pass / 0 Fail.**

---

## D. PEMILIK (Pewarisan Kasir + Fungsi Manajerial)

### D.1 Pewarisan Fungsi Kasir (uji dari akun Pemilik)

| No | Fitur | Skenario Uji | Data Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| D-1 | Warisan: Daftar Pesanan | Pemilik akses daftar pesanan kasir | sesi owner, GET `/kasir/orders` | Dapat melihat & mengelola pesanan | Daftar pesanan + kontrol status (select) & Cetak Nota tampil untuk owner | **Pass** |
| D-2 | Warisan: Kelola Menu | Pemilik melihat & mengubah menu | sesi owner, edit Kopi Hitam 8000 → **9000** | Dapat mengelola menu | Halaman `/kasir/menus` tampil; harga Kopi Hitam → **Rp 9.000** (write sukses) | **Pass** |
| D-3 | Warisan: POS | Pemilik akses Kasir POS | sesi owner, GET `/kasir/pos` | Dapat mengakses POS | Halaman POS tampil (search, keranjang, kontrol pembayaran) | **Pass** |

### D.2 Fungsi Manajerial Pemilik

| No | Fitur | Skenario Uji | Data Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| D-4 | Laporan Keuangan | Periode dengan data | tab Keuangan (tanpa filter tanggal) | Tampil total pemasukan | **Total Pendapatan Rp 24.000**, 1 transaksi (hanya order lunas+selesai) | **Pass** |
| D-5 | Laporan Keuangan | Periode tanpa data | `dari=2027-01-01`, `sampai=2027-01-31` | Pesan "Data Kosong" | Total **Rp 0**, tabel kosong, pesan **"Belum ada transaksi"** (lih. PENY-3) | **Pass** |
| D-6 | Melihat Ulasan | Belum ada ulasan | sesi owner, sebelum pelanggan menulis ulasan | Pesan "Belum Ada Ulasan" | 0 kartu, "dari 0 ulasan", pesan **"Belum ada ulasan untuk filter ini."** (lih. PENY-3) | **Pass** |
| D-7 | Melihat Ulasan | Ada ulasan pelanggan | setelah B-10 | Daftar ulasan tampil | 1 kartu ulasan: Nasi Telur, komentar & rating pelanggan, "dari 1 ulasan" | **Pass** |
| D-8 | Kelola Akun — Lihat | Melihat daftar akun | GET `/owner/accounts` | Daftar akun kasir/pelanggan tampil | 2 akun tampil (kasir Satu, Pelanggan Setia); owner tidak tampil | **Pass** |
| D-9 | Kelola Akun — Tambah | Tambah akun valid | nama `Kasir Dua`, email unik, no_hp `081298765432`, password `password123`, role kasir | Akun tersimpan | Akun dibuat, total 2→**3** | **Pass** |
| D-10 | Kelola Akun — Tambah | Tambah akun tidak valid | email duplikat, no_hp `12345`, password `abc` | Ditolak validasi | Errors: "email already taken", "no hp format invalid", "password min 8 characters"; akun tidak dibuat | **Pass** |
| D-11 | Kelola Akun — Ubah | Ubah akun valid | Kasir Dua → nama `Kasir Dua Edit` | Data akun terupdate | Nama → "Kasir Dua Edit". Saat uji awal ditemukan defek T-2 (no_hp tidak ter-prefill sehingga edit hanya-nama terblokir) — **defek sudah DIPERBAIKI** (lihat T-2) & diverifikasi lulus | **Pass** |
| D-12 | Kelola Akun — Ubah | Akun tidak ditemukan | GET `/owner/accounts/99999/edit` | Ditolak / tidak ditemukan | HTTP **404 Not Found** | **Pass** |
| D-13 | Kelola Akun — Cari | Mencari akun (ditemukan) | kata kunci `Budi`, lalu `kasir` | Menampilkan akun yang cocok | Fitur semula tidak ada (PENY-1) → **kemudian DIIMPLEMENTASIKAN** & diuji ulang: `Budi` → 1 hasil (Budi Pelanggan), `kasir` → 1 hasil (kasir Satu); URL `?search=…` (server-side, debounce 400ms); tombol ✕ mengembalikan daftar penuh | **Pass** |
| D-13b | Kelola Akun — Cari | Kata kunci tidak ditemukan (negatif) | kata kunci `ZZZ999` | Pesan data tidak ditemukan | 0 baris, pesan **"Tidak ada akun yang cocok dengan \"ZZZ999\""** | **Pass** |
| D-14 | Kelola Akun — Hapus | Batal konfirmasi hapus | klik Hapus (Kasir Dua Edit), konfirmasi = **Batal** | Akun tidak terhapus | Konfirmasi dibatalkan → tetap 3 akun | **Pass** |
| D-15 | Kelola Akun — Hapus | Hapus akun (dikonfirmasi) | klik Hapus, konfirmasi = **OK** | Akun terhapus | Kasir Dua Edit terhapus → kembali 2 akun | **Pass** |

**Ringkasan Grup D: 16 Pass / 0 Fail / 0 N/A** *(D-13 semula N/A karena fitur belum ada; setelah fitur Cari Akun diimplementasikan, D-13 & D-13b diuji ulang dan lulus).*

---

## Ringkasan Keseluruhan

| Grup | Pass | Fail | N/A | Total skenario |
|---|---|---|---|---|
| A. Fitur Umum | 9 | 0 | 0 | 9 |
| B. Pelanggan (termasuk 6 sub-uji webhook) | 11 | 0 | 0 | 11 |
| C. Kasir | 16 | 0 | 0 | 16 |
| D. Pemilik | 16 | 0 | 0 | 16 |
| **TOTAL** | **52** | **0** | **0** | **52** |

- **52 dari 52** skenario **Pass** (0 Fail, 0 N/A).
- "Mencari Akun" (D-13) semula N/A karena fitur belum ada (PENY-1) — fitur kemudian **diimplementasikan**, diuji ulang (positif D-13 + negatif D-13b), dan lulus.

---

## Catatan Teknis

**T-1 — Dashboard Kasir memakai fungsi MySQL `FIELD()` → ✅ SUDAH DIPERBAIKI.**
*Gejala (saat uji awal):* `DashboardController::index()` cabang kasir (baris 48) menjalankan `->orderByRaw("FIELD(status_pesanan, …)")`. `FIELD()` adalah fungsi khas MySQL/MariaDB; SQLite tidak mengenalnya sehingga saat ada baris data, halaman `/kasir/dashboard` melempar `SQLSTATE[HY000]: no such function: FIELD` (HTTP 500). Cabang **owner** dashboard tidak memakai `FIELD()` sehingga selalu normal.

*Bug kedua yang ditemukan saat perbaikan:* daftar status pada `FIELD()` memuat **typo `'dibatalkan'`** padahal nilai enum sebenarnya `'batal'`. Akibatnya di MySQL/MariaDB pun pesanan batal mendapat `FIELD() = 0` (tidak ditemukan) dan justru terurut **paling atas** antrean — bertentangan dengan maksud kode ("prioritaskan yang butuh tindakan").

*Perbaikan yang diterapkan* — `app/Http/Controllers/Owner/DashboardController.php` (cabang kasir):
```php
// Sebelum (khusus MySQL + typo 'dibatalkan'):
->orderByRaw("FIELD(status_pesanan, 'menunggu_pembayaran', 'diproses', 'selesai', 'dibatalkan')")
// Sesudah (portabel semua database + enum benar):
->orderByRaw("CASE status_pesanan WHEN 'menunggu_pembayaran' THEN 1 WHEN 'diproses' THEN 2 WHEN 'selesai' THEN 3 WHEN 'batal' THEN 4 ELSE 5 END")
```

*Verifikasi:* ditambahkan regression test `tests/Feature/BlackBox/KasirDashboardFieldFixTest.php` (2 tes / 28 assertion, **lulus** di SQLite) yang menegaskan (a) `/kasir/dashboard` kembali HTTP 200 saat ada data pesanan hari ini (sebelum fix: 500), dan (b) urutan antrean benar: `menunggu_pembayaran` → `diproses` → `selesai` → `batal` (sebelum fix: `batal` tampil pertama karena typo).

**T-2 — Defek: Ubah Akun gagal jika Nomor HP tidak diisi ulang → ✅ SUDAH DIPERBAIKI.**
*Gejala (saat uji awal):* `AccountController@index` hanya menyeleksi kolom `id, name, email, role, created_at` — **`no_hp` tidak ikut dikirim** ke frontend. Modal edit (`UserFormModal`) mengisi `no_hp` dari `user.no_hp` yang `undefined` → field kosong, padahal field tersebut `required`. Akibatnya, saat Pemilik hanya mengubah (mis.) nama lalu menyimpan, submit **diblokir validasi HTML5** (field HP kosong) tanpa pesan yang jelas; perubahan gagal secara diam-diam. Perilaku ini identik di MySQL maupun SQLite.

*Perbaikan yang diterapkan:* pada `app/Http/Controllers/Owner/AccountController.php` method `index()`, kolom `no_hp` ditambahkan ke query:
```php
// Sebelum:
->get(['id', 'name', 'email', 'role', 'created_at']);
// Sesudah:
->get(['id', 'name', 'email', 'no_hp', 'role', 'created_at']);
```
Kini daftar akun membawa `no_hp`, modal edit ter-prefill benar, dan pengubahan hanya-nama tidak lagi terblokir. Tipe `User` di frontend (`resources/js/types/user.types.ts`) sudah mendeklarasikan `no_hp` sehingga tidak perlu perubahan/rebuild frontend.

*Verifikasi:* ditambahkan regression test `tests/Feature/BlackBox/AccountNoHpFixTest.php` (2 tes / 19 assertion, **lulus**) yang menegaskan (a) prop Inertia `users.0.no_hp` kini terisi benar, dan (b) update akun ganti-nama dengan `no_hp` yang dipertahankan berhasil tersimpan — menembus jalur controller + route + respons Inertia yang sama seperti yang dipakai browser.

*Catatan:* method `AccountController@create` & `edit` mengembalikan komponen `Owner/Accounts/Create` & `Owner/Accounts/Edit` yang **tidak ada berkasnya** (SPA memakai modal, bukan route ini) — jalur mati, tidak berdampak pada bug ini dan tidak diubah.

**W-1 — Metodologi eksekusi webhook Midtrans.**
Handler `PaymentCallbackController` membuat `\Midtrans\Notification`. Pada SDK terpasang, konstruktor ini **tidak** menghitung `signature_key` lokal, melainkan **memanggil ulang `Transaction::status()` ke server Midtrans** untuk verifikasi server-to-server. Konsekuensinya, payload buatan yang dikirim `curl` mentah akan ditolak (400) karena transaksi fiktif tidak ada di Midtrans. Karena itu ketiga hasil webhook (pending / berhasil / gagal) diuji lewat **Laravel Feature Test** (`tests/Feature/BlackBox/Bb05_WebhookMidtransTest.php`, 9 tes / 28 assertion — semua lulus) dengan panggilan HTTP SDK di-stub agar deterministik. Ini adalah eksekusi nyata terhadap kode controller yang sama, memverifikasi perubahan `orders.status_pesanan` & `payments.status_pembayaran` di database.

**Observasi tambahan (bukan cacat):**
- **Auto-cancel:** pesanan `menunggu_pembayaran` berumur >5 menit otomatis dibatalkan + stok dikembalikan saat halaman pesanan/daftar dimuat (terlihat pada Order #3 & #4 yang berubah menjadi `batal`).
- **Gerbang keamanan status digital:** pesanan nontunai berstatus `menunggu_pembayaran` menampilkan label **"Menunggu Sistem…"** (tanpa opsi ubah manual) — hanya webhook Midtrans yang boleh mengubahnya.
- **Prefiks transaction_id membedakan sumber:** online = `ORDER-{id}-…`, kasir offline = `KASIR-{id}-…`.

---

## Lingkungan & Reproduksibilitas

- PHP 8.3.17, Node 24, Composer 2.9, Laravel 13, Inertia.js + React 18/19.
- Server uji: `php artisan serve` (127.0.0.1:8000), aset via `npm run build`.
- DB uji: SQLite `database/bb_testing.sqlite`, di-seed dengan `DatabaseSeeder` (3 akun) + `BlackBoxTestDataSeeder` (6 menu + pesanan representatif).
- Akun uji: owner `owner@burjominang.com`, kasir `kasir@burjominang.com`, pelanggan `pelanggan@gmail.com` — semua password `password123`.
- Webhook: `php artisan test tests/Feature/BlackBox/Bb05_WebhookMidtransTest.php`.
