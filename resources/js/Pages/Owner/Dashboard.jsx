// resources/js/Pages/Owner/Dashboard.jsx
import OwnerLayout from "@/Layouts/OwnerLayout";
import StatCard from "@/Components/Owner/StatCard";

export default function Dashboard({ stats }) {
    const formatRupiah = (value) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
            .format(value);

    return (
        <OwnerLayout title="Dashboard">
            <div className="space-y-6">

                {/* Heading */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Selamat Datang, Owner 👋</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Berikut ringkasan bisnis Warmindo Burjo Minang hari ini.
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="Total Pendapatan"
                        value={formatRupiah(stats.total_pendapatan)}
                        color="green"
                        icon={
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Total Pesanan"
                        value={stats.jumlah_pesanan}
                        color="blue"
                        icon={
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Pesanan Hari Ini"
                        value={stats.pesanan_hari_ini}
                        color="amber"
                        icon={
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                </div>
            </div>
        </OwnerLayout>
    );
}