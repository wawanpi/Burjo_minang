<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cetak Laporan Keuangan — Burjo Minang RM</title>
    <style>
        /* ── Reset & Base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
            background: #fff;
            padding: 24px;
            line-height: 1.5;
        }

        /* ── Header ── */
        .print-header {
            text-align: center;
            border-bottom: 2px solid #d97706;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .print-header h1 {
            font-size: 20px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 4px;
        }
        .print-header p {
            font-size: 12px;
            color: #6b7280;
        }

        /* ── Info Box ── */
        .info-box {
            display: flex;
            justify-content: space-between;
            background: #fffbeb;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 12px;
        }
        .info-box .label { color: #92400e; font-weight: 600; }
        .info-box .value { font-weight: 700; color: #78350f; font-size: 14px; }

        /* ── Table ── */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        thead th {
            background: #f9fafb;
            border-bottom: 2px solid #e5e7eb;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        tbody td {
            padding: 8px 10px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 12px;
            color: #374151;
        }
        tbody tr:hover { background: #f9fafb; }

        /* Tipe Pesanan Badges */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
        }
        .badge-dine_in   { background: #dbeafe; color: #1e40af; }
        .badge-take_away  { background: #fef3c7; color: #92400e; }
        .badge-online     { background: #d1fae5; color: #065f46; }

        /* ── Total Row ── */
        .total-row td {
            font-weight: 700;
            font-size: 13px;
            border-top: 2px solid #e5e7eb;
            border-bottom: none;
            padding-top: 10px;
        }

        /* ── Footer ── */
        .print-footer {
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
        }

        /* ── Angka rata kanan ── */
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* ── Print Styles ── */
        @media print {
            body { padding: 0; }
            @page { margin: 15mm; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="print-header">
        <h1>📊 Laporan Keuangan — Burjo Minang RM</h1>
        <p>
            Periode:
            @if($dari && $sampai)
                {{ \Carbon\Carbon::parse($dari)->format('d M Y') }} — {{ \Carbon\Carbon::parse($sampai)->format('d M Y') }}
            @elseif($dari)
                Dari {{ \Carbon\Carbon::parse($dari)->format('d M Y') }}
            @elseif($sampai)
                Sampai {{ \Carbon\Carbon::parse($sampai)->format('d M Y') }}
            @else
                Seluruh Periode
            @endif
            &nbsp;&middot;&nbsp; Tipe: <strong>{{ $tipeLabel }}</strong>
            &nbsp;&middot;&nbsp; Semua transaksi <strong>Lunas</strong>
        </p>
        <p style="margin-top:4px; font-size:11px;">
            Dicetak: {{ now()->timezone('Asia/Jakarta')->format('d M Y, H:i') }} WIB
        </p>
    </div>

    <!-- Info Box -->
    <div class="info-box">
        <div>
            <span class="label">Total Pendapatan</span>
        </div>
        <div>
            <span class="value">Rp {{ number_format($totalPendapatan, 0, ',', '.') }}</span>
        </div>
    </div>

    <!-- Tabel Transaksi -->
    <table>
        <thead>
            <tr>
                <th style="width:40px;">#</th>
                <th>Pelanggan</th>
                <th>Tanggal</th>
                <th class="text-right">Total</th>
                <th>Metode</th>
                <th class="text-center">Tipe Pesanan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($orders as $i => $order)
                @php
                    $tipe = $order->tipe_pesanan ?? 'dine_in';
                    $tipeLabels = [
                        'dine_in'   => '🍽️ Dine In',
                        'take_away' => '🛍️ Take Away',
                        'online'    => '🌐 Online',
                    ];
                @endphp
                <tr>
                    <td style="color:#9ca3af;">{{ $i + 1 }}</td>
                    <td style="font-weight:500;">{{ $order->user->name ?? '—' }}</td>
                    <td>{{ $order->tanggal_pesan ? $order->tanggal_pesan->format('d M Y') : '—' }}</td>
                    <td class="text-right" style="font-weight:600;">
                        Rp {{ number_format($order->total_harga, 0, ',', '.') }}
                    </td>
                    <td>{{ $order->payment->metode_pembayaran ?? '-' }}</td>
                    <td class="text-center">
                        <span class="badge badge-{{ $tipe }}">{{ $tipeLabels[$tipe] ?? $tipe }}</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center" style="padding:32px; color:#9ca3af;">
                        Tidak ada data transaksi.
                    </td>
                </tr>
            @endforelse

            @if($orders->count() > 0)
                <tr class="total-row">
                    <td colspan="3" class="text-right">Total ({{ $orders->count() }} transaksi)</td>
                    <td class="text-right">
                        Rp {{ number_format($orders->sum('total_harga'), 0, ',', '.') }}
                    </td>
                    <td colspan="2"></td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Footer -->
    <div class="print-footer">
        <p>Dokumen ini digenerate otomatis oleh sistem Burjo Minang RM.</p>
    </div>

    <!-- Auto Print -->
    <script>
        window.addEventListener('DOMContentLoaded', function () {
            window.print();
        });
    </script>
</body>
</html>
