import { Link, usePage } from "@inertiajs/react";
import OwnerLayout from "@/Layouts/OwnerLayout";
import AccountTable from "@/Components/Owner/Accounts/AccountTable";

export default function Index({ users }) {
    const { flash } = usePage().props;

    return (
        <OwnerLayout title="Manajemen Akun">
            <div className="space-y-5">

                {/* Header halaman */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manajemen Akun</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Kelola akun Admin yang dapat mengakses sistem kasir.
                        </p>
                    </div>
                    <Link
                        href={route("owner.accounts.create")}
                        className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white
                                   hover:bg-amber-800 transition-colors duration-150"
                    >
                        + Tambah Akun
                    </Link>
                </div>

                {/* Flash Message */}
                {flash?.success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                        ✅ {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        ❌ {flash.error}
                    </div>
                )}

                {/* Tabel */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <AccountTable users={users} />
                </div>
            </div>
        </OwnerLayout>
    );
}