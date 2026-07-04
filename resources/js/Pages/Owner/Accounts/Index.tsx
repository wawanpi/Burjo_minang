// resources/js/Pages/Owner/Accounts/Index.tsx
import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import type { User } from '@/types/user.types';
import OwnerLayout from '@/Layouts/OwnerLayout';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal';
import Button from '@/Components/ui/Button';


interface Props {
  users: User[]; // Controller mengirimkan array of objects, bukan PaginatedResponse
  filters?: { search?: string };
}

export default function Index({ users, filters }: Props) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // ─── Pencarian Akun (server-side, debounced) ──────────────────────────────
  const [search, setSearch] = useState(filters?.search || '');

  useEffect(() => {
    // Jangan auto-search pada render pertama jika tidak ada perubahan
    if (search === (filters?.search || '')) return;

    const delayDebounceFn = setTimeout(() => {
      router.get('/owner/accounts', search ? { search } : {}, { preserveState: true, replace: true });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const clearSearch = () => {
    setSearch('');
  };

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    email: '',
    no_hp: '',
    password: '',
    password_confirmation: '',
    role: 'kasir',
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingUser(null);
    clearErrors();
    reset();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    clearErrors();
    setData({
      name: user.name,
      email: user.email,
      no_hp: user.no_hp || '',
      password: '',
      password_confirmation: '',
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
    clearErrors();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      put(`/owner/accounts/${editingUser.id}`, {
        onSuccess: () => handleCloseModal(),
        preserveScroll: true,
        preserveState: true,
      });
    } else {
      post('/owner/accounts', {
        onSuccess: () => handleCloseModal(),
        preserveScroll: true,
        preserveState: true,
      });
    }
  };

  const handleDelete = (user: User) => {
    if (!window.confirm(`Hapus pengguna "${user.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    // Delete data via Inertia
    router.delete(`/owner/accounts/${user.id}`, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <OwnerLayout title="Manajemen Akun">
      <div className="space-y-6 animate-page-enter">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="bm-eyebrow block mb-1.5">Pengguna Sistem</span>
            <div className="flex items-center gap-2.5">
              <span className="text-bm-gold-500 text-lg leading-none select-none">✦</span>
              <h1 className="text-2xl lg:text-[28px] font-serif font-bold text-bm-charcoal-900 leading-tight">Manajemen Akun</h1>
            </div>
            <div className="bm-gold-underline mt-3" />
            <p className="text-sm text-bm-text-muted mt-2">
              Kelola akun kasir dan pelanggan — Total {users.length} pengguna terdaftar
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Input Pencarian Akun */}
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, atau no. HP..."
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
            <Button variant="gold" onClick={handleOpenCreate}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Tambah Pengguna
            </Button>
          </div>
        </div>

        {/* Tabel */}
        <UserTable
          users={users}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          searchTerm={filters?.search}
        />

        {/* Modal Form */}
        <UserFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isEditMode={!!editingUser}
          data={data}
          setData={setData}
          errors={errors}
          processing={processing}
        />
      </div>
    </OwnerLayout>
  );
}
