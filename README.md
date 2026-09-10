# 🍛 Burjo Minang RM

> Sistem manajemen rumah makan berbasis web full-stack untuk **Burjo Minang** — dilengkapi pemesanan online, Point of Sale (POS), integrasi pembayaran digital, dan dashboard analitik bisnis.

---

## 📖 Ringkasan

**Burjo Minang RM** adalah sistem manajemen rumah makan yang dibangun untuk mendigitalisasi seluruh alur operasional Rumah Makan bergaya Minang. Aplikasi ini menjawab tiga tantangan utama: kesalahan pencatatan pesanan manual, tidak adanya visibilitas bisnis secara real-time, dan belum tersedianya opsi pembayaran digital.

Sistem ini melayani tiga peran pengguna — **Owner (Pemilik)**, **Kasir**, dan **Pelanggan** — masing-masing dengan antarmuka khusus dan kontrol akses berbasis peran yang diterapkan di level route maupun middleware.

Pelanggan dapat melihat menu, memesan secara online dengan pembayaran digital Midtrans (QRIS / Transfer Bank), melacak status pesanan, dan memberikan ulasan. Kasir mengelola pesanan walk-in melalui sistem POS, memperbarui status pesanan, dan mencetak struk. Owner mengakses dashboard komprehensif berisi analitik pendapatan, laporan keuangan, ulasan pelanggan, dan manajemen akun staf.

---

## ✨ Fitur Utama

### Sisi Pelanggan
- 🛒 **Pemesanan Online** — Jelajahi menu dengan rating, tambah ke keranjang, pilih dine-in atau take-away
- 💳 **Pembayaran Digital (Midtrans Snap)** — QRIS dan Transfer Bank dengan pembaruan status real-time via webhook
- 📦 **Pelacakan Pesanan** — Status pesanan langsung dari pembayaran → diproses → selesai
- ⭐ **Ulasan Pelanggan** — Beri rating dan ulasan menu dari pesanan yang sudah selesai
- ⏰ **Auto-Cancel** — Pesanan yang belum dibayar otomatis dibatalkan dan stok dikembalikan

### Kasir
- 🖥️ **Point of Sale (POS)** — Proses pesanan walk-in dengan pembayaran tunai atau digital
- 📋 **Manajemen Pesanan** — Lihat, perbarui status, dan lacak semua pesanan masuk
- 🧾 **Cetak Struk** — Buat dan cetak struk/nota transaksi
- 📦 **Manajemen Menu** — CRUD menu makanan/minuman dengan pelacakan stok
- 🔒 **Toggle Buka/Tutup Toko** — Buka/tutup toko untuk mengontrol penerimaan pesanan

### Owner
- 📊 **Dashboard Bisnis** — Statistik pendapatan, grafik pendapatan 30 hari, menu terlaris, pesanan terbaru
- 📈 **Laporan Keuangan** — Laporan dual-tab (audit keuangan & riwayat pesanan) dengan filter tanggal/tipe dan dukungan cetak
- 👥 **Manajemen Akun** — CRUD akun staf (kasir) dengan soft-delete
- ⭐ **Manajemen Ulasan** — Pantau semua ulasan dan rating pelanggan
- 🔐 **Pewarisan Peran** — Owner mewarisi semua hak akses kasir

### Sistem & Keamanan
- 🔐 **Autentikasi & Otorisasi** — Laravel Breeze dengan middleware berbasis peran (`owner`, `kasir`, `pelanggan`)
- 🛡️ **Kalkulasi Harga Server-Side** — Semua harga dihitung ulang dari database untuk mencegah manipulasi frontend
- 🔒 **Pencegahan Race Condition** — Pessimistic locking (`lockForUpdate`) pada operasi stok
- 🔄 **Webhook Midtrans** — Penanganan callback pembayaran yang aman dengan verifikasi signature dan pengembalian stok otomatis
- 📧 **Verifikasi Email Fleksibel** — Dapat diaktifkan/nonaktifkan melalui environment variable untuk deployment tanpa SMTP
- 🐳 **Deployment Docker & Railway** — Dockerfile multi-stage siap produksi

