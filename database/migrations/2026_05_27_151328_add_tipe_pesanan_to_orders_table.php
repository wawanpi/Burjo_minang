<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('tipe_pesanan', ['online', 'dine_in', 'take_away'])->default('dine_in')->after('total_harga');
            $table->timestamp('waktu_pengambilan')->nullable()->after('tipe_pesanan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['tipe_pesanan', 'waktu_pengambilan']);
        });
    }
};
