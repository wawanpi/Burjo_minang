// src/types/user.types.ts

export type UserRole = 'owner' | 'kasir' | 'pelanggan';

// Sesuai kolom tabel users + shape UserResource.php
export interface User {
  id: number;
  name: string;
  email: string;
  no_hp: string;
  role: UserRole;
  created_at: string; // ISO 8601
}

// Payload untuk POST /owner/users
export interface CreateUserPayload {
  name: string;
  email: string;
  no_hp: string;
  password: string;
  role: Extract<UserRole, 'kasir' | 'pelanggan'>;
}

// Payload untuk PUT /owner/users/:id
// Semua field opsional (backend pakai 'sometimes')
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  no_hp?: string;
  password?: string;
  role?: Extract<UserRole, 'kasir' | 'pelanggan'>;
}
