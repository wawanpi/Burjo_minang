<?php

namespace Tests\Support;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Testing\TestResponse;

// Muat test-double Midtrans (mendeklarasikan \Midtrans\MT_Tests & stream wrapper).
require_once __DIR__.'/MidtransHttpStub.php';
require_once __DIR__.'/PhpInputStub.php';

/**
 * Trait pendukung untuk seluruh berkas Black Box Test.
 *
 * Menyediakan:
 * - Pembuatan data uji (user per-peran, menu, order lengkap).
 * - Stub gateway Midtrans (Snap & Webhook Notification) agar uji berjalan
 *   offline tanpa memanggil jaringan dan tanpa mengubah logika aplikasi.
 */
trait BlackBoxSupport
{
    /** Bersihkan stub Midtrans setelah setiap test. */
    protected function tearDownBlackBoxStubs(): void
    {
        MidtransHttpStub::reset();
        PhpInputStub::disable();
    }

    // ─── Factory ringkas per-peran ──────────────────────────────────────────

    protected function owner(array $o = []): User
    {
        return User::factory()->create(array_merge(['role' => 'owner'], $o));
    }

    protected function kasir(array $o = []): User
    {
        return User::factory()->create(array_merge(['role' => 'kasir'], $o));
    }

    protected function pelanggan(array $o = []): User
    {
        return User::factory()->create(array_merge(['role' => 'pelanggan'], $o));
    }

    protected function makeMenu(array $o = []): Menu
    {
        return Menu::create(array_merge([
            'nama_menu' => 'Menu '.uniqid(),
            'kategori'  => 'Makanan',
            'harga'     => 10000,
            'stok'      => 100,
        ], $o));
    }

    /**
     * Buat order lengkap (order + 1 order_item + payment) untuk skenario tertentu.
     */
    protected function makeOrder(User $user, array $orderOverrides = [], array $paymentOverrides = [], ?Menu $menu = null, int $jumlah = 1): Order
    {
        $menu ??= $this->makeMenu();
        $subtotal = $menu->harga * $jumlah;

        $order = Order::create(array_merge([
            'user_id'        => $user->id,
            'total_harga'    => $subtotal,
            'status_pesanan' => 'menunggu_pembayaran',
            'tipe_pesanan'   => 'dine_in',
            'tanggal_pesan'  => now(),
        ], $orderOverrides));

        OrderItem::create([
            'order_id' => $order->id,
            'menu_id'  => $menu->id,
            'jumlah'   => $jumlah,
            'subtotal' => $subtotal,
        ]);

        Payment::create(array_merge([
            'order_id'          => $order->id,
            'metode_pembayaran' => 'QRIS',
            'status_pembayaran' => 'pending',
        ], $paymentOverrides));

        return $order->fresh();
    }

    // ─── Stub Midtrans Snap (inisiasi pembayaran) ───────────────────────────

    /**
     * Buat \Midtrans\Snap::createTransaction() mengembalikan token & url palsu.
     */
    protected function fakeMidtransSnap(string $token = 'snap-token-dummy', string $redirectUrl = 'https://app.sandbox.midtrans.com/snap/v2/vtweb/DUMMY'): void
    {
        MidtransHttpStub::fake([
            'token'        => $token,
            'redirect_url' => $redirectUrl,
        ]);
    }

    // ─── Stub Webhook Midtrans (Notification) ───────────────────────────────

    /**
     * Hitung signature_key ala Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey).
     * Disediakan agar payload uji menyerupai notifikasi asli (walau SDK versi ini
     * memverifikasi via server-to-server status, bukan signature lokal).
     */
    protected function midtransSignature(string $orderId, string $statusCode, string $grossAmount): string
    {
        $serverKey = env('MIDTRANS_SERVER_KEY', '');

        return hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);
    }

    /**
     * Kirim notifikasi webhook Midtrans ke endpoint aplikasi.
     *
     * $notif = payload "status transaksi" yang seolah-olah dikembalikan Midtrans
     * saat aplikasi memverifikasi ulang (Transaction::status). Stream php://input
     * di-stub agar SDK dapat membaca transaction_id.
     */
    protected function sendMidtransWebhook(array $notif): TestResponse
    {
        $notif['transaction_id'] = $notif['transaction_id'] ?? ('trx-'.uniqid());

        // Stub respons "status transaksi" dari Midtrans (memutus cURL).
        MidtransHttpStub::fake($notif);
        // Stub body php://input agar SDK Notification mendapat transaction_id.
        PhpInputStub::enable(json_encode(['transaction_id' => $notif['transaction_id']]));

        try {
            return $this->postJson('/api/payment-callback', ['transaction_id' => $notif['transaction_id']]);
        } finally {
            PhpInputStub::disable();
            MidtransHttpStub::reset();
        }
    }
}
