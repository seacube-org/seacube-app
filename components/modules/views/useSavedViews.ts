import { useCallback, useEffect, useMemo, useState } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { useLocaleStore } from "@/stores/localeStore";
import { API_ENDPOINTS } from "@/constants/Constants";
import { rows } from "@/utils/pagination";
import type { FieldDef, SavedView } from "./types";

/**
 * Loads (and mutates) the saved views + filter-field schema for one entity.
 * Field schema rarely changes, so it's fetched once alongside the views.
 */
export function useSavedViews(entity: string) {
  const { getViewSet } = useDataService();
  // System-view names + field labels are localized server-side (Accept-Language),
  // so refetch when the locale changes.
  const locale = useLocaleStore((s) => s.locale);
  const viewsVS = useMemo(() => getViewSet(API_ENDPOINTS.savedViews), [getViewSet]);
  const fieldsVS = useMemo(() => getViewSet(API_ENDPOINTS.savedViewFields), [getViewSet]);

  const [views, setViews] = useState<SavedView[]>([]);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [v, f] = await Promise.all([
        viewsVS.list({ params: { entity, page_size: 1000 } }),
        fieldsVS.list({ params: { entity } }),
      ]);
      setViews(rows<SavedView>(v));
      setFields((f as FieldDef[]) ?? []);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewsVS, fieldsVS, entity, locale]);

  useEffect(() => { reload(); }, [reload]);

  const createView = useCallback(
    (body: Partial<SavedView>) => viewsVS.create({ body: { ...body, entity } }) as Promise<SavedView>,
    [viewsVS, entity],
  );
  const updateView = useCallback(
    (id: number, body: Partial<SavedView>) => viewsVS.update({ id, body }) as Promise<SavedView>,
    [viewsVS],
  );
  const deleteView = useCallback((id: number) => viewsVS.delete({ id }), [viewsVS]);
  const setDefault = useCallback(
    (id: number) => viewsVS.action({ id, action: "set_default" }) as Promise<SavedView>,
    [viewsVS],
  );
  const setFavorite = useCallback(
    (id: number, on: boolean) => viewsVS.action({ id, action: on ? "favorite" : "unfavorite" }) as Promise<SavedView>,
    [viewsVS],
  );

  return { views, fields, loading, reload, createView, updateView, deleteView, setDefault, setFavorite };
}
