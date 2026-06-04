import { useEffect, useState } from "react";
import { useDataService } from "@/hooks/core/useDataService";
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

type Target = { url: string; params: Record<string, string>; map: (row: Record<string, unknown>) => ReferenceOption };

function targetFor(ref: string): Target | null {
  if (ref === "currency") {
    return {
      url: API_ENDPOINTS.currencies, params: {},
      map: (r) => ({ value: String(r.code), label: `${r.name} (${r.code})`, meta: { symbol: r.symbol, decimal_places: r.decimal_places } }),
    };
  }
  if (ref.startsWith("optionset:")) {
    return {
      url: API_ENDPOINTS.optionSets, params: { category: ref.slice("optionset:".length) },
      map: (r) => ({ value: String(r.code), label: String(r.label), meta: (r.meta as Record<string, unknown>) ?? undefined }),
    };
  }
  return null;
}

// Cached by `ref` only (NOT locale, unlike useFieldMeta): reference labels are
// DB master data (Currency.name, OptionSet.label), locale-invariant by contract —
// not gettext-translated — so Accept-Language doesn't change them. If a reference
// label ever becomes localized server-side, key this by locale too.
const _cache = new Map<string, ReferenceOption[]>();
const _inflight = new Map<string, Promise<ReferenceOption[]>>();

export function useReferenceOptions(ref: string): ReferenceOption[] {
  const [items, setItems] = useState<ReferenceOption[]>(_cache.get(ref) ?? []);
  const { getViewSet } = useDataService();

  useEffect(() => {
    if (_cache.has(ref)) { setItems(_cache.get(ref)!); return; }
    const target = targetFor(ref);
    if (!target) return;
    let active = true;

    let p = _inflight.get(ref);
    if (!p) {
      p = getViewSet(target.url).list({ params: target.params })
        .then((data) => {
          const out = ((data as Record<string, unknown>[]) ?? []).map(target.map);
          _cache.set(ref, out);
          return out;
        })
        .catch(() => { const out: ReferenceOption[] = []; _cache.set(ref, out); return out; })
        .finally(() => { _inflight.delete(ref); });
      _inflight.set(ref, p);
    }
    p.then((out) => { if (active) setItems(out); });
    return () => { active = false; };
  }, [ref, getViewSet]);

  return items;
}
