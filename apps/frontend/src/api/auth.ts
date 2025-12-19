// apps/frontend/src/api/auth.ts
import { api } from './config';

export type UserRole = 'admin' | 'avvocato' | 'collaboratore' | 'segreteria' | 'cliente';

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: UserRole;
  clienteId: string | null;
  studioId: string | null;
  attivo: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  ruolo?: UserRole;
  clienteId?: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export const authApi = {
  login: async (loginDto: LoginDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', loginDto);
  },

  register: async (registerDto: RegisterDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', registerDto);
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },

  getProfile: async (): Promise<User> => {
    return api.get<User>('/auth/profile');
  },
};
