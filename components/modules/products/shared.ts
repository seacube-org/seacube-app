import { useEffect, useMemo, useState } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { useAuthStore } from "@/stores/authStore";
import { rows } from "@/utils/pagination";
import { API_ENDPOINTS } from "@/constants/Constants";
import i18n from "@/locale/i18n";

// `initials` is a generic name→avatar-text helper; reuse the contacts one rather
// than cloning it. Re-exported so product consumers import it from this module.
export { initials } from "@/components/modules/contacts/shared";

export const PRODUCTS_URL = API_ENDPOINTS.products;
export const PRODUCT_ATTRIBUTES_URL = API_ENDPOINTS.productAttributes;

// Unit codes come from the backend OptionSet 'unit' category (org-extensible),
// so this is an open string; unitLabel() pretty-prints the common ones.
export type ProductUnit = string;

// Global, cross-product attribute definition (admin-managed). The same `glazing`
// or `size` attribute is reused across many products via assignments.
export type ProductAttributeDataType = "text" | "decimal" | "percent" | "boolean" | "choice" | "choice_or_custom";

export type ProductAttribute = {
  id: number;
  code: string;
  name: string;
  data_type: ProductAttributeDataType;
  choices: string[] | null;
  unit: string;
};

// Binds a global attribute to a product, with per-product required/order. `id` is
// present for existing rows (diff-by-id on nested save); new rows omit it and
// carry `attribute_id` instead.
export type ProductAttributeAssignment = {
  id?: number;
  attribute: ProductAttribute;
  is_required: boolean;
  sort_order: number;
};

// Row shape returned by the list endpoint (ProductListSerializer).
export type ProductRow = {
  id: number;
  name: string;
  code: string;
  category: string;
  base_unit: ProductUnit;
  default_tax_rate: string; // decimal fraction, e.g. "0.1300"
  is_active: boolean;
  created_at: string;
};

// Full shape returned by the detail endpoint (ProductDetailSerializer).
export type ProductDetail = ProductRow & {
  description: string;
  // Spec→line-description template ("@size 镀冰@glazing"); see renderSpecTemplate.
  description_template: string;
  attribute_assignments: ProductAttributeAssignment[];
  updated_at: string;
};

/** Auth-aware viewset for products — routed through useDataService so a 401 logs out. */
export function useProductViewSet() {
  const { getViewSet } = useDataService();
  return useMemo(() => getViewSet(PRODUCTS_URL), [getViewSet]);
}

/**
 * Loads the global ProductAttribute catalog (admin-managed; the backend serves it
 * org-independently — `objects.all()`, globally-unique codes). Listing is
 * admin-only, so a non-admin product editor gets an empty list (the form then
 * only shows attributes already assigned to the product). Cached at module scope
 * (like useReferenceOptions) so the form drawer doesn't refetch on every open.
 *
 * Only successful responses are cached — a 403/transient error is NOT cached, so
 * a later open (e.g. after an admin signs in within the same session) retries
 * instead of being stuck on an empty catalog. Keyed by signed-in user so an
 * admin's catalog isn't reused for a different (non-admin) user in the same
 * session (the endpoint is admin-only; readability differs per user).
 */
const _attrCache = new Map<string, ProductAttribute[]>();
const _attrInflight = new Map<string, Promise<ProductAttribute[]>>();

export function useProductAttributes(enabled = true): { attributes: ProductAttribute[]; loading: boolean } {
  const { getViewSet } = useDataService();
  const userKey = String(useAuthStore((s) => s.user?.id) ?? "");
  const [attributes, setAttributes] = useState<ProductAttribute[]>(_attrCache.get(userKey) ?? []);
  const [loading, setLoading] = useState(!_attrCache.has(userKey) && enabled);

  useEffect(() => {
    if (!enabled || _attrCache.has(userKey)) {
      if (_attrCache.has(userKey)) setAttributes(_attrCache.get(userKey)!);
      return;
    }
    let active = true;
    let inflight = _attrInflight.get(userKey);
    if (!inflight) {
      inflight = getViewSet(PRODUCT_ATTRIBUTES_URL)
        .list({ params: { page_size: 1000 } })
        .then((data) => {
          // Cache successful responses only (an empty list is a valid catalog).
          const out = rows<ProductAttribute>(data);
          _attrCache.set(userKey, out);
          return out;
        })
        .catch(() => {
          // Forbidden (non-admin) or transient network error: don't cache, so the
          // next open retries instead of being pinned to an empty catalog.
          return [] as ProductAttribute[];
        })
        .finally(() => {
          _attrInflight.delete(userKey);
        });
      _attrInflight.set(userKey, inflight);
    }
    inflight.then((out) => {
      if (!active) return;
      setAttributes(out);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [enabled, getViewSet, userKey]);

  return { attributes, loading };
}

/**
 * Drop every cached attribute catalog so the next product-form open refetches.
 * Call after the settings page creates/edits/deletes a ProductAttribute (mirrors
 * invalidateReferenceOptions for credit periods).
 */
export function invalidateProductAttributes(): void {
  _attrCache.clear();
  _attrInflight.clear();
}

export function unitLabel(u: ProductUnit | string | undefined): string {
  switch (u) {
    case "KGS":
      return i18n.t("products.unitKgs", { defaultValue: "千克 (KGS)" });
    case "LBS":
      return i18n.t("products.unitLbs", { defaultValue: "磅 (LBS)" });
    case "CTN":
      return i18n.t("products.unitCtn", { defaultValue: "箱 (CTN)" });
    case "PCS":
      return i18n.t("products.unitPcs", { defaultValue: "件 (PCS)" });
    default:
      return u ? String(u) : "—";
  }
}

/** Decimal tax fraction ("0.1300") → display percent ("13%"). Blank → "—". */
export function taxRatePercent(raw: string | number | null | undefined): string {
  if (raw == null || raw === "") return "—";
  const n = Number(raw);
  if (Number.isNaN(n)) return "—";
  // Trim trailing zeros: 13.00 → "13", 8.50 → "8.5".
  return `${Number((n * 100).toFixed(2))}%`;
}

/** Localized label for an attribute's data type — the single source for both the
 *  product detail table and the settings catalog (re-exported there). */
export function attributeTypeLabel(t: ProductAttributeDataType): string {
  switch (t) {
    case "text":
      return i18n.t("productAttribute.typeText", { defaultValue: "文本" });
    case "decimal":
      return i18n.t("productAttribute.typeDecimal", { defaultValue: "数值" });
    case "percent":
      return i18n.t("productAttribute.typePercent", { defaultValue: "百分比" });
    case "boolean":
      return i18n.t("productAttribute.typeBoolean", { defaultValue: "布尔" });
    case "choice":
      return i18n.t("productAttribute.typeChoice", { defaultValue: "单选" });
    case "choice_or_custom":
      return i18n.t("productAttribute.typeChoiceCustom", { defaultValue: "单选或自定义" });
    default:
      return t;
  }
}
