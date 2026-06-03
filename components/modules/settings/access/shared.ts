import { useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import i18n from "@/locale/i18n";

// Admin-only auth endpoints (org-scoped on the backend).
export const ACCESS_URLS = {
  users: "/api/auth/users",
  roles: "/api/auth/roles",
  profiles: "/api/auth/profiles",
  manifest: "/api/auth/permission-manifest",
} as const;

/**
 * Auth-aware viewsets for the access module. Routed through useDataService so a
 * session expiry (401/AuthError) logs out + redirects to /login, like the rest
 * of the app — instead of silently failing inside a tab's error toast.
 */
export function useAccessViewSets() {
  const { getViewSet } = useDataService();
  return useMemo(
    () => ({
      usersVS: getViewSet(ACCESS_URLS.users),
      rolesVS: getViewSet(ACCESS_URLS.roles),
      profilesVS: getViewSet(ACCESS_URLS.profiles),
      manifestVS: getViewSet(ACCESS_URLS.manifest),
    }),
    [getViewSet],
  );
}

type ListViewSet = { list: () => Promise<unknown> };

export type RoleType = "ADMIN" | "MANAGER" | "STAFF";

export type Role = {
  id: number;
  name: string;
  role_type: RoleType;
  parent: number | null;
  is_peer_visible: boolean;
  description: string;
};

export type Profile = {
  id: number;
  name: string;
  description: string;
  module_permissions: Record<string, string[]>;
  is_system: boolean;
};

export type Member = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: { id: number; name: string; role_type: RoleType } | null;
  profile: { id: number; name: string } | null;
};

export type ManifestModule = { key: string; label: string; section: string };

/** DRF list endpoints are paginated ({results}); a few aren't. Unwrap either. */
export function rows<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const r = (res as { results?: T[] } | null)?.results;
  return Array.isArray(r) ? r : [];
}

export async function fetchManifest(manifestVS: ListViewSet): Promise<ManifestModule[]> {
  const data = (await manifestVS.list()) as { modules?: ManifestModule[] };
  return data.modules ?? [];
}

export function roleTypeLabel(t: RoleType): string {
  switch (t) {
    case "ADMIN":
      return i18n.t("access.roleAdmin", { defaultValue: "管理员" });
    case "MANAGER":
      return i18n.t("access.roleManager", { defaultValue: "经理" });
    default:
      return i18n.t("access.roleStaff", { defaultValue: "员工" });
  }
}

export const ROLE_TYPE_OPTIONS: { value: RoleType }[] = [
  { value: "ADMIN" },
  { value: "MANAGER" },
  { value: "STAFF" },
];

// Cumulative access levels mapped to the backend's action lists. Each level
// implies all lower ones, matching how the manifest documents permission sets.
export type PermLevel = "none" | "view" | "create" | "update" | "full";

const LEVEL_ACTIONS: Record<PermLevel, string[]> = {
  none: [],
  view: ["view"],
  create: ["view", "create"],
  update: ["view", "create", "update"],
  full: ["view", "create", "update", "delete"],
};

export const PERM_LEVELS: PermLevel[] = ["none", "view", "create", "update", "full"];

export function permLevelLabel(level: PermLevel): string {
  switch (level) {
    case "none":
      return i18n.t("access.levelNone", { defaultValue: "无权限" });
    case "view":
      return i18n.t("access.levelView", { defaultValue: "查看" });
    case "create":
      return i18n.t("access.levelCreate", { defaultValue: "查看 + 新建" });
    case "update":
      return i18n.t("access.levelUpdate", { defaultValue: "查看 + 编辑" });
    default:
      return i18n.t("access.levelFull", { defaultValue: "完全权限" });
  }
}

export function actionsToLevel(actions?: string[]): PermLevel {
  const set = new Set(actions ?? []);
  if (set.has("delete")) return "full";
  if (set.has("update")) return "update";
  if (set.has("create")) return "create";
  if (set.has("view")) return "view";
  return "none";
}

export function levelToActions(level: PermLevel): string[] {
  return LEVEL_ACTIONS[level];
}
