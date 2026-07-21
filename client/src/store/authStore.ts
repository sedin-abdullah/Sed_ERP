import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'admin' | 'user' | 'technician';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  language: string;
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  can: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      // Admins implicitly have every permission.
      can: (permission) => {
        const u = get().user;
        return !!u && (u.role === 'admin' || u.permissions.includes(permission));
      },
    }),
    { name: 'sederp-auth' },
  ),
);
