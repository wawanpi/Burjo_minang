// resources/js/Components/Frontend/Navbar.tsx
// ─── Navbar — Shared Landing Page / Public-Facing Navbar ─────────────────────
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// ─── Custom Hook: Navbar Scroll State ────────────────────────────────────────
function useScrolled(threshold = 60) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > threshold);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);

    return scrolled;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavLink {
    label: string;
    href: string;
}

interface NavbarProps {
    /** Navigation links — defaults to landing page anchors */
    links?: NavLink[];
    /** Show auth buttons (Masuk / Daftar). Set false for pages where user is already logged in. */
    showAuth?: boolean;
    /** Enable "Kembali ke Beranda" link instead of regular nav links (e.g. on Menu page) */
    backToHome?: boolean;
}

const DEFAULT_LINKS: NavLink[] = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Menu', href: '#menu' },
    { label: 'Kontak', href: '#kontak' },
];

export default function Navbar({
    links = DEFAULT_LINKS,
    showAuth = true,
    backToHome = false,
}: NavbarProps) {
    const scrolled = useScrolled(60);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav
            id="navbar"
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
                scrolled
                    ? 'bg-gray-950/75 backdrop-blur-2xl shadow-2xl shadow-black/20 border-b border-white/5'
                    : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo — Premium Typographic */}
                    <a href={backToHome ? '/' : '#beranda'} className="flex items-center gap-3 group">
                        <div className="flex flex-col items-start">
                            <span className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide leading-none">
                                BURJO MINANG
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="block h-px w-5 bg-yellow-400/60" />
                                <span className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-yellow-400 font-medium leading-none">
                                    Cita Rasa Autentik
                                </span>
                                <span className="block h-px w-5 bg-yellow-400/60" />
                            </div>
                        </div>
                    </a>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {backToHome ? (
                            <Link
                                href="/"
                                className="px-4 py-2 rounded-full text-sm font-medium tracking-wide text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Kembali ke Beranda
                            </Link>
                        ) : (
                            links.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="px-4 py-2 rounded-full text-sm font-medium tracking-wide text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                                >
                                    {link.label}
                                </a>
                            ))
                        )}

                        {showAuth && (
                            <>
                                <Link
                                    href={route('login')}
                                    className="ml-4 px-5 py-2.5 text-white/90 hover:text-white text-sm font-semibold transition-all duration-300 hover:scale-105"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={route('register')}
                                    className={`ml-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                                        scrolled
                                            ? 'bg-[#990000] text-white hover:bg-[#7a0000] shadow-lg shadow-[#990000]/30'
                                            : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm'
                                    }`}
                                >
                                    Daftar
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5"
                        aria-label="Toggle menu"
                    >
                        <span
                            className={`block w-6 h-0.5 rounded bg-white transition-all duration-300 ${
                                mobileOpen ? 'rotate-45 translate-y-2' : ''
                            }`}
                        />
                        <span
                            className={`block w-6 h-0.5 rounded bg-white transition-all duration-300 ${
                                mobileOpen ? 'opacity-0 scale-0' : ''
                            }`}
                        />
                        <span
                            className={`block w-6 h-0.5 rounded bg-white transition-all duration-300 ${
                                mobileOpen ? '-rotate-45 -translate-y-2' : ''
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${
                    mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="bg-gray-950/90 backdrop-blur-2xl border-t border-white/10 px-6 py-4 space-y-1">
                    {backToHome ? (
                        <Link
                            href="/"
                            className="block px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Beranda
                        </Link>
                    ) : (
                        links.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
                            >
                                {link.label}
                            </a>
                        ))
                    )}

                    {showAuth && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <Link
                                href={route('login')}
                                className="block text-center px-4 py-3 rounded-full border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                            >
                                Masuk
                            </Link>
                            <Link
                                href={route('register')}
                                className="block text-center px-4 py-3 rounded-full bg-[#990000] text-white text-sm font-semibold hover:bg-[#7a0000] transition-colors"
                            >
                                Daftar
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
