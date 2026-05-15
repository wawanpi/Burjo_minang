// resources/js/Pages/Owner/Accounts/Create.jsx
import { Link } from "@inertiajs/react";
import OwnerLayout from "@/Layouts/OwnerLayout";
import AccountForm from "@/Components/Owner/Accounts/AccountForm";

export default function Create() {
    return (
        <OwnerLayout title="Tambah Akun Admin">
            <div className="space-y-5">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route("owner.accounts.index")} className="hover:text-amber-700">
                        Manajemen Akun
                    </Link>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">Tambah Akun</span>
                </nav>

                {/* Card Form */}
                <div className="rounded-xl bg-white p-6 shadow-sm max-w-lg">
                    <h2 className="mb-6 text-lg font-bold text-gray-800">Form Tambah Akun Admin</h2>
                    <AccountForm
                        submitRoute={route("owner.accounts.store")}
                        method="post"
                    />
                </div>
            </div>
        </OwnerLayout>
    );
}