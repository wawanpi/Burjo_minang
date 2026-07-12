<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('code') — Burjo Minang RM</title>
    <style>
        :root {
            --merah: #8B1E1E;
            --merah-tua: #6d1717;
            --amber: #E8A33D;
            --krem: #FBF6EF;
            --teks: #2b2320;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, var(--krem) 0%, #f3e4cf 100%);
            color: var(--teks);
        }
        .kartu {
            width: 100%;
            max-width: 460px;
            background: #fff;
            border-radius: 18px;
            padding: 40px 32px;
            text-align: center;
            box-shadow: 0 18px 40px rgba(109, 23, 23, 0.15);
            border-top: 6px solid var(--merah);
        }
        .lencana {
            display: inline-block;
            font-size: 13px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--amber);
            font-weight: 700;
            margin-bottom: 8px;
        }
        .kode {
            font-size: 84px;
            line-height: 1;
            font-weight: 800;
            color: var(--merah);
            margin-bottom: 12px;
        }
        .judul { font-size: 22px; font-weight: 700; margin-bottom: 10px; }
        .pesan { font-size: 15px; color: #6b5f57; line-height: 1.6; margin-bottom: 28px; }
        .tombol {
            display: inline-block;
            background: var(--merah);
            color: #fff;
            text-decoration: none;
            padding: 12px 26px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            transition: background .2s ease;
        }
        .tombol:hover { background: var(--merah-tua); }
        .footer { margin-top: 26px; font-size: 12px; color: #a99c90; }
        @media (max-width: 420px) { .kode { font-size: 64px; } }
    </style>
</head>
<body>
    <div class="kartu">
        <div class="lencana">Burjo Minang RM</div>
        <div class="kode">@yield('code')</div>
        <div class="judul">@yield('judul')</div>
        <p class="pesan">@yield('pesan')</p>
        <a href="{{ url('/') }}" class="tombol">Kembali ke Beranda</a>
        <div class="footer">Cita Rasa Autentik Minang</div>
    </div>
</body>
</html>
