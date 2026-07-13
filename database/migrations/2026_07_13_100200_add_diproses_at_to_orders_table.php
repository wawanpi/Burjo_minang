<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bug E-3 — Menambahkan kolom diproses_at pada tabel orders.
 *
 * Menyimpan waktu saat pesanan MULAI diproses (pembayaran dikonfirmasi),
 * agar timer "durasi berjalan" (durasi_menit) dihitung sejak diproses,
 * bukan sejak checkout (created_at) yang termasuk jeda menunggu_pembayaran.
 * Nullable: order lama bernilai null → durasi_menit fallback ke created_at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('diproses_at')->nullable()->after('waktu_pengambilan');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('diproses_at');
        });
    }
};
