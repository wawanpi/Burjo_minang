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
            },
        },
    },

    plugins: [forms],
};
