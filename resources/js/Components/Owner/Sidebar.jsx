
import { Link, router, usePage } from "@inertiajs/react";

const navItems = [
    {
        label: "Dashboard",
        href: route("owner.dashboard"),
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        label: "Manajemen Akun",
        href: route("owner.accounts.index"),
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

export default function Sidebar({ isOpen, onClose }) {
    const { url } = usePage();

    const handleLogout = () => {
        router.post(route("logout"));
    };

    const isActive = (href) => url.startsWith(new URL(href).pathname);

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-amber-800 text-white
                transition-transform duration-300 ease-in-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                lg:relative lg:translate-x-0
            `}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-amber-700">
                <span className="text-xl font-bold tracking-wide">🍜 Burjo Minang</span>
                <button onClick={onClose} className="lg:hidden text-amber-200 hover:text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`
                            flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium
                            transition-colors duration-150
                            ${isActive(item.href)
                                ? "bg-amber-900 text-white"
                                : "text-amber-100 hover:bg-amber-700 hover:text-white"
                            }
                        `}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Logout */}
            <div className="border-t border-amber-700 px-3 py-4">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium
                               text-amber-100 hover:bg-amber-700 hover:text-white transition-colors duration-150"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    );
}