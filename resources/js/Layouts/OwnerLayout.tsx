import { ReactNode, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import Sidebar from "@/Components/Owner/Sidebar";

export default function OwnerLayout({ title, children }: { title?: string; children: ReactNode }) {
    const { props } = usePage();
    const userRole = (props.auth as any)?.user?.role;
    const panelLabel = userRole === 'owner' ? 'Owner Panel' : 'Kasir Panel';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {title && <Head title={`${title} — ${panelLabel}`} />}

            {/* Backdrop saat Sidebar Terbuka (Mobile) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Komponen */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Area Konten Utama */}
            <div className="flex-1 lg:ml-64 flex flex-col w-full min-w-0">
                {/* Top Bar — refined with subtle glass effect */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 h-16 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
                    <div className="flex items-center gap-3">
                        {/* Tombol Hamburger Mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-base lg:text-lg font-semibold text-gray-800">
                            {title || "Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-medium tracking-wide uppercase hidden sm:inline">
                            {panelLabel}
                        </span>
                        <div className="w-px h-5 bg-gray-200 hidden sm:block" />
                        <span className="text-xs text-gray-500 font-medium">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </header>

                {/* Area Children — with proper top padding to avoid header overlap */}
                <main className="p-4 lg:p-8 flex-1 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
