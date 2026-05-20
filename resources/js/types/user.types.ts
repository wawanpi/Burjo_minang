// src/types/user.types.ts

export type UserRole = 'owner' | 'admin' | 'pelanggan';

// Sesuai kolom tabel users + shape UserResource.php
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string; // ISO 8601
}

// Payload untuk POST /owner/users
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'admin' | 'pelanggan'>;
}

// Payload untuk PUT /owner/users/:id
// Semua field opsional (backend pakai 'sometimes')
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: Extract<UserRole, 'admin' | 'pelanggan'>;
}