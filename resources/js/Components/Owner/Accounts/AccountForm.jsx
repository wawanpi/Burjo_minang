// resources/js/Components/Owner/Accounts/AccountForm.jsx
import { useForm } from "@inertiajs/react";

export default function AccountForm({ user = null, submitRoute, method = "post" }) {
    const isEdit = user !== null;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:                  user?.name  ?? "",
        email:                 user?.email ?? "",
        password:              "",
        password_confirmation: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(submitRoute, { onSuccess: () => reset("password", "password_confirmation") });
        } else {
            post(submitRoute, { onSuccess: () => reset() });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nama */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-amber-500
                                ${errors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    placeholder="admin@burjominang.com"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-amber-500
                                ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
            </div>

            {/* Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEdit ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}
                    {!isEdit && <span className="text-red-500"> *</span>}
                </label>
                <input
                    type="password"
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-amber-500
                                ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
            </div>

            {/* Konfirmasi Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password
                    {!isEdit && <span className="text-red-500"> *</span>}
                </label>
                <input
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e) => setData("password_confirmation", e.target.value)}
                    placeholder="Ulangi password"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm
                                focus:outline-none focus:ring-2 focus:ring-amber-500
                                ${errors.password_confirmation ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                {errors.password_confirmation && (
                    <p className="mt-1 text-xs text-red-500">{errors.password_confirmation}</p>
                )}
            </div>

            {/* Tombol Submit */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-amber-700 px-6 py-2.5 text-sm font-semibold text-white
                               hover:bg-amber-800 disabled:opacity-60 transition-colors duration-150"
                >
                    {processing ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Akun"}
                </button>
                <a
                    href={route("owner.accounts.index")}
                    className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium
                               text-gray-600 hover:bg-gray-50 transition-colors duration-150"
                >
                    Batal
                </a>
            </div>
        </form>
    );
}