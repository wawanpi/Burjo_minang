<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bug #3 — Menambahkan soft delete pada tabel users.
 *
 * Sebelumnya AccountController@destroy melakukan hard delete, dan FK
 * orders.user_id memakai cascadeOnDelete() sehingga menghapus akun pelanggan
 * ikut menghapus seluruh orders → order_items → payments miliknya, membuat
 * total pendapatan pada laporan berkurang. Dengan soft delete, akun cukup
 * dinonaktifkan (deleted_at terisi) tanpa memicu cascade fisik; data transaksi
 * historis tetap utuh. Akun yang di-soft-delete otomatis tidak bisa login
 * (global scope SoftDeletes mengecualikannya dari query autentikasi).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
