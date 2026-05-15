<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('tanggal_pesan')->nullable()->useCurrent();
            $table->decimal('total_harga', 10, 2);
            $table->enum('status_pembayaran', ['pending', 'lunas', 'batal', 'kadaluarsa'])
                  ->default('pending');
            $table->enum('metode_pembayaran', ['Tunai', 'QRIS', 'Transfer Bank', 'E-Wallet']);
            $table->string('payment_token')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('payment_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};