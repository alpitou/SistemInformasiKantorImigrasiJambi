// src/types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  } | string;
  roleName?: string;
  nip: string | null;
  nik: string | null;
  unit: string;
  phone: string | null;
  status: 'active' | 'inactive';
  join_date: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  time: string;
  link?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}