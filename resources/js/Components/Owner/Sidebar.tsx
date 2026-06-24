import { Link, usePage } from "@inertiajs/react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    ownerOnly?: boolean; // true = hanya tampil untuk role 'owner'
}

const navItems: NavItem[] = [
    {
        label: "Dashboard",
        href: "/owner/dashboard",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
    },
    {
        label: "Kasir POS",
        href: "/kasir/pos",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    {
        label: "Manajemen Menu",
        href: "/kasir/menus",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    {
        label: "Daftar Pesanan",
        href: "/kasir/orders",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        label: "Laporan",
        href: "/owner/laporan",
        ownerOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        label: "Ulasan",
        href: "/owner/reviews",
        ownerOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
    },
    {
        label: "Manajemen Akun",
        href: "/owner/accounts",
        ownerOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];


export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (val: boolean) => void }) {
    const { url, props } = usePage();
    const userRole = (props.auth as any)?.user?.role;
    const userName = (props.auth as any)?.user?.name ?? 'User';

    const isActive = (href: string) => url.startsWith(href);

    // RBAC: Filter menu berdasarkan role — kasir tidak bisa melihat menu ownerOnly
    const visibleItems = navItems.filter(item => {
        if (item.ownerOnly && userRole !== 'owner') return false;
        return true;
    });

    return (
        <aside className={`w-64 bg-bm-charcoal-900 flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl shadow-black/50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

            {/* Top accent — red→gold gradient hairline */}
            <div className="absolute top-0 inset-x-0 h-[3px] bm-top-accent" />

            {/* Header Sidebar */}
            <div className="px-5 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-bm-gold-400/30 flex items-center justify-center overflow-hidden shadow-lg shadow-black/20">
                            <img
                                src="/images/logo-burjo.jpg"
                                alt="Burjo Minang Logo"
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                        <div>
                            <span className="block text-[15px] font-serif font-bold text-white uppercase tracking-wide drop-shadow-sm leading-tight">Burjo Minang</span>
                            <span className="block text-[10px] font-semibold text-bm-gold-400 uppercase tracking-[0.18em] mt-0.5">
                                {userRole === 'owner' ? 'Owner Panel' : 'Kasir Panel'}
                            </span>
                        </div>
                    </div>
                    {/* Tombol Tutup Khusus Mobile */}
                    <button onClick={() => setIsOpen && setIsOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {/* Ornamen garis emas tipis di bawah logo */}
                <div className="mt-5 flex items-center gap-2">
                    <span className="block h-px flex-1 bg-gradient-to-r from-transparent via-bm-gold-400/40 to-transparent" />
                    <span className="text-bm-gold-400/70 text-[10px] leading-none">✦</span>
                    <span className="block h-px flex-1 bg-gradient-to-r from-transparent via-bm-gold-400/40 to-transparent" />
                </div>
            </div>

            {/* Section Label */}
            <div className="px-4 pb-2">
                <span className="bm-eyebrow text-gray-500 block">Menu Utama</span>
            </div>

            {/* Navigasi (Menu) */}
            <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto custom-scrollbar">
                {visibleItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsOpen && setIsOpen(false)}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-[13px] overflow-hidden ${
                                active
                                    ? "bg-gradient-to-r from-bm-maroon-700 to-bm-red-700 text-white font-semibold shadow-lg shadow-bm-maroon-700/30"
                                    : "text-gray-400 hover:bg-white/[0.04] hover:text-white font-normal"
                            }`}
                        >
                            {/* Left indicator: gold bar — full when active, slides in on hover */}
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-bm-gold-400 transition-all duration-300 ${
                                active ? 'h-6 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'h-0 group-hover:h-4 opacity-80'
                            }`} />
                            <span className={`flex-shrink-0 transition-colors duration-300 ${
                                active ? 'text-bm-gold-400' : 'text-gray-500 group-hover:text-gray-300'
                            }`}>
                                {item.icon}
                            </span>
                            {item.label}
                            {active && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-bm-gold-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Sidebar (User Info + Logout) */}
            <div className="p-3 border-t border-white/5 pt-4 bg-black/20">
                {/* User Mini Info */}
                <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-bm-red-600 to-bm-charcoal-700 flex items-center justify-center text-sm font-bold text-white uppercase ring-1 ring-bm-gold-400/40 shadow-md shadow-black/30">
                        {userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{userName}</p>
                        <p className="text-[11px] text-bm-gold-400/80 capitalize tracking-wide">{userRole}</p>
                    </div>
                </div>

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-bm-red-500 hover:bg-bm-red-500/10 hover:text-red-300 transition-all duration-300 text-sm font-semibold border border-transparent hover:border-bm-red-500/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
                </Link>
            </div>
        </aside>
    );
}
