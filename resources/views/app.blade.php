<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        @production
        <meta http-equiv="Content-Security-Policy" 
              content="
                script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com https://api.sandbox.midtrans.com https://api.midtrans.com;
                connect-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://api.sandbox.midtrans.com https://api.midtrans.com;
                frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com;
                style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com https://app.sandbox.midtrans.com https://app.midtrans.com;
                font-src 'self' https://fonts.bunny.net https://fonts.gstatic.com data:;
                img-src 'self' data: blob: https:;
                default-src 'self';
              ">
        @endproduction

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
