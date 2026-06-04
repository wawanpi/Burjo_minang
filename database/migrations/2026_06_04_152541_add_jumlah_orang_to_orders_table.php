<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom jumlah_orang ke tabel orders.
     * Kolom ini hanya diisi saat tipe_pesanan = 'dine_in'.
     * Nullable karena tidak relevan untuk pesanan 'take_away'.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Diletakkan setelah kolom tipe_pesanan agar urutan kolom rapi
            $table->unsignedTinyInteger('jumlah_orang')->nullable()->after('tipe_pesanan');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('jumlah_orang');
        });
    }
};
