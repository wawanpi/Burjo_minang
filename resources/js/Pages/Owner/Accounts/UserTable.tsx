// src/features/owner/users/UserTable.tsx
import type { User } from '@/types/user.types';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';

// Helper: mapping role → warna badge
const roleBadgeVariant = (role: User['role']) => {
  const map = { owner: 'info', kasir: 'warning', pelanggan: 'neutral' } as const;
  return map[role] ?? 'neutral';
};

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isDeleting?: number | null; // id user yang sedang dihapus
}

const UserTable = ({ users, onEdit, onDelete, isDeleting = null }: UserTableProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-600">
        Belum ada data pengguna.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            {['Nama', 'Email', 'Role', 'Bergabung', 'Aksi'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {users.map((user) => (
            <tr key={user.id} className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
              <td className="px-4 py-3">
                <Badge label={user.role} variant={roleBadgeVariant(user.role)} />
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                {new Date(user.created_at).toLocaleDateString('id-ID', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => onEdit(user)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    isLoading={isDeleting === user.id}
                    onClick={() => onDelete(user)}
                    disabled={user.role === 'owner'}
                  >
                    Hapus
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
