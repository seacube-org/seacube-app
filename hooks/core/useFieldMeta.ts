import { useEffect, useState } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";

export type FieldMeta = {
  type?: string;            // DRF OPTIONS type: string/email/integer/choice/boolean/date/...
  choices: { value: string; label: string }[];
  required: boolean;
  label?: string;
  max_length?: number;
  children?: FieldMetaMap;  // nested serializer fields (list item or nested object)
};
type FieldMetaMap = Record<string, FieldMeta>;

/** What `useFieldMeta` returns; passed to <SchemaField>. */
export type FieldSchema = {
  meta: FieldMetaMap | null;
  loading: boolean;
  field: (name: string) => FieldMeta | undefined;
  /** Localized field label from OPTIONS, or `fallback` while loading / if absent. */
  label: (name: string, fallback: string) => string;
  choices: (name: string) => { value: string; label: string }[];
  required: (name: string) => boolean;
  maxLength: (name: string) => number | undefined;
  has: (name: string) => boolean;
  /** Sub-schema for a nested serializer field (e.g. a Form.List item or nested object). */
  nested: (name: string) => FieldSchema;
};

// DRF OPTIONS metadata, cached per (locale, endpoint). Labels/choices are
// localized server-side via Accept-Language, so the key includes locale; it
// otherwise changes only on backend deploy.
const _cache = new Map<string, FieldMetaMap>();
const _inflight = new Map<string, Promise<FieldMetaMap>>();

type OptionsActionField = {
  type?: string; required?: boolean; label?: string; max_length?: number;
  choices?: { value: string | number; display_name: string }[];
  // Nested serializers: `child.children` for many=True lists, `children` for a
  // single nested object (DRF SimpleMetadata).
  child?: { children?: Record<string, OptionsActionField> };
  children?: Record<string, OptionsActionField>;
};

function parseFields(fields: Record<string, OptionsActionField>): FieldMetaMap {
  const out: FieldMetaMap = {};
  for (const [name, f] of Object.entries(fields)) {
    const childFields = f.child?.children ?? f.children;
    out[name] = {
      type: f.type,
      choices: (f.choices ?? []).map((c) => ({ value: String(c.value), label: c.display_name })),
      required: !!f.required,
      label: f.label,
      max_length: f.max_length,
      ...(childFields ? { children: parseFields(childFields) } : {}),
    };
  }
  return out;
}

function parse(data: unknown): FieldMetaMap {
  const actions = (data as { actions?: Record<string, Record<string, OptionsActionField>> })?.actions ?? {};
  return parseFields(actions.POST ?? actions.PUT ?? {});
}

/** Build the FieldSchema accessor surface over a (possibly null/loading) field map. */
function buildSchema(meta: FieldMetaMap | null): FieldSchema {
  return {
    meta,
    loading: meta === null,
    field: (name) => meta?.[name],
    label: (name, fallback) => meta?.[name]?.label || fallback,
    choices: (name) => meta?.[name]?.choices ?? [],
    required: (name) => meta?.[name]?.required ?? false,
    maxLength: (name) => meta?.[name]?.max_length,
    // True while loading (don't hide fields prematurely); once loaded, a field
    // absent from the schema (e.g. staff-hidden) should not render.
    has: (name) => meta === null || name in meta,
    // While loading, propagate null so the nested schema also reports loading.
    nested: (name) => buildSchema(meta === null ? null : (meta[name]?.children ?? {})),
  };
}

/**
 * Read a viewset's field metadata (choices/required/label) from DRF OPTIONS, so
 * forms render genuine enums (e.g. status, type) from the server schema instead
 * of hardcoded lists. (Reference data like currency lives in its own table — use
 * useReferenceOptions('currency') for that.)
 */
export function useFieldMeta(endpoint: string): FieldSchema {
  // Keyed by (org, locale, endpoint): OPTIONS is role/org-sensitive (e.g. STAFF
  // omits hidden fields, permissions affect actions) and locale-sensitive
  // (localized labels/choices). Switching org or language re-fetches; the request
  // carries X-Organization-Id + Accept-Language via DataService.
  const locale = useLocaleStore((s) => s.locale);
  const orgId = useAuthStore((s) => s.activeOrgId);
  const key = `${orgId ?? ""}::${locale}::${endpoint}`;
  const [meta, setMeta] = useState<FieldMetaMap | null>(_cache.get(key) ?? null);
  const { getViewSet } = useDataService();

  useEffect(() => {
    if (_cache.has(key)) { setMeta(_cache.get(key)!); return; }
    let active = true;
    let p = _inflight.get(key);
    if (!p) {
      p = getViewSet(endpoint).options()
        .then((data) => { const m = parse(data); _cache.set(key, m); return m; })
        .catch(() => { const m: FieldMetaMap = {}; _cache.set(key, m); return m; })
        .finally(() => { _inflight.delete(key); });
      _inflight.set(key, p);
    }
    p.then((m) => { if (active) setMeta(m); });
    return () => { active = false; };
  }, [key, endpoint, getViewSet]);

  return buildSchema(meta);
}
