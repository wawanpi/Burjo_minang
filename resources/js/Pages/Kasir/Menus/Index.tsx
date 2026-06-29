import { useState, useEffect, type FormEvent } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Menu {
    id: number;
    nama_menu: string;
    kategori: string;
    harga: number | string;
    stok: number | string;
    gambar: string | null;
}

interface Props {
    menus: Menu[];
    kategoriList: string[];
    filters: { search?: string };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function MenuIndex({ menus, kategoriList, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props as any;
    
    // ─── Toast Notification State ──────────────────────────────
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Tangkap flash message dan tampilkan Toast, auto-hide dalam 3 detik
    useEffect(() => {
        if (flash?.success) {
            setToastMessage(flash.success);
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
    const [search, setSearch] = useState(filters?.search || '');

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        nama_menu: '',
        kategori: '',
        harga: '',
        stok: '',
        gambar: null as File | null,
    });

    // ─── Auto Search (Debounced) ──────────────────────────────
    useEffect(() => {
        // Jangan auto-search pada render pertama jika tidak ada perubahan
        if (search === (filters?.search || '')) return;

        const delayDebounceFn = setTimeout(() => {
            router.get('/kasir/menus', search ? { search } : {}, { preserveState: true, replace: true });
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const clearSearch = () => {
        setSearch('');
    };

    // ─── Modal Handlers ────────────────────────────────────────
    const openCreate = () => {
        setEditingMenu(null);
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    const openEdit = (menu: Menu) => {
        setEditingMenu(menu);
        clearErrors();
        setData({
            nama_menu: menu.nama_menu,
            kategori: menu.kategori,
            harga: String(menu.harga),
            stok: String(menu.stok),
            gambar: null,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMenu(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (editingMenu) {
            router.post(`/kasir/menus/${editingMenu.id}`, {
                _method: 'PUT',
                nama_menu: data.nama_menu,
                kategori: data.kategori,
                harga: data.harga,
                stok: data.stok,
                gambar: data.gambar,
            }, {
                forceFormData: true,
                onSuccess: () => closeModal(),
                preserveScroll: true,
                preserveState: true,
            });
        } else {
            post('/kasir/menus', {
                forceFormData: true,
                onSuccess: () => closeModal(),
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const handleDelete = (menu: Menu) => {
        if (!window.confirm(`Hapus menu "${menu.nama_menu}"? Tindakan ini tidak dapat dibatalkan.`)) return;
        router.delete(`/kasir/menus/${menu.id}`, { preserveScroll: true, preserveState: true });
    };

    // ─── Format Rupiah ─────────────────────────────────────────
    const formatRupiah = (val: number | string) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val));

    return (
        <OwnerLayout title="Manajemen Menu">
            <Head title="Manajemen Menu" />

            {/* ─── Toast Notification (Mengambang di Pojok Kanan Atas) ─── */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-[9999] animate-toast-in">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white border-l-4 border-green-500 shadow-xl rounded-lg min-w-[300px]">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Berhasil</p>
                            <p className="text-sm text-gray-600">{toastMessage}</p>
                        </div>
                        <button 
                            onClick={() => setToastMessage(null)}
                            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Header + Search + Add */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-page-enter">
                <div>
                    <span className="bm-eyebrow block mb-1.5">Katalog Produk</span>
                    <div className="flex items-center gap-2.5">
                        <span className="text-bm-gold-500 text-lg leading-none select-none">✦</span>
                        <h1 className="text-2xl lg:text-[28px] font-serif font-bold text-bm-charcoal-900 leading-tight">Daftar Menu</h1>
                    </div>
                    <div className="bm-gold-underline mt-3" />
                    <p className="text-sm text-bm-text-muted mt-2">Total {menus.length} menu terdaftar</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama menu atau kategori..."
                                className="w-64 pl-10 pr-8 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-bm-gold-400 focus:border-transparent transition-all"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-bm-gold-400 hover:bg-bm-gold-500 text-bm-charcoal-900 text-sm font-semibold rounded-full shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Menu
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-soft animate-page-enter">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-bm-cream">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">No</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Gambar</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Nama Menu</th>
                            <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Kategori</th>
                            <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Harga</th>
                            <th className="px-6 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Stok</th>
                            <th className="px-6 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-bm-text-muted">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05]">
                        {menus.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-bm-text-muted">
                                        <span className="text-5xl opacity-40 animate-float">🍽️</span>
                                        <p className="font-serif italic text-lg text-bm-charcoal-800">
                                            {filters?.search
                                                ? `Tidak ada menu yang cocok dengan "${filters.search}"`
                                                : 'Belum ada data menu.'}
                                        </p>
                                        {!filters?.search && (
                                            <p className="text-sm">Klik "Tambah Menu" untuk mulai menambahkan menu.</p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            menus.map((menu, index) => (
                                <tr key={menu.id} className="hover:bg-bm-cream transition-colors duration-150">
                                    <td className="px-6 py-4 text-sm text-bm-text-muted">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        {menu.gambar ? (
                                            <img
                                                src={`/storage/${menu.gambar}`}
                                                alt={menu.nama_menu}
                                                className="h-12 w-12 rounded-[10px] object-cover ring-1 ring-gray-200"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-[10px] bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
                                                🍽️
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-serif font-semibold text-bm-charcoal-900">{menu.nama_menu}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                                            /minum/i.test(menu.kategori)
                                                ? 'bg-bm-red-50 text-bm-red-700 ring-bm-red-600/15'
                                                : 'bg-bm-gold-100 text-bm-charcoal-900 ring-bm-gold-500/25'
                                        }`}>
                                            {menu.kategori}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-bm-red-600">{formatRupiah(menu.harga)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center min-w-[28px] rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                                            Number(menu.stok) > 10
                                                ? 'bg-green-50 text-green-700 ring-green-600/15'
                                                : Number(menu.stok) > 0
                                                    ? 'bg-amber-50 text-amber-700 ring-amber-600/15'
                                                    : 'bg-bm-red-50 text-bm-red-700 ring-bm-red-600/15'
                                        }`}>
                                            {menu.stok}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openEdit(menu)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-bm-charcoal-800 hover:bg-bm-cream hover:border-gray-400 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(menu)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bm-red-600 text-xs font-semibold text-white hover:bg-bm-red-700 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ─── Modal Form Tambah/Edit ────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    {/* Panel */}
                    <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-modal-in">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-serif font-bold text-bm-charcoal-900">
                                {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nama Menu */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Nama Menu</label>
                                <input
                                    type="text"
                                    value={data.nama_menu}
                                    onChange={(e) => setData('nama_menu', e.target.value)}
                                    placeholder="Contoh: Nasi Goreng Spesial"
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-bm-gold-400 transition-colors ${
                                        errors.nama_menu ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {errors.nama_menu && <p className="text-xs text-red-500 mt-0.5">{errors.nama_menu}</p>}
                            </div>

                            {/* Kategori */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Kategori</label>
                                <input
                                    list="kategori-list"
                                    value={data.kategori}
                                    onChange={(e) => setData('kategori', e.target.value)}
                                    placeholder="Pilih atau ketik kategori baru"
                                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bm-gold-400 transition-colors ${
                                        errors.kategori ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                                    }`}
                                />
                                <datalist id="kategori-list">
                                    {kategoriList.map((kat) => (
                                        <option key={kat} value={kat} />
                                    ))}
                                </datalist>
                                {errors.kategori && <p className="text-xs text-red-500 mt-0.5">{errors.kategori}</p>}
                            </div>

                            {/* Harga */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Harga (Rp)</label>
                                <input
                                    type="number"
                                    value={data.harga}
                                    onChange={(e) => setData('harga', e.target.value)}
                                    placeholder="15000"
                                    min="0"
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-bm-gold-400 transition-colors ${
                                        errors.harga ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {errors.harga && <p className="text-xs text-red-500 mt-0.5">{errors.harga}</p>}
                            </div>

                            {/* Stok */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Stok</label>
                                <input
                                    type="number"
                                    value={data.stok}
                                    onChange={(e) => setData('stok', e.target.value)}
                                    placeholder="50"
                                    min="0"
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-bm-gold-400 transition-colors ${
                                        errors.stok ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {errors.stok && <p className="text-xs text-red-500 mt-0.5">{errors.stok}</p>}
                            </div>

                            {/* Gambar */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Gambar {editingMenu ? '(opsional)' : <span className="text-red-500">*</span>}
                                </label>
                                {editingMenu && editingMenu.gambar && (
                                    <div className="mb-2">
                                        <p className="text-xs text-gray-500 mb-1">Gambar saat ini:</p>
                                        <img 
                                            src={`/storage/${editingMenu.gambar}`} 
                                            alt={editingMenu.nama_menu} 
                                            className="h-20 w-20 object-cover rounded-lg border border-gray-200" 
                                        />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('gambar', e.target.files?.[0] ?? null)}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bm-gold-100 file:text-bm-charcoal-900 hover:file:bg-bm-gold-300/60 file:cursor-pointer file:transition-colors"
                                />
                                {errors.gambar && <p className="text-xs text-red-500 mt-0.5">{errors.gambar}</p>}
                                {editingMenu && (
                                    <p className="text-xs text-gray-400 mt-1">Biarkan kosong jika tidak ingin mengubah gambar.</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-b from-bm-red-500 to-bm-red-600 hover:from-bm-red-600 hover:to-bm-red-700 text-white text-sm font-semibold rounded-full shadow-soft hover:shadow-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing && (
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                    )}
                                    {editingMenu ? 'Simpan Perubahan' : 'Tambah Menu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-modal-in { animation: modalIn 0.2s ease-out; }

                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(100%) scale(0.95); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
                .animate-toast-in { animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </OwnerLayout>
    );
}
