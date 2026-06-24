import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.tsx',
        './resources/js/**/*.ts',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                serif: ['"Playfair Display"', ...defaultTheme.fontFamily.serif],
            },
            colors: {
                brand: {
                    900: '#5A0000',
                    800: '#7A0000',
                    700: '#990000',
                    600: '#B31B1B',
                    500: '#CC3333',
                    50:  '#FFF5F5',
                },
                gold: {
                    400: '#D4A853',
                    500: '#C49B3D',
                    600: '#A8832F',
                },
                cream: '#FFF8F0',

                /* ── Burjo Minang Design System (panel) ─────────────────── */
                bm: {
                    'charcoal-900': '#1F2730',
                    'charcoal-800': '#2C353F',
                    'charcoal-700': '#3A4350',
                    'maroon-900': '#5A0000',
                    'maroon-800': '#7A0000',
                    'maroon-700': '#990000',
                    'red-700': '#991B1B',
                    'red-600': '#B91C1C',
                    'red-500': '#DC2626',
                    'red-50':  '#FEF2F2',
                    'gold-500': '#EAB308',
                    'gold-400': '#FACC15',
                    'gold-300': '#FDE047',
                    'gold-100': '#FEF9C3',
                    'cream':   '#FAF7F2',
                    'ivory':   '#F9FAFB',
                    'text-dark':  '#1F2937',
                    'text-muted': '#6B7280',
                    'success': '#16A34A',
                    'warning': '#F59E0B',
                    'info':    '#0EA5E9',
                },
            },
            boxShadow: {
                soft:        '0 2px 8px rgba(31, 39, 48, 0.06)',
                elevated:    '0 12px 32px rgba(31, 39, 48, 0.12)',
                'gold-glow': '0 0 0 1px rgba(250, 204, 21, 0.45), 0 8px 24px rgba(234, 179, 8, 0.18)',
            },
            keyframes: {
                fadeInUp: {
                    '0%':   { opacity: '0', transform: 'translateY(40px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInLeft: {
                    '0%':   { opacity: '0', transform: 'translateX(-60px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInRight: {
                    '0%':   { opacity: '0', transform: 'translateX(60px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%':   { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%':      { transform: 'translateY(-10px)' },
                },
                toastIn: {
                    '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                slideUp: {
                    '0%':   { opacity: '0', transform: 'translateY(100%)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                /* ── Panel design-system animations ─────────────────────── */
                pageEnter: {
                    '0%':   { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%':   { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                pulseDot: {
                    '0%':   { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.45)' },
                    '70%':  { boxShadow: '0 0 0 6px rgba(34, 197, 94, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' },
                },
                starPop: {
                    '0%':   { opacity: '0', transform: 'scale(0.4)' },
                    '60%':  { opacity: '1', transform: 'scale(1.25)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                'fade-in-up':      'fadeInUp 0.8s ease-out forwards',
                'fade-in-up-slow': 'fadeInUp 1s ease-out 0.2s forwards',
                'fade-in-up-slower':'fadeInUp 1.2s ease-out 0.4s forwards',
                'fade-in':         'fadeIn 0.8s ease-out forwards',
                'fade-in-slow':    'fadeIn 1.2s ease-out forwards',
                'slide-in-left':   'slideInLeft 0.8s ease-out forwards',
                'slide-in-right':  'slideInRight 0.8s ease-out forwards',
                'scale-in':        'scaleIn 0.6s ease-out forwards',
                'float':           'float 4s ease-in-out infinite',
                'toast-in':        'toastIn 0.3s ease-out forwards',
                'slide-up':        'slideUp 0.4s ease-out forwards',
                'page-enter':      'pageEnter 0.4s ease-out forwards',
                'shimmer':         'shimmer 1.5s infinite',
                'pulse-dot':       'pulseDot 1.8s ease-out infinite',
                'star-pop':        'starPop 0.5s ease-out backwards',
            },
        },
    },

    plugins: [forms],
};
