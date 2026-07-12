<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bug #2 — Menambahkan soft delete pada tabel menus.
 *
 * Sebelumnya MenuController@destroy melakukan hard delete, dan FK
 * order_items.menu_id memakai cascadeOnDelete() sehingga menghapus menu
 * ikut menghapus rincian transaksi historis. Dengan soft delete, menu yang
 * "dihapus" hanya ditandai deleted_at (dinonaktifkan) tanpa memicu cascade
 * fisik, sehingga riwayat order_items tetap utuh untuk laporan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
