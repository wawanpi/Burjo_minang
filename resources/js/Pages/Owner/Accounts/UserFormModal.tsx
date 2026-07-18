import React, { useState, useEffect } from 'react';
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

  // Anti-autofill kuat: Chrome kadang mengabaikan autoComplete untuk password
  // tersimpan. Trik: field readonly saat form dibuka (browser tidak mengisi
  // field readonly), lalu menjadi editable begitu difokuskan/diklik.
  const [locked, setLocked] = useState(true);
  useEffect(() => { if (isOpen) setLocked(true); }, [isOpen]);
  const unlock = () => setLocked(false);

  return (
    <Modal
      isOpen={isOpen}
      title={isEditMode ? 'Edit Kasir' : 'Tambah Kasir'}
      onClose={handleClose}
    >
      {/* autoComplete off + new-password: cegah browser mengisi kredensial owner
          yang sedang login ke form tambah/edit akun (autofill login). */}
      <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
        <Input
          label="Nama Lengkap"
          placeholder="Budi Santoso"
          error={errors.name}
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          autoComplete="off"
          readOnly={locked}
          onFocus={unlock}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="budi@example.com"
          error={errors.email}
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          autoComplete="off"
          readOnly={locked}
          onFocus={unlock}
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
          autoComplete="off"
          readOnly={locked}
          onFocus={unlock}
          required
        />

        <Input
          label={isEditMode ? 'Password Baru (opsional)' : 'Password'}
          type="password"
          placeholder="Minimal 8 karakter"
          error={errors.password}
          value={data.password}
          onChange={(e) => setData('password', e.target.value)}
          autoComplete="new-password"
          readOnly={locked}
          onFocus={unlock}
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
          autoComplete="new-password"
          readOnly={locked}
          onFocus={unlock}
          required={!isEditMode && !!data.password}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={processing}>
            {isEditMode ? 'Simpan Perubahan' : 'Tambah Kasir'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
