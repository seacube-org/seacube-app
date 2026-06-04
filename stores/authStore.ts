import { create } from 'zustand';
import { configureDataService, AuthService } from '@/services/DataService';
import { storageGet, storageSet, storageDel } from '@/utils/storage';

const TOKEN_KEYS = { access: 'seacube_access', refresh: 'seacube_refresh', activeOrg: 'seacube_active_org' };

export type Membership = {
  id: number;
  organization: { id: number; name: string };
  role?: { id: number; name: string; role_type: string } | null;
  profile?: { module_permissions: Record<string, string[]> } | null;
  is_default: boolean;
};

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_staff: boolean;
  memberships?: Membership[];
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeOrgId: number | null;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateProfile: (body: Partial<Pick<User, 'email' | 'first_name' | 'last_name' | 'phone'>>) => Promise<void>;
  setActiveOrg: (id: number) => Promise<void>;
};

/** Pick the active org id: persisted value if still a valid membership, else the default membership. */
function resolveActiveOrg(memberships: Membership[] | undefined, persisted: number | null): number | null {
  if (!memberships || memberships.length === 0) return null;
  if (persisted != null && memberships.some((m) => m.organization.id === persisted)) return persisted;
  return (memberships.find((m) => m.is_default) ?? memberships[0]).organization.id;
}

export const useAuthStore = create<AuthState>((set, get) => {
  configureDataService({
    getAccessToken: () => storageGet(TOKEN_KEYS.access),
    getRefreshToken: () => storageGet(TOKEN_KEYS.refresh),
    setTokens: async (access, refresh) => {
      await storageSet(TOKEN_KEYS.access, access);
      await storageSet(TOKEN_KEYS.refresh, refresh);
    },
    clearTokens: async () => {
      await storageDel(TOKEN_KEYS.access);
      await storageDel(TOKEN_KEYS.refresh);
    },
    getActiveOrgId: () => get().activeOrgId,
  });

  const applyUser = async (user: User) => {
    const persisted = Number(await storageGet(TOKEN_KEYS.activeOrg)) || null;
    const activeOrgId = resolveActiveOrg(user.memberships, persisted);
    if (activeOrgId != null) await storageSet(TOKEN_KEYS.activeOrg, String(activeOrgId));
    set({ user, isAuthenticated: true, activeOrgId });
  };

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    activeOrgId: null,

    initialize: async () => {
      set({ isLoading: true });
      try {
        const access = await storageGet(TOKEN_KEYS.access);
        if (access) {
          const user = await AuthService.getMe() as User;
          await applyUser(user);
        }
      } catch {
        await get().logout();
      } finally {
        set({ isLoading: false });
      }
    },

    login: async (username, password) => {
      const user = await AuthService.login(username, password) as User;
      await applyUser(user);
    },

    logout: async () => {
      await AuthService.logout();
      await storageDel(TOKEN_KEYS.activeOrg);
      set({ user: null, isAuthenticated: false, activeOrgId: null });
    },

    fetchMe: async () => {
      const user = await AuthService.getMe() as User;
      await applyUser(user);
    },

    updateProfile: async (body) => {
      const user = await AuthService.updateMe(body) as User;
      await applyUser(user);
    },

    setActiveOrg: async (id) => {
      await storageSet(TOKEN_KEYS.activeOrg, String(id));
      set({ activeOrgId: id });
    },
  };
});

/** The membership for the user's currently active organization (or null). */
export const useActiveMembership = () =>
  useAuthStore((s) => s.user?.memberships?.find((m) => m.organization.id === s.activeOrgId) ?? null);

/** Whether the active user is an admin of the active org (or platform staff) — mirrors backend IsAdminRole. */
export const useIsActiveAdmin = () =>
  useAuthStore((s) => {
    if (s.user?.is_staff) return true;
    const m = s.user?.memberships?.find((mm) => mm.organization.id === s.activeOrgId);
    return m?.role?.role_type === "ADMIN";
  });

/**
 * Whether the active user may perform `action` (view/create/update/delete) on a
 * module. Elevated users (staff / active ADMIN) bypass profile checks — mirrors
 * backend HasModulePermission. Use to hide mutation controls a user can't use.
 */
export const useCan = (moduleKey: string, action: string) =>
  useAuthStore((s) => {
    if (s.user?.is_staff) return true;
    const m = s.user?.memberships?.find((mm) => mm.organization.id === s.activeOrgId);
    if (m?.role?.role_type === "ADMIN") return true;
    return (m?.profile?.module_permissions?.[moduleKey] ?? []).includes(action);
  });
