import { createElement, useMemo } from "react";
import {
  HomeOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  DatabaseOutlined,
  ToolOutlined,
  CarOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import i18n from "@/locale/i18n";

// module_permissions values are action lists (['view','create','update','delete']).
export type ModulePermissions = Record<string, string[]>;

function canView(permissions: ModulePermissions | undefined, key: string): boolean {
  return permissions ? (permissions[key] ?? []).includes("view") : false;
}

/**
 * @param elevated  is_staff / superuser / active ADMIN role — these bypass
 *   profile checks on the backend, so they get the full menu (mirrors
 *   apps.authentication.permissions.HasModulePermission).
 */
export function useMenuItems(
  locale: string,
  perms: ModulePermissions | undefined,
  elevated = false,
): NonNullable<MenuProps["items"]> {
  return useMemo<NonNullable<MenuProps["items"]>>(() => {
    const can = (key: string) => elevated || canView(perms, key);
    const salesChildren = [
      can("sales_quotes") && {
        key: "quotes",
        label: i18n.t("sales.quotes"),
      },
      can("sales_orders") && {
        key: "salesOrders",
        label: i18n.t("sales.salesOrders"),
      },
      can("sales_invoices") && {
        key: "invoices",
        label: i18n.t("sales.invoices"),
      },
      can("sales_payments") && {
        key: "payments",
        label: i18n.t("sales.payments"),
      },
      can("sales_credit_notes") && {
        key: "creditNotes",
        label: i18n.t("sales.creditNotes"),
      },
    ].filter(Boolean) as NonNullable<MenuProps["items"]>;

    const purchasesChildren = [
      can("purchases_orders") && {
        key: "purchaseOrders",
        label: i18n.t("purchases.purchaseOrders"),
      },
      can("purchases_receipts") && {
        key: "goodsReceipts",
        label: i18n.t("purchases.goodsReceipts"),
      },
      can("purchases_bills") && {
        key: "bills",
        label: i18n.t("purchases.bills"),
      },
      can("purchases_payments") && {
        key: "vendorPayments",
        label: i18n.t("purchases.vendorPayments"),
      },
      can("purchases_credits") && {
        key: "vendorCredits",
        label: i18n.t("purchases.vendorCredits"),
      },
    ].filter(Boolean) as NonNullable<MenuProps["items"]>;

    const inventoryChildren = [
      can("inventory_products") && {
        key: "products",
        label: i18n.t("inventory.products"),
      },
      can("inventory_warehouses") && {
        key: "warehouses",
        label: i18n.t("inventory.warehouses"),
      },
      can("inventory_adjustments") && {
        key: "adjustments",
        label: i18n.t("inventory.adjustments"),
      },
    ].filter(Boolean) as NonNullable<MenuProps["items"]>;

    return [
      {
        key: "dashboard",
        icon: createElement(HomeOutlined),
        label: i18n.t("nav.dashboard"),
      },
      salesChildren.length > 0 && {
        key: "sales",
        icon: createElement(ShoppingCartOutlined),
        label: i18n.t("nav.sales"),
        children: salesChildren,
      },
      purchasesChildren.length > 0 && {
        key: "purchases",
        icon: createElement(ShoppingOutlined),
        label: i18n.t("nav.purchases"),
        children: purchasesChildren,
      },
      can("contacts") && {
        key: "contacts",
        icon: createElement(TeamOutlined),
        label: i18n.t("nav.contacts"),
      },
      inventoryChildren.length > 0 && {
        key: "inventory",
        icon: createElement(DatabaseOutlined),
        label: i18n.t("nav.inventory"),
        children: inventoryChildren,
      },
      can("production") && {
        key: "production",
        icon: createElement(ToolOutlined),
        label: i18n.t("nav.production"),
      },
      can("logistics") && {
        key: "logistics",
        icon: createElement(CarOutlined),
        label: i18n.t("nav.logistics"),
      },
    ].filter(Boolean) as NonNullable<MenuProps["items"]>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, perms, elevated]);
}
