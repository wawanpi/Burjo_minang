<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom deskripsi ke tabel menus.
     */
    public function up(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->text('deskripsi')->nullable()->after('harga');
        });
    }

    /**
     * Menghapus kolom deskripsi dari tabel menus.
     */
    public function down(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->dropColumn('deskripsi');
        });
    }
};
