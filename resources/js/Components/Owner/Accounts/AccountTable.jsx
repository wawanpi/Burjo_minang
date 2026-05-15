// resources/js/Components/Owner/Accounts/AccountTable.jsx
import { router } from "@inertiajs/react";
import { Link } from "@inertiajs/react";

export default function AccountTable({ users }) {
    const handleDelete = (user) => {
        if (confirm(`Hapus akun "${user.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
            router.delete(route("owner.accounts.destroy", user.id));
        }
    };

    if (users.length === 0) {
        return (
            <div className="py-16 text-center text-gray-400">
                <svg className="mx-auto mb-3 h-12 w-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Belum ada akun admin.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Dibuat</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {users.map((user, index) => (
                        <tr key={user.id} className="hover:bg-amber-50 transition-colors duration-100">
                            <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                            <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                            <td className="px-6 py-4 text-gray-600">{user.email}</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5
                                                 text-xs font-medium text-blue-700 capitalize">
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {new Date(user.created_at).toLocaleDateString("id-ID", {
                                    day:   "2-digit",
                                    month: "short",
                                    year:  "numeric",
                                })}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <Link
                                        href={route("owner.accounts.edit", user.id)}
                                        className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium
                                                   text-amber-800 hover:bg-amber-200 transition-colors"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(user)}
                                        className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium
                                                   text-red-700 hover:bg-red-200 transition-colors"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}