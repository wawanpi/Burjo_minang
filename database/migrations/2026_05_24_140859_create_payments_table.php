<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->enum('metode_pembayaran', ['Tunai', 'QRIS', 'Transfer Bank', 'E-Wallet']);
            $table->enum('status_pembayaran', ['pending', 'lunas', 'gagal', 'kadaluarsa'])
                  ->default('pending');
            $table->string('payment_token')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('payment_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
