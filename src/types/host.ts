// src/types/host.ts
export interface Host {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  login: string;
  ip: string;
  port: string;
  password_id: number;
  created_at: string;
}

export interface Password {
  id: number;
  user_id: number;
  description: string | null;
  password: string;
  created_at: string;
}

export interface Key {
  id: number;
  user_id: number;
  description: string;
  key_data: string | null;  // zawartość klucza SSH
  path: string | null;      // ścieżka do pliku klucza w systemie
  created_at: string;
}