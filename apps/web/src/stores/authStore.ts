import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@internal-platform/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  permissions: string[];
  setAuth: (user: User, token: string, refreshToken: string, permissions: string[]) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  hasMenuAccess: (module: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      permissions: [],
      setAuth: (user, token, refreshToken, permissions) =>
        set({ user, token, refreshToken, permissions }),
      logout: () => set({ user: null, token: null, refreshToken: null, permissions: [] }),
      hasPermission: (perm) => {
        const perms = get().permissions;
        return perms.includes('*') || perms.includes(perm);
      },
      hasMenuAccess: (module) => {
        const perms = get().permissions;
        return perms.includes('*') || perms.some((p) => p.startsWith(`${module}.`));
      },
    }),
    { name: 'linxi-auth' },
  ),
);
