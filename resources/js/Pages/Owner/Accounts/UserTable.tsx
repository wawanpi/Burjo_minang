// src/features/owner/users/UserTable.tsx
import type { User } from '@/types/user.types';
import Button from '@/Components/ui/Button';

// Gradien avatar berdasarkan role
const avatarGradient = (role: User['role']) => {
  const map: Record<string, string> = {
    owner:     'from-bm-gold-400 to-bm-gold-600',
    kasir:     'from-bm-charcoal-700 to-bm-charcoal-900',
    pelanggan: 'from-bm-red-500 to-bm-red-700',
  };
  return map[role] ?? 'from-bm-charcoal-700 to-bm-charcoal-900';
};

// Pill role + ikon
const RoleBadge = ({ role }: { role: User['role'] }) => {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-bm-gold-300 to-bm-gold-400 px-2.5 py-0.5 text-xs font-bold text-bm-charcoal-900 ring-1 ring-bm-gold-500/30">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 2h14v2H5v-2z" /></svg>
        owner
      </span>
    );
  }
  if (role === 'kasir') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-bm-charcoal-800 px-2.5 py-0.5 text-xs font-semibold text-bm-gold-400 ring-1 ring-white/10">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        kasir
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-bm-red-50 px-2.5 py-0.5 text-xs font-semibold text-bm-red-700 ring-1 ring-bm-red-600/15">
      pelanggan
    </span>
  );
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
      <div className="rounded-2xl border border-black/[0.05] bg-white shadow-soft text-center py-16">
        <span className="text-5xl opacity-40 animate-float block mb-2">👤</span>
        <p className="font-serif italic text-lg text-bm-charcoal-800">Belum ada data pengguna.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.05] bg-white shadow-soft">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bm-cream border-b border-black/[0.05]">
            {['Nama', 'Email', 'Role', 'Bergabung', 'Aksi'].map((h) => (
              <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-bm-text-muted uppercase tracking-[0.08em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.05]">
          {users.map((user) => (
            <tr key={user.id} className="bg-white hover:bg-bm-cream transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(user.role)} flex items-center justify-center text-sm font-bold text-white uppercase ring-1 ring-black/5 shadow-sm`}>
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-serif font-semibold text-bm-charcoal-900">{user.name}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 text-bm-text-muted">{user.email}</td>
              <td className="px-5 py-3.5">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-5 py-3.5 text-bm-text-muted">
                {new Date(user.created_at).toLocaleDateString('id-ID', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => onEdit(user)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    pill={false}
                    className="!px-3 !py-1.5 text-xs"
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