---

## 🖥️ Pratinjau Aplikasi

`[SCREENSHOT DIBUTUHKAN]`

Screenshot yang direkomendasikan untuk ditambahkan:

| Prioritas | Halaman | Deskripsi |
|:---:|:---|:---|
| 1 | Landing Page | Halaman publik dengan menu unggulan |
| 2 | Dashboard Owner | Statistik pendapatan, grafik, dan menu terlaris |
| 3 | Antarmuka POS | Layar pemesanan kasir |
| 4 | Menu Pelanggan | Jelajah menu online dengan keranjang |
| 5 | Manajemen Pesanan | Daftar pesanan dengan manajemen status |
| 6 | Laporan Keuangan | Laporan keuangan dengan filter |
| 7 | Tampilan Mobile | Layout responsif di perangkat mobile |

> 💡 **Tips:** Tambahkan screenshot ke direktori `docs/screenshots/` lalu perbarui bagian ini.

---

## 🛠️ Tech Stack

### Frontend
| Teknologi | Fungsi |
|:---|:---|
| **React 18** | Library komponen UI |
| **TypeScript** | Pengembangan frontend yang type-safe |
| **Inertia.js v2** | SPA berbasis server (tanpa API terpisah) |
| **Tailwind CSS 3** | Framework CSS utility-first |
| **Recharts** | Grafik pendapatan dan analitik |
| **Headless UI** | Komponen UI yang aksesibel (modal, dropdown) |
| **React Hook Form** | Manajemen state formulir |
| **Zustand** | Manajemen state global yang ringan |

### Backend
| Teknologi | Fungsi |
|:---|:---|
| **Laravel 13** | Framework PHP (MVC) |
| **PHP 8.3** | Bahasa pemrograman server-side |
| **Inertia.js (Server)** | Adapter server-side untuk SPA |
| **Laravel Breeze** | Scaffolding autentikasi |
| **Laravel Sanctum** | Autentikasi token API |
| **Ziggy** | Berbagi route Laravel ke JavaScript |

### Payment Gateway
| Teknologi | Fungsi |
|:---|:---|
| **Midtrans Snap** | Pembayaran digital (QRIS, Transfer Bank) |
| **Midtrans Webhook** | Pembaruan status pembayaran asinkron |

### Database & Infrastruktur
| Teknologi | Fungsi |
|:---|:---|
| **MySQL** | Database utama (produksi) |
| **SQLite** | Database ringan (pengembangan lokal) |
| **Docker** | Deployment terkontainerisasi |
| **Railway** | Platform hosting cloud |

### Alat Pengembangan
| Teknologi | Fungsi |
|:---|:---|
| **Vite 8** | Build tool frontend dengan HMR |
| **Pest PHP** | Framework testing |
| **Laravel Pint** | Perbaikan gaya kode |
| **Laravel Pail** | Penampil log real-time |

---

## 🏗️ Arsitektur

Aplikasi ini menggunakan **arsitektur SPA monolitik** yang didukung oleh Inertia.js — tanpa REST API terpisah untuk frontend.

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│         React + TypeScript + Tailwind           │
└──────────────────────┬──────────────────────────┘
                       │ Inertia.js (XHR)
