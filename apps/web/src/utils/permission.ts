import { useAuthStore } from '@/stores/authStore';

export function hasPermission(permission: string): boolean {
  return useAuthStore.getState().hasPermission(permission);
}

export function hasMenuAccess(module: string): boolean {
  return useAuthStore.getState().hasMenuAccess(module);
}
