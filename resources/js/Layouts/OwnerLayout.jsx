import { useState } from "react";
import { Head } from "@inertiajs/react";
import Sidebar from "@/Components/Owner/Sidebar";

export default function OwnerLayout({ title, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            <Head title={title ? `${title} — Warmindo Burjo Minang` : "Warmindo Burjo Minang"} />

            <div className="flex h-screen bg-gray-100 font-sans">
                {/* Overlay mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Konten utama */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Topbar */}
                    <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700 lg:hidden"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <h1 className="text-lg font-semibold text-gray-800">
                            {title ?? "Dashboard"}
                        </h1>

                        <span className="text-sm text-gray-500">Owner Panel</span>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}