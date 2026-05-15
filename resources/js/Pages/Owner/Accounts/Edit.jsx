// resources/js/Pages/Owner/Accounts/Edit.jsx
import { Link } from "@inertiajs/react";
import OwnerLayout from "@/Layouts/OwnerLayout";
import AccountForm from "@/Components/Owner/Accounts/AccountForm";

export default function Edit({ user }) {
    return (
        <OwnerLayout title="Edit Akun Admin">
            <div className="space-y-5">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route("owner.accounts.index")} className="hover:text-amber-700">
                        Manajemen Akun
                    </Link>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">Edit: {user.name}</span>
                </nav>

                {/* Card Form */}
                <div className="rounded-xl bg-white p-6 shadow-sm max-w-lg">
                    <h2 className="mb-6 text-lg font-bold text-gray-800">
                        Edit Akun: <span className="text-amber-700">{user.name}</span>
                    </h2>
                    <AccountForm
                        user={user}
                        submitRoute={route("owner.accounts.update", user.id)}
                        method="put"
                    />
                </div>
            </div>
        </OwnerLayout>
    );
}