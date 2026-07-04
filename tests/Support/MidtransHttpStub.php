<?php

/**
 * Test double untuk memutus panggilan HTTP (cURL) ke server Midtrans.
 *
 * SDK Midtrans (vendor/midtrans/midtrans-php) memiliki seam pengujian bawaan di
 * ApiRequestor::remoteCall():
 *
 *     if (class_exists('\Midtrans\MT_Tests') && MT_Tests::$stubHttp) {
 *         $result = self::processStubed(...);  // kembalikan MT_Tests::$stubHttpResponse
 *     } else {
 *         $result = curl_exec($ch);            // panggilan jaringan sungguhan
 *     }
 *
 * Dengan mendeklarasikan kelas \Midtrans\MT_Tests ini (khusus untuk pengujian,
 * TIDAK mengubah logika aplikasi) dan menyalakan $stubHttp, seluruh panggilan
 * Snap::createTransaction() dan Transaction::status() (dipakai oleh
 * \Midtrans\Notification) akan mengembalikan respons palsu yang kita tentukan,
 * sehingga uji black-box webhook & inisiasi pembayaran dapat berjalan offline
 * dan deterministik.
 *
 * Antarmuka properti statis dicocokkan dengan MT_Tests bawaan SDK.
 */

namespace Midtrans;

if (! class_exists(MT_Tests::class, false)) {
    class MT_Tests
    {
        /** Aktifkan/nonaktifkan mode stub. */
        public static $stubHttp = false;

        /** String JSON yang dikembalikan sebagai "respons" Midtrans. */
        public static $stubHttpResponse;

        /** Kode status (tidak dipakai remoteCall, disediakan agar kompatibel). */
        public static $stubHttpStatus;

        /** Menyimpan detail request terakhir untuk keperluan inspeksi. */
        public static $lastHttpRequest;

        public static function reset(): void
        {
            self::$stubHttp = false;
            self::$stubHttpResponse = null;
            self::$stubHttpStatus = null;
            self::$lastHttpRequest = null;
        }
    }
}

namespace Tests\Support;

use Midtrans\MT_Tests;

/**
 * Helper prosedural untuk mengaktifkan stub dengan payload tertentu.
 */
final class MidtransHttpStub
{
    /**
     * Aktifkan stub agar SDK Midtrans mengembalikan $payload (array → JSON).
     */
    public static function fake(array $payload): void
    {
        MT_Tests::$stubHttp = true;
        MT_Tests::$stubHttpResponse = json_encode($payload);
    }

    /** Matikan & bersihkan stub. */
    public static function reset(): void
    {
        MT_Tests::reset();
    }
}
