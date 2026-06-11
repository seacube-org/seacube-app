import { useEffect, useMemo, useState } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { useAuthStore } from "@/stores/authStore";
import { rows } from "@/utils/pagination";
import { PRODUCTS_URL } from "@/components/modules/products/shared";
import type { ProductDetail, ProductRow } from "@/components/modules/products/shared";

// Light product list for the line-item product selector, cached per signed-in
// user (the product list is org-scoped via the active-org header, but a user
// only has one active org at a time so the user key is sufficient; switching org
// remounts via the layout Slot key, which clears component state but not this
// module cache — so we also key by active org id).
const _listCache = new Map<string, ProductRow[]>();
const _listInflight = new Map<string, Promise<ProductRow[]>>();

// Per-id product detail cache (carries attribute_assignments + defaults), shared
// across line-item rows so picking the same product twice doesn't refetch.
const _detailCache = new Map<number, ProductDetail>();
const _detailInflight = new Map<number, Promise<ProductDetail | null>>();

export type ProductCatalog = {
  products: ProductRow[];
  loading: boolean;
  byId: Map<number, ProductRow>;
  /** Fetch (and cache) a product's detail to read attribute_assignments / defaults. */
  loadDetail: (id: number) => Promise<ProductDetail | null>;
  getDetail: (id: number) => ProductDetail | undefined;
  /** Insert a freshly created product into the cached catalog (quick-add). */
  add: (p: ProductDetail) => void;
};

/**
 * Loads the org's product catalog for the line-item selector. `enabled` defers
 * the fetch until the form is actually open (mirrors useProductAttributes).
 */
export function useProductCatalog(enabled = true): ProductCatalog {
  const { getViewSet } = useDataService();
  const orgKey = String(useAuthStore((s) => s.activeOrgId) ?? "");
  const [products, setProducts] = useState<ProductRow[]>(_listCache.get(orgKey) ?? []);
  const [loading, setLoading] = useState(!_listCache.has(orgKey) && enabled);
  // Bump to re-render when an on-demand detail fetch resolves.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled || _listCache.has(orgKey)) {
      if (_listCache.has(orgKey)) setProducts(_listCache.get(orgKey)!);
      return;
    }
    let active = true;
    let inflight = _listInflight.get(orgKey);
    if (!inflight) {
      inflight = getViewSet(PRODUCTS_URL)
        .list({ params: { page_size: 1000, is_active: true } })
        .then((data) => {
          const out = rows<ProductRow>(data);
          _listCache.set(orgKey, out);
          return out;
        })
        .catch(() => [] as ProductRow[])
        .finally(() => _listInflight.delete(orgKey));
      _listInflight.set(orgKey, inflight);
    }
    inflight.then((out) => {
      if (!active) return;
      setProducts(out);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [enabled, getViewSet, orgKey]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const loadDetail = useMemo(
    () =>
      async (id: number): Promise<ProductDetail | null> => {
        if (_detailCache.has(id)) return _detailCache.get(id)!;
        let p = _detailInflight.get(id);
        if (!p) {
          p = getViewSet(PRODUCTS_URL)
            .retrieve({ id })
            .then((d) => {
              _detailCache.set(id, d as ProductDetail);
              return d as ProductDetail;
            })
            .catch(() => null)
            .finally(() => _detailInflight.delete(id));
          _detailInflight.set(id, p);
        }
        const detail = await p;
        setTick((n) => n + 1);
        return detail;
      },
    [getViewSet],
  );

  const getDetail = (id: number) => _detailCache.get(id);

  const add = useMemo(
    () => (p: ProductDetail) => {
      // The create response is the full detail — seed both caches so selecting
      // the new product prefills defaults without a refetch.
      _detailCache.set(p.id, p);
      const next = [...(_listCache.get(orgKey) ?? []), p];
      _listCache.set(orgKey, next);
      setProducts(next);
    },
    [orgKey],
  );

  return { products, loading, byId, loadDetail, getDetail, add };
}

/** Drop the cached product catalog (call after creating/editing products). */
export function invalidateProductCatalog(): void {
  _listCache.clear();
  _listInflight.clear();
  _detailCache.clear();
  _detailInflight.clear();
}
