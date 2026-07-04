#!/usr/bin/env bash
set -e

echo "==> Menyiapkan aplikasi Laravel..."

# Symlink storage -> public/storage (untuk file upload). Aman kalau sudah ada.
php artisan storage:link || true

# Cache konfigurasi & view untuk performa produksi.
# CATATAN: route:cache SENGAJA TIDAK dipakai karena ada closure di routes/web.php.
php artisan config:cache
php artisan view:cache

# Jalankan migrasi database (butuh env DB_* sudah diset di Railway).
echo "==> Menjalankan migrasi database..."
php artisan migrate --force

# Jalankan web server. Railway menyediakan $PORT secara otomatis.
echo "==> Menjalankan server di port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