┌──────────────────────▼──────────────────────────┐
│              Aplikasi Laravel                   │
│                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────┐  │
│  │ Middleware   │→ │ Controllers  │→ │ Models │  │
│  │ (Auth+Role)  │  │ Owner/Kasir/ │  │ (ORM)  │  │
│  │              │  │ Pelanggan    │  │        │  │
│  └─────────────┘  └──────────────┘  └───┬────┘  │
│                                         │       │
│  ┌──────────────────────────────────────▼────┐  │
│  │        Database MySQL / SQLite            │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────┐                  │
│  │  API Route (Webhook Saja) │ ← Midtrans POST  │
│  │  /api/payment-callback    │                  │
│  └───────────────────────────┘                  │
└─────────────────────────────────────────────────┘
```

**Keputusan arsitektur utama:**
- **Inertia.js** menghilangkan kebutuhan REST API — controller mengembalikan respons Inertia langsung ke komponen React
- **Routing berbasis peran** — Route dikelompokkan berdasarkan aktor (`owner/`, `kasir/`, `customer/`) dengan penegakan middleware
- **Webhook Midtrans** adalah satu-satunya endpoint API sesungguhnya (`/api/payment-callback`) untuk notifikasi pembayaran asinkron
- **Pessimistic locking** pada operasi yang sensitif terhadap stok mencegah race condition

---

## 📂 Struktur Proyek

```
BurjoMinangRm/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Owner/          # Dashboard, Laporan, Ulasan, Akun
│   │   │   ├── Kasir/          # POS, CRUD Menu, Manajemen Pesanan
│   │   │   ├── Pelanggan/      # Pemesanan & ulasan pelanggan
│   │   │   └── Api/            # Handler webhook Midtrans
│   │   └── Middleware/
│   │       └── CheckRole.php   # Kontrol akses berbasis peran
│   └── Models/                 # User, Menu, Order, OrderItem, Payment, Review
├── database/
│   ├── migrations/             # 18 file migrasi
│   └── seeders/                # Akun default, data menu, data demo
├── resources/js/
│   ├── Components/             # Komponen UI yang reusable
│   ├── Layouts/                # Layout Owner, Customer, Guest, Auth
│   └── Pages/
│       ├── LandingPage.tsx     # Landing page publik
│       ├── Owner/              # Dashboard, Laporan, Ulasan, Akun
│       ├── Kasir/              # Dashboard, POS, Menu, Pesanan
│       ├── Customer/           # Jelajah menu, Riwayat pesanan
│       ├── Auth/               # Login, Register, Reset password
│       └── Profile/            # Manajemen profil pengguna
├── routes/
│   ├── web.php                 # Semua route Inertia (dikelompokkan per peran)
│   ├── api.php                 # Endpoint webhook Midtrans
│   └── console.php             # Scheduled auto-cancel pesanan kedaluwarsa
├── config/
│   └── midtrans.php            # Konfigurasi payment gateway Midtrans
├── docker/
│   └── entrypoint.sh           # Script startup produksi
├── Dockerfile                  # Build multi-stage (Node + PHP)
└── package.json
```

---

## ⚙️ Instalasi & Pengaturan

### Prasyarat

- **PHP** >= 8.3
- **Composer** >= 2.x
- **Node.js** >= 20.x
- **npm** >= 9.x
- **MySQL** 8.x (produksi) atau **SQLite** (pengembangan lokal)

### Mulai Cepat

```bash
# 1. Clone repositori
git clone https://github.com/wawanpi/Burjo_minang.git
cd Burjo_minang

# 2. Install dependensi PHP
composer install

# 3. Install dependensi Node.js
npm install

# 4. Konfigurasi environment
cp .env.example .env
php artisan key:generate
```

### Pengaturan Database

Untuk **SQLite** (default, direkomendasikan untuk pengembangan lokal):

```bash
# Default .env.example menggunakan SQLite — tidak perlu konfigurasi tambahan
php artisan migrate --seed
```

Untuk **MySQL** (produksi):

```env
# Perbarui nilai-nilai berikut di file .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=burjo_minang
DB_USERNAME=root
DB_PASSWORD=password_anda
```

```bash
# Buat database terlebih dahulu, lalu jalankan migrasi
php artisan migrate --seed
```

Seeder membuat tiga akun default:

| Peran | Email | Password |
|:---|:---|:---|
| Owner | `owner@burjominang.com` | `password123` |
| Kasir | `kasir@burjominang.com` | `password123` |
| Pelanggan | `pelanggan@gmail.com` | `password123` |

### Menjalankan Server Development

Anda membutuhkan **dua terminal** yang berjalan bersamaan:

```bash
# Terminal 1 — Backend Laravel
php artisan serve

