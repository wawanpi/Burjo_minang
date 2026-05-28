<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Schedule::call(function () {
    $expiredOrders = \App\Models\Order::with(['orderItems', 'payment'])
        ->where('tipe_pesanan', 'online')
        ->where('status_pesanan', 'menunggu_pembayaran')
        ->where('created_at', '<=', \Carbon\Carbon::now()->subMinutes(15))
        ->get();

    foreach ($expiredOrders as $order) {
        \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
            $order->update(['status_pesanan' => 'batal']);

            if ($order->payment) {
                $order->payment->update(['status_pembayaran' => 'expired']);
            }

            foreach ($order->orderItems as $item) {
                $menu = \App\Models\Menu::lockForUpdate()->find($item->menu_id);
                if ($menu) {
                    $menu->increment('stok', $item->jumlah);
                }
            }
        });
    }
})->everyMinute()->name('cancel-expired-orders')->withoutOverlapping();
