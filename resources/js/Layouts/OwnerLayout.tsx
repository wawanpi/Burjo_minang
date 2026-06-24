import { ReactNode, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import Sidebar from "@/Components/Owner/Sidebar";

export default function OwnerLayout({ title, children }: { title?: string; children: ReactNode }) {
    const { props } = usePage();
    const userRole = (props.auth as any)?.user?.role;
    const panelLabel = userRole === 'owner' ? 'Owner Panel' : 'Kasir Panel';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-bm-cream flex font-sans">
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
                {/* Top Bar — elegant strong glassmorphism */}
                <header className="bg-white/60 backdrop-blur-2xl border-b border-white/50 h-16 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500">
                    <div className="flex items-center gap-3">
                        {/* Tombol Hamburger Mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/50 text-gray-500 hover:text-[#990000] transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2.5">
                            <span className="hidden sm:inline text-bm-gold-500 text-base leading-none select-none">✦</span>
                            <h1 className="text-xl lg:text-[26px] font-serif font-bold text-bm-charcoal-900 tracking-tight leading-none">
                                {title || "Dashboard"}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 bg-white/60 rounded-full border border-black/[0.06] shadow-sm">
                            <span className="bm-eyebrow tracking-[0.15em]">
                                {panelLabel}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-bm-gold-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
                            <span className="text-xs text-bm-charcoal-800 font-medium">
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Area Children — with proper top padding to avoid header overlap */}
                <main className="p-4 lg:p-8 flex-1 overflow-y-auto w-full custom-scrollbar relative z-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
