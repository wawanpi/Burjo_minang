// resources/js/Pages/Owner/Accounts/Index.tsx
import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import type { User } from '@/types/user.types';
import OwnerLayout from '@/Layouts/OwnerLayout';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal';
import Button from '@/Components/ui/Button';


interface Props {
  users: User[]; // Controller mengirimkan array of objects, bukan PaginatedResponse
}

export default function Index({ users }: Props) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'admin',
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
      });
    } else {
      post('/owner/accounts', {
        onSuccess: () => handleCloseModal(),
      });
    }
  };

  const handleDelete = (user: User) => {
    if (!window.confirm(`Hapus pengguna "${user.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    // Delete data via Inertia
    router.delete(`/owner/accounts/${user.id}`, {
      preserveScroll: true,
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <OwnerLayout title="Manajemen Akun">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Manajemen Akun</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kelola akun admin dan pelanggan
            </p>
          </div>
          <Button onClick={handleOpenCreate}>+ Tambah Pengguna</Button>
        </div>

        {/* Stats ringkas */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total {users.length} pengguna terdaftar
        </p>

        {/* Tabel */}
        <UserTable
          users={users}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
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