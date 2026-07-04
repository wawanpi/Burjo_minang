<?php

namespace Tests\Support;

/**
 * Stream wrapper untuk men-stub isi `php://input` selama pengujian.
 *
 * SDK Midtrans (\Midtrans\Notification) membaca body notifikasi via
 * `file_get_contents('php://input')`. Pada Laravel Feature Test, body tidak
 * mengalir ke php://input sehingga SDK menerima null. Wrapper ini menyuntikkan
 * body JSON tiruan HANYA untuk path `php://input`; path php:// lain
 * (temp/memory/stdout/stderr/output) didelegasikan ke wrapper bawaan agar
 * perilaku Laravel tidak terganggu.
 *
 * Pola pemakaian (lihat helper withPhpInput() di bawah):
 *   PhpInputStub::enable('{"transaction_id":"x"}');
 *   ... jalankan request ...
 *   PhpInputStub::disable();
 */
class PhpInputStub
{
    /** @var string Body yang dikembalikan untuk php://input */
    public static string $content = '';

    /** @var bool Apakah wrapper sedang aktif terpasang */
    private static bool $registered = false;

    private int $position = 0;

    /** @var resource|null Handle asli untuk delegasi path php:// non-input */
    private $delegate = null;

    /** @var resource Konteks stream (diisi PHP otomatis) */
    public $context;

    public static function enable(string $content): void
    {
        self::$content = $content;
        if (! self::$registered) {
            stream_wrapper_unregister('php');
            stream_wrapper_register('php', self::class);
            self::$registered = true;
        }
    }

    public static function disable(): void
    {
        if (self::$registered) {
            stream_wrapper_restore('php');
            self::$registered = false;
        }
        self::$content = '';
    }

    private function isInput(string $path): bool
    {
        return strtolower($path) === 'php://input';
    }

    private function openRealDelegate(string $path, string $mode)
    {
        // Sementara kembalikan wrapper bawaan agar bisa membuka stream php:// asli.
        stream_wrapper_restore('php');
        $this->delegate = @fopen($path, $mode);
        stream_wrapper_unregister('php');
        stream_wrapper_register('php', self::class);

        return $this->delegate !== false;
    }

    public function stream_open($path, $mode, $options, &$opened_path): bool
    {
        if ($this->isInput($path)) {
            $this->position = 0;
            $this->delegate = null;

            return true;
        }

        return $this->openRealDelegate($path, $mode);
    }

    public function stream_read($count)
    {
        if ($this->delegate) {
            return fread($this->delegate, $count);
        }

        $chunk = substr(self::$content, $this->position, $count);
        $this->position += strlen($chunk);

        return $chunk;
    }

    public function stream_write($data)
    {
        return $this->delegate ? fwrite($this->delegate, $data) : 0;
    }

    public function stream_eof(): bool
    {
        if ($this->delegate) {
            return feof($this->delegate);
        }

        return $this->position >= strlen(self::$content);
    }

    public function stream_tell(): int
    {
        return $this->delegate ? ftell($this->delegate) : $this->position;
    }

    public function stream_seek($offset, $whence = SEEK_SET): bool
    {
        if ($this->delegate) {
            return fseek($this->delegate, $offset, $whence) === 0;
        }

        switch ($whence) {
            case SEEK_SET: $this->position = $offset; break;
            case SEEK_CUR: $this->position += $offset; break;
            case SEEK_END: $this->position = strlen(self::$content) + $offset; break;
            default: return false;
        }

        return true;
    }

    public function stream_stat()
    {
        return $this->delegate ? fstat($this->delegate) : [];
    }

    public function stream_set_option($option, $arg1, $arg2): bool
    {
        return false;
    }

    public function stream_close(): void
    {
        if ($this->delegate) {
            fclose($this->delegate);
            $this->delegate = null;
        }
    }
}
