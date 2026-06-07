import { useEffect, useMemo, useState } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { API_ENDPOINTS } from "@/constants/Constants";

export type ReferenceOption = { value: string; label: string; meta?: Record<string, unknown> };

/**
 * Unified, cached reader for backend reference/config options — mirrors the
 * backend registry's `resolve_choices`. `ref` is either:
 *   - 'currency'            → core Currency master table (dedicated model)
 *   - 'optionset:<category>'→ core OptionSet generic table (incoterms, …)
 * The frontend is unified at the read layer; the backend keeps the right home
 * for each (dedicated model vs generic table). See docs/schema-driven-forms.md.
 */

type Target = {
  url: string;
  params: Record<string, string>;
  map: (row: Record<string, unknown>) => ReferenceOption;
  // Cache-key dimensions for refs whose rows/labels aren't global master data:
  // credit_period rows are per-org (orgScoped) and its labels are localized
  // server-side (localeScoped), so its cache must not be shared across either.
  orgScoped?: boolean;
  localeScoped?: boolean;
};

function targetFor(ref: string): Target | null {
  if (ref === "currency") {
    return {
      url: API_ENDPOINTS.currencies,
      params: {},
      map: (r) => ({
        value: String(r.code),
        label: `${r.name} (${r.code})`,
        meta: { symbol: r.symbol, decimal_places: r.decimal_places },
      }),
    };
  }
  if (ref === "credit_period") {
    return {
      url: API_ENDPOINTS.creditPeriods,
      params: {},
      orgScoped: true,
      localeScoped: true,
      // Value is the FK id (as a string, like other refs); `label` is the
      // locale-aware display label (falls back to the raw name).
      map: (r) => ({
        value: String(r.id),
        label: String(r.label ?? r.name),
        meta: { term_type: r.term_type, days: r.days },
      }),
    };
  }
  if (ref.startsWith("optionset:")) {
    return {
      url: API_ENDPOINTS.optionSets,
      params: { category: ref.slice("optionset:".length) },
      map: (r) => ({
        value: String(r.code),
        label: String(r.label),
        meta: (r.meta as Record<string, unknown>) ?? undefined,
      }),
    };
  }
  return null;
}

// Module-level cache shared across hook instances. Keyed by `ref`, plus org and/or
// locale when the target opts in (see Target.orgScoped / localeScoped); currency
// and OptionSet labels are locale-invariant master data, so plain `ref`.
const _cache = new Map<string, ReferenceOption[]>();
const _inflight = new Map<string, Promise<ReferenceOption[]>>();

/**
 * Drop all cached options for `ref` (across every org/locale dimension). Call
 * after mutating the underlying reference data (e.g. the credit-period settings
 * page) so consumers refetch the fresh list on their next mount.
 */
export function invalidateReferenceOptions(ref: string): void {
  for (const map of [_cache, _inflight] as Map<string, unknown>[]) {
    for (const key of map.keys()) {
      if (key === ref || key.startsWith(`${ref}:`)) map.delete(key);
    }
  }
}

export function useReferenceOptions(ref: string): ReferenceOption[] {
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const locale = useLocaleStore((s) => s.locale);
  const target = useMemo(() => targetFor(ref), [ref]);
  let cacheKey = ref;
  if (target?.orgScoped) cacheKey += `:${activeOrgId ?? ""}`;
  if (target?.localeScoped) cacheKey += `:${locale}`;
  const [items, setItems] = useState<ReferenceOption[]>(_cache.get(cacheKey) ?? []);
  const { getViewSet } = useDataService();

  useEffect(() => {
    if (_cache.has(cacheKey)) {
      setItems(_cache.get(cacheKey)!);
      return;
    }
    if (!target) return;
    let active = true;

    let p = _inflight.get(cacheKey);
    if (!p) {
      p = getViewSet(target.url)
        .list({ params: target.params })
        .then((data) => {
          const out = ((data as Record<string, unknown>[]) ?? []).map(target.map);
          _cache.set(cacheKey, out);
          return out;
        })
        .catch(() => {
          const out: ReferenceOption[] = [];
          _cache.set(cacheKey, out);
          return out;
        })
        .finally(() => {
          _inflight.delete(cacheKey);
        });
      _inflight.set(cacheKey, p);
    }
    p.then((out) => {
      if (active) setItems(out);
    });
    return () => {
      active = false;
    };
  }, [cacheKey, target, getViewSet]);

  return items;
}
