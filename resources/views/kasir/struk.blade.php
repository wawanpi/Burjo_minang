<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=58mm">
    <title>Struk #{{ $order->id }}</title>
    <style>
        /* ─── Reset & Thermal Print Styling ─── */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 58mm;
            max-width: 58mm;
            color: #000;
            background: #fff;
            padding: 4mm 2mm;
        }
        .center { text-align: center; }
        .right  { text-align: right; }
        .bold   { font-weight: bold; }
        .divider {
            border: none;
            border-top: 1px dashed #000;
            margin: 4px 0;
        }
        .header-title {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .header-sub {
            font-size: 10px;
            color: #444;
            margin-top: 2px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td {
            vertical-align: top;
            padding: 2px 0;
            font-size: 12px;
        }
        .item-name { max-width: 60%; }
        .item-qty  { text-align: center; width: 15%; }
        .item-price { text-align: right; width: 25%; }
        .total-row td {
            font-size: 14px;
            font-weight: bold;
            padding-top: 4px;
        }
        .footer {
            margin-top: 8px;
            font-size: 10px;
            color: #666;
            text-align: center;
        }

        @media print {
            body { width: 58mm; padding: 0 1mm; }
            @page { margin: 0; size: 58mm auto; }
        }
    </style>
</head>
<body>
    {{-- ── Header Restoran ── --}}
    <div class="center">
        <div class="header-title">BURJO MINANG</div>
        <div class="header-sub">Jl. Contoh Alamat No. 123</div>
        <div class="header-sub">Telp: 0812-3456-7890</div>
    </div>

    <hr class="divider">

    {{-- ── Info Order ── --}}
    <table>
        <tr>
            <td>No. Order</td>
            <td class="right bold">#ORD-{{ str_pad($order->id, 4, '0', STR_PAD_LEFT) }}</td>
        </tr>
        <tr>
            <td>Tanggal</td>
            <td class="right">{{ \Carbon\Carbon::parse($order->tanggal_pesan)->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td>Kasir</td>
            <td class="right">{{ $kasir->name }}</td>
        </tr>
        <tr>
            <td>Tipe</td>
            <td class="right">{{ ucfirst($order->tipe_pesanan) }}</td>
        </tr>
        @if($order->user)
        <tr>
            <td>Pelanggan</td>
            <td class="right">{{ $order->user->name }}</td>
        </tr>
        @endif
        <tr>
            <td>Pembayaran</td>
            <td class="right">{{ $order->payment ? ucfirst(str_replace('_', ' ', $order->payment->metode_pembayaran)) : '-' }}</td>
        </tr>
    </table>

    <hr class="divider">

    {{-- ── Daftar Item ── --}}
    <table>
        <tr style="border-bottom: 1px dashed #000;">
            <td class="bold">Item</td>
            <td class="bold item-qty">Qty</td>
            <td class="bold item-price">Harga</td>
        </tr>
        @foreach($order->orderItems as $item)
        <tr>
            <td class="item-name">{{ $item->menu->nama_menu ?? 'Item' }}</td>
            <td class="item-qty">{{ $item->jumlah }}</td>
            <td class="item-price">{{ number_format($item->subtotal, 0, ',', '.') }}</td>
        </tr>
        @endforeach
    </table>

    <hr class="divider">

    {{-- ── Total ── --}}
    <table>
        <tr class="total-row">
            <td>TOTAL</td>
            <td class="right">Rp {{ number_format($order->total_harga, 0, ',', '.') }}</td>
        </tr>
    </table>

    <hr class="divider">

    {{-- ── Footer ── --}}
    <div class="footer">
        <p>Status: {{ ucfirst(str_replace('_', ' ', $order->status_pesanan)) }}</p>
        <p style="margin-top: 4px;">Terima kasih sudah memesan!</p>
        <p>~ Burjo Minang ~</p>
    </div>

    {{-- ── Auto Print & Close ── --}}
    <script>
        window.onload = function() {
            window.print();
            // Tutup tab setelah dialog print ditutup
            setTimeout(function() { window.close(); }, 500);
        };
    </script>
</body>
</html>
