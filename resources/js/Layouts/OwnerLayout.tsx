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

            {/* Backdrop Hitam Transparan saat Sidebar Terbuka (Khusus Layar Kecil) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Komponen */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Area Konten Utama */}
            <div className="flex-1 lg:ml-64 flex flex-col w-full min-w-0">
                {/* Top Bar */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        {/* Tombol Hamburger Mobile */}
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h1 className="text-lg lg:text-xl font-semibold text-gray-800">
                            {title || "Dashboard"}
                        </h1>
                    </div>
                    <div className="text-xs lg:text-sm text-gray-500 font-medium">
                        {panelLabel}
                    </div>
                </header>

                {/* Area Children */}
                <main className="p-4 lg:p-8 flex-1 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
