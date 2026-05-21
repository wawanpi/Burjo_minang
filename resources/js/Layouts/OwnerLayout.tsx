import { ReactNode } from "react";
import { Head } from "@inertiajs/react";
import Sidebar from "@/Components/Owner/Sidebar";

export default function OwnerLayout({ title, children }: { title?: string; children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {title && <Head title={`${title} — Owner Panel`} />}

            {/* Sidebar Komponen */}
            <Sidebar />

            {/* Area Konten Utama */}
            <div className="flex-1 ml-64 flex flex-col">
                {/* Top Bar */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 z-10">
                    <h1 className="text-xl font-semibold text-gray-800">
                        {title || "Dashboard"}
                    </h1>
                    <div className="text-sm text-gray-500 font-medium">
                        Owner Panel
                    </div>
                </header>

                {/* Area Children */}
                <main className="p-8 flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