# Terminal 2 — Frontend Vite (HMR)
npm run dev
```

Atau gunakan perintah concurrent bawaan:

```bash
# Menjalankan server Laravel, queue worker, log viewer, dan Vite secara bersamaan
composer dev
```

Aplikasi akan tersedia di `http://localhost:8000`.

---

## 🔐 Environment Variables

| Variabel | Deskripsi | Wajib |
|:---|:---|:---:|
| `APP_KEY` | Kunci enkripsi aplikasi Laravel | ✅ |
| `DB_CONNECTION` | Driver database (`sqlite` atau `mysql`) | ✅ |
| `DB_HOST` | Host database | MySQL saja |
| `DB_PORT` | Port database | MySQL saja |
| `DB_DATABASE` | Nama database | MySQL saja |
| `DB_USERNAME` | Username database | MySQL saja |
| `DB_PASSWORD` | Password database | MySQL saja |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans untuk pemrosesan pembayaran | Untuk pembayaran |
| `MIDTRANS_CLIENT_KEY` | Client key Midtrans untuk Snap.js | Untuk pembayaran |
| `MIDTRANS_IS_PRODUCTION` | Environment Midtrans (`true` / `false`) | Untuk pembayaran |
| `MIDTRANS_PAYMENT_EXPIRY_MINUTES` | Durasi kedaluwarsa pembayaran dalam menit (default: 5) | Opsional |
| `VITE_MIDTRANS_CLIENT_KEY` | Client key yang diekspos ke frontend | Untuk pembayaran |
| `VITE_MIDTRANS_IS_PRODUCTION` | Flag produksi yang diekspos ke frontend | Untuk pembayaran |
| `EMAIL_VERIFICATION_ENABLED` | Aktifkan verifikasi email (`true` / `false`) | Opsional |

---

## 🧪 Testing

Proyek ini menggunakan **Pest PHP** sebagai framework testing. Test mencakup alur autentikasi dan manajemen profil:

```bash
# Jalankan semua test
php artisan test

# Atau menggunakan Pest secara langsung
./vendor/bin/pest
```

---

## 🚀 Deployment

Aplikasi ini dikonfigurasi untuk deployment di **Railway** menggunakan Docker.

### Docker Build

Dockerfile menggunakan proses build multi-stage:

1. **Stage 1 (Node.js)** — Mengompilasi aset frontend React/Vite
2. **Stage 2 (PHP 8.3)** — Menjalankan Laravel dengan aset yang sudah dikompilasi

```bash
# Build Docker image
docker build -t burjo-minang .

# Jalankan container
docker run -p 8080:8080 --env-file .env burjo-minang
```

Script `docker/entrypoint.sh` secara otomatis menangani:
- Pembuatan symlink storage
- Caching konfigurasi dan view
- Migrasi database
- Seeding akun default

### Deployment Railway

Proyek ini sudah dikonfigurasi untuk Railway:
- Railway mendeteksi `Dockerfile` secara otomatis
- Environment variables diatur melalui dashboard Railway
- Variabel `$PORT` di-inject secara otomatis saat runtime

---



---


---

## 📄 Lisensi

Proyek ini belum memiliki file lisensi di root repositori.

> 💡 Pertimbangkan untuk menambahkan file `LICENSE` (misalnya MIT) untuk memperjelas ketentuan penggunaan pada portfolio Anda.

---

## 🙏 Penghargaan

- [Laravel](https://laravel.com) — Framework web PHP
- [React](https://react.dev) — Library UI
- [Inertia.js](https://inertiajs.com) — The Modern Monolith
- [Midtrans](https://midtrans.com) — Payment gateway
- [Tailwind CSS](https://tailwindcss.com) — Framework CSS utility-first
- [Railway](https://railway.app) — Platform deployment cloud
