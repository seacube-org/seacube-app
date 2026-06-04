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

// Canonical DRF list-unwrap lives in utils; re-exported here so existing
// `import { rows } from ".../access/shared"` call sites keep working.
export { rows } from "@/utils/pagination";

// Fetch all rows in one page: roles/profiles also feed the drawer dropdowns, so
// they must be complete, and the users table shouldn't silently truncate to 20.
// Capped by the backend's max_page_size (1000).
export const FETCH_ALL = { page_size: 1000 };

// Shared antd Table pagination for the access tables (client-side over FETCH_ALL).
export const ACCESS_PAGINATION = { pageSize: 10, hideOnSinglePage: true, showSizeChanger: false };

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
  is_active: boolean;
  role: { id: number; name: string; role_type: RoleType } | null;
  profile: { id: number; name: string } | null;
};

export type ManifestModule = { key: string; label: string; section: string };

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

/** antd Tag colour by role type — shared by the users + roles tables for consistency. */
export function roleTypeColor(t: RoleType): string {
  switch (t) {
    case "ADMIN":
      return "gold";
    case "MANAGER":
      return "blue";
    default:
      return "default";
  }
}

/** antd Select options for the role / profile pickers (member + invite drawers). */
export const roleOptions = (roles: Role[]) =>
  roles.map((r) => ({ value: r.id, label: `${r.name} · ${roleTypeLabel(r.role_type)}` }));

export const profileOptions = (profiles: Profile[]) =>
  profiles.map((p) => ({ value: p.id, label: p.name }));

// Individual permission actions (Bigin-style per-module checkboxes). Canonical
// order — used to keep stored lists and the summary text stable.
export const PERM_ACTIONS = ["view", "create", "update", "delete"] as const;

export function actionLabel(action: string): string {
  switch (action) {
    case "view":
      return i18n.t("access.actView", { defaultValue: "查看" });
    case "create":
      return i18n.t("access.actCreate", { defaultValue: "新建" });
    case "update":
      return i18n.t("access.actUpdate", { defaultValue: "编辑" });
    case "delete":
      return i18n.t("access.actDelete", { defaultValue: "删除" });
    default:
      return action;
  }
}

/** Comma summary of a module's actions in canonical order (or "无权限" when empty). */
export function actionsSummary(actions: string[]): string {
  const ordered = PERM_ACTIONS.filter((a) => actions.includes(a));
  return ordered.length
    ? ordered.map(actionLabel).join("、")
    : i18n.t("access.levelNone", { defaultValue: "无权限" });
}

// Localized labels for the permission manifest (backend ships English labels).
// [i18nKey, zh default] — the keys aren't in the locale files yet, so the default
// carries the Chinese label. Falls back to the backend label when not mapped here.
const SECTION_LABELS: Record<string, [string, string]> = {
  Contacts: ["access.secContacts", "联系人"],
  Sales: ["access.secSales", "销售"],
  Purchases: ["access.secPurchases", "采购"],
  Inventory: ["access.secInventory", "库存"],
  Production: ["access.secProduction", "生产"],
  Logistics: ["access.secLogistics", "物流"],
  Accounting: ["access.secAccounting", "会计"],
  Reports: ["access.secReports", "报表"],
};

const MODULE_LABELS: Record<string, [string, string]> = {
  contacts: ["access.modContacts", "联系人"],
  sales_quotes: ["access.modQuotes", "报价单"],
  sales_orders: ["access.modSalesOrders", "销售订单"],
  sales_invoices: ["access.modInvoices", "发票"],
  sales_payments: ["access.modPaymentsIn", "收款"],
  sales_credit_notes: ["access.modCreditNotes", "贷项通知单"],
  purchases_orders: ["access.modPurchaseOrders", "采购订单"],
  purchases_receipts: ["access.modGoodsReceipts", "收货单"],
  purchases_bills: ["access.modBills", "账单"],
  purchases_payments: ["access.modVendorPayments", "付款"],
  purchases_credits: ["access.modVendorCredits", "供应商贷项"],
  inventory_products: ["access.modProducts", "产品"],
  inventory_warehouses: ["access.modWarehouses", "仓库"],
  inventory_adjustments: ["access.modAdjustments", "库存调整"],
  production: ["access.modProduction", "生产与 BOM"],
  logistics: ["access.modLogistics", "出库与发运"],
  accounting: ["access.modAccounting", "会计"],
  reports: ["access.modReports", "报表"],
};

export function sectionLabel(section: string): string {
  const e = SECTION_LABELS[section];
  return e ? i18n.t(e[0], { defaultValue: e[1] }) : section;
}

export function moduleLabel(key: string, fallback: string): string {
  const e = MODULE_LABELS[key];
  return e ? i18n.t(e[0], { defaultValue: e[1] }) : fallback;
}
