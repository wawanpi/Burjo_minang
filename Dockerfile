# syntax=docker/dockerfile:1

# ============================================================
# Stage 1 — Build aset frontend (Vite / React)
# SSR dinonaktifkan: cukup build entry app.jsx saja.
# ============================================================
FROM node:20-alpine AS assets
WORKDIR /app

COPY package.json package-lock.json ./
# --legacy-peer-deps: project pakai vite@8 sedangkan @vitejs/plugin-react
# belum mendukungnya secara resmi (konflik peer dependency). Sama seperti
# kondisi node_modules lokal yang sudah berjalan normal.
RUN npm ci --legacy-peer-deps

COPY . .

# Variabel VITE_* "dibakar" ke bundle saat build, jadi harus ada di tahap ini.
# Railway meneruskan service variable menjadi build-arg secara otomatis.
ARG VITE_APP_NAME="Burjo Minang RM"
ARG VITE_MIDTRANS_CLIENT_KEY
ARG VITE_MIDTRANS_IS_PRODUCTION=false
ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_MIDTRANS_CLIENT_KEY=$VITE_MIDTRANS_CLIENT_KEY \
    VITE_MIDTRANS_IS_PRODUCTION=$VITE_MIDTRANS_IS_PRODUCTION

# Build hanya bundle client (bukan --ssr)
RUN npx vite build

# ============================================================
# Stage 2 — Runtime PHP 8.3 (Laravel)
# ============================================================
FROM php:8.3-cli-alpine AS app

# --- System deps + PHP extensions yang dibutuhkan Laravel + MySQL ---
RUN apk add --no-cache \
        bash \
        git \
        unzip \
        libpng \
        libzip \
        icu-libs \
        oniguruma \
    && apk add --no-cache --virtual .build-deps \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        icu-dev \
        oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        bcmath \
        gd \
        intl \
        zip \
        pcntl \
    && apk del .build-deps

# --- Composer ---
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install dependency PHP dulu (memanfaatkan cache layer)
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-interaction \
        --prefer-dist \
        --no-scripts \
        --no-autoloader

# Salin seluruh source aplikasi
COPY . .

# Salin hasil build Vite dari stage 1
COPY --from=assets /app/public/build ./public/build

# Optimasi autoloader + permission storage
RUN composer dump-autoload --optimize --no-dev \
    && chmod -R 775 storage bootstrap/cache

# Entrypoint (migrasi + cache config + jalankan server)
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Railway meng-inject $PORT saat runtime
EXPOSE 8080
ENTRYPOINT ["entrypoint"]
