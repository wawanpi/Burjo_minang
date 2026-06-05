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

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />

            </svg>

        ),

    },

    {

        label: "Kasir POS",

        href: "/kasir/pos",

        icon: (

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />

            </svg>

        ),

    },

    {

        label: "Manajemen Menu",

        href: "/kasir/menus",

        icon: (

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />

            </svg>

        ),

    },

    {

        label: "Daftar Pesanan",

        href: "/kasir/orders",

        icon: (

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />

            </svg>

        ),

    },

    {
        label: "Laporan",
        href: "/owner/laporan",
        ownerOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },

    {
        label: "Ulasan",
        href: "/owner/reviews",
        ownerOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
    },

    {
        label: "Manajemen Akun",
        href: "/owner/accounts",
        ownerOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },

];



export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (val: boolean) => void }) {
    const { url, props } = usePage();
    const userRole = (props.auth as any)?.user?.role;

    const isActive = (href: string) => url.startsWith(href);

    // RBAC: Filter menu berdasarkan role — kasir tidak bisa melihat menu ownerOnly
    const visibleItems = navItems.filter(item => {
        if (item.ownerOnly && userRole !== 'owner') return false;
        return true;
    });



    return (

        <aside className={`w-64 bg-[#b44b1c] text-white flex flex-col min-h-screen fixed left-0 top-0 bottom-0 shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

            {/* Header Sidebar */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🍜</span>
                    <span className="text-2xl font-bold tracking-wider">Burjo Minang</span>
                </div>
                {/* Tombol Tutup Khusus Mobile */}
                <button onClick={() => setIsOpen && setIsOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>



            {/* Navigasi (Menu) */}

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">

                {visibleItems.map((item) => {

                    const active = isActive(item.href);

                    return (

                        <Link

                            key={item.label}

                            href={item.href}

                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${

                                active

                                    ? "bg-black/20 border-l-4 border-yellow-400"

                                    : "border-l-4 border-transparent hover:bg-white/10"

                            }`}

                        >

                            {item.icon}

                            {item.label}

                        </Link>

                    );

                })}

            </nav>



            {/* Footer Sidebar (Logout) */}

            <div className="p-4 border-t border-white/10">

                <Link

                    href="/logout"

                    method="post"

                    as="button"

                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg hover:bg-red-600/80 transition-colors bg-black/20 font-medium"

                >

                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />

                    </svg>

                    Logout

                </Link>

            </div>

        </aside>

    );

} 

