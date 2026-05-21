import React from 'react';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';
import Input from '@/Components/ui/Input';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditMode: boolean;
  data: any;
  setData: (field: string, value: any) => void;
  errors: any;
  processing: boolean;
}

const UserFormModal = ({ 
  isOpen, onClose, onSubmit, isEditMode, data, setData, errors, processing 
}: UserFormModalProps) => {

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna'}
      onClose={handleClose}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          placeholder="Budi Santoso"
          error={errors.name}
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="budi@example.com"
          error={errors.email}
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          required
        />

        <Input
          label="Nomor HP"
          id="no_hp"
          type="tel"
          name="no_hp"
          value={data.no_hp}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9+]/g, '');
            setData('no_hp', val);
          }}
          error={errors.no_hp}
          placeholder="081234567890"
          required
        />

        <Input
          label={isEditMode ? 'Password Baru (opsional)' : 'Password'}
          type="password"
          placeholder="Minimal 8 karakter"
          error={errors.password}
          value={data.password}
          onChange={(e) => setData('password', e.target.value)}
          required={!isEditMode}
        />
        
        {/* We need password_confirmation if 'confirmed' rule is used in Laravel */}
        <Input
          label="Konfirmasi Password"
          type="password"
          placeholder="Ulangi password"
          error={errors.password_confirmation}
          value={data.password_confirmation}
          onChange={(e) => setData('password_confirmation', e.target.value)}
          required={!isEditMode && !!data.password}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={data.role}
            onChange={(e) => setData('role', e.target.value)}
            required
          >
            <option value="kasir">Kasir</option>
            <option value="pelanggan">Pelanggan</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={processing}>
            {isEditMode ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
