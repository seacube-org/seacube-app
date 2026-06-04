import { useCallback, useMemo, useRef } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";

export type UiState = {
  entity: string;
  active_view: number | null;
  active_view_key: string;
  state: Record<string, unknown>;
};

type SaveBody = { active_view: number | null; active_view_key: string; state: Record<string, unknown> };

/**
 * Implicit "resume where you left off" state for a list. `load` returns null when
 * the user has no saved state yet; `save` upserts (POST) the active view + bag.
 *
 * Writes are point-of-click low frequency, so instead of write-behind we just
 * diff-guard: skip the POST when the payload matches what's already persisted
 * (re-selecting the same view, a no-op apply, etc.). The high-frequency source
 * (column widths) lives in localStorage and never reaches here.
 */
export function useUiState(entity: string) {
  const { getViewSet } = useDataService();
  const vs = useMemo(() => getViewSet(API_ENDPOINTS.uiState), [getViewSet]);
  const lastSaved = useRef("");

  const load = useCallback(async (): Promise<UiState | null> => {
    const data = (await vs.list({ params: { entity } })) as Partial<UiState> | Record<string, never>;
    if (!data || !("active_view_key" in data)) return null;
    const ui = data as UiState;
    // Seed the diff-guard so re-selecting the restored view doesn't write it back.
    lastSaved.current = JSON.stringify({ active_view: ui.active_view, active_view_key: ui.active_view_key, state: ui.state });
    return ui;
  }, [vs, entity]);

  const save = useCallback((body: SaveBody) => {
    const key = JSON.stringify(body);
    if (key === lastSaved.current) return Promise.resolve(undefined);
    // Optimistically set so concurrent identical writes coalesce, but roll back
    // on failure — callers swallow the error, so a stuck guard would otherwise
    // prevent ever retrying that state.
    const prev = lastSaved.current;
    lastSaved.current = key;
    return vs.create({ body: { ...body, entity } }).catch((e) => {
      lastSaved.current = prev;
      throw e;
    });
  }, [vs, entity]);

  return { load, save };
}
