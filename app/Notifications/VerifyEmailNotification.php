<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notifikasi kustom untuk verifikasi email.
 *
 * Mengirim email berisi link verifikasi dengan branding Burjo Minang dan
 * pesan dalam Bahasa Indonesia, senada dengan email reset password.
 *
 * Sengaja TIDAK implements ShouldQueue agar terkirim sinkron (langsung),
 * karena environment produksi (Railway) tidak menjalankan queue worker.
 */
class VerifyEmailNotification extends BaseVerifyEmail
{
    /**
     * Bangun pesan email verifikasi.
     */
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('Verifikasi Email — Burjo Minang')
            ->greeting('Halo, selamat datang di Burjo Minang!')
            ->line('Terima kasih telah mendaftar. Satu langkah lagi untuk mengaktifkan akun Anda.')
            ->line('Klik tombol di bawah ini untuk memverifikasi alamat email Anda:')
            ->action('Verifikasi Email Saya', $url)
            ->line('Jika Anda tidak merasa membuat akun ini, abaikan saja email ini.')
            ->salutation('Salam hangat, Tim Burjo Minang');
    }
}
