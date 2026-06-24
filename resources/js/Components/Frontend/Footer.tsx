// resources/js/Components/Frontend/Footer.tsx
// ─── Footer — Shared Component ──────────────────────────────────────────────
import { Link } from '@inertiajs/react';

const NAV_LINKS = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Menu', href: '#menu' },
    { label: 'Kontak', href: '#kontak' },
];

export default function Footer() {
    return (
        <footer id="kontak" className="bg-gray-950 text-white relative overflow-hidden">
            {/* Decorative top border */}
            <div className="h-1 bg-gradient-to-r from-[#7a0000] via-[#990000] to-yellow-400" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="mb-6">
                            <span className="font-serif text-2xl font-bold text-white tracking-wide leading-none block">
                                BURJO MINANG
                            </span>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="block h-px w-5 bg-yellow-400/60" />
                                <span className="text-[10px] tracking-[0.3em] uppercase text-yellow-400 font-medium leading-none">
                                    Cita Rasa Autentik
                                </span>
                                <span className="block h-px w-5 bg-yellow-400/60" />
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Menyajikan masakan Padang autentik dengan cinta dan tradisi sejak 2020.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-sm tracking-wider uppercase text-white/90 mb-6">
                            Navigasi
                        </h4>
                        <ul className="space-y-3">
                            {NAV_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-yellow-400 text-sm transition-colors duration-300 flex items-center gap-2 group"
                                    >
                                        <span className="w-1 h-1 bg-[#990000] rounded-full group-hover:bg-yellow-400 transition-colors duration-300" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold text-sm tracking-wider uppercase text-white/90 mb-6">
                            Kontak
                        </h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex items-start gap-3">
                                <svg
                                    className="w-5 h-5 text-[#990000] mt-0.5 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                Jl. Raya Padang No. 123,
                                <br />
                                Kota Padang, Sumatera Barat
                            </li>
                            <li className="flex items-center gap-3">
                                <svg
                                    className="w-5 h-5 text-[#990000] flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                                +62 812-3456-7890
                            </li>
                            <li className="flex items-center gap-3">
                                <svg
                                    className="w-5 h-5 text-[#990000] flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                info@burjominang.com
                            </li>
                        </ul>
                    </div>

                    {/* Hours & Social */}
                    <div>
                        <h4 className="font-semibold text-sm tracking-wider uppercase text-white/90 mb-6">
                            Jam Buka
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-400 mb-8">
                            <li className="flex justify-between">
                                <span>Senin - Jumat</span>
                                <span className="text-white/70 font-medium">08:00 - 22:00</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Sabtu - Minggu</span>
                                <span className="text-white/70 font-medium">07:00 - 23:00</span>
                            </li>
                        </ul>

                        <h4 className="font-semibold text-sm tracking-wider uppercase text-white/90 mb-4">
                            Ikuti Kami
                        </h4>
                        <div className="flex gap-3">
                            {/* Instagram */}
                            <Link
                                href="#"
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#990000] border border-white/10 hover:border-[#990000] flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                                aria-label="Instagram"
                            >
                                <svg
                                    className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                            </Link>
                            {/* Facebook */}
                            <Link
                                href="#"
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#990000] border border-white/10 hover:border-[#990000] flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                                aria-label="Facebook"
                            >
                                <svg
                                    className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </Link>
                            {/* WhatsApp */}
                            <Link
                                href="#"
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#990000] border border-white/10 hover:border-[#990000] flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                                aria-label="WhatsApp"
                            >
                                <svg
                                    className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </Link>
                            {/* TikTok */}
                            <Link
                                href="#"
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#990000] border border-white/10 hover:border-[#990000] flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                                aria-label="TikTok"
                            >
                                <svg
                                    className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Burjo Minang. All Rights Reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link href="#" className="hover:text-yellow-400 transition-colors">
                            Kebijakan Privasi
                        </Link>
                        <Link href="#" className="hover:text-yellow-400 transition-colors">
                            Syarat &amp; Ketentuan
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
