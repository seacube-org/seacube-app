import { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { ApiError } from "@/services/DataService";
import i18n from "@/locale/i18n";
import type { DocAction } from "./types";

/** Pull a human message out of a DRF error payload, if any. */
function backendDetail(e: unknown): string | null {
  if (!(e instanceof ApiError) || !e.data) return null;
  const d = e.data as Record<string, unknown> | string;
  if (typeof d === "string") return d;
  if (typeof d.detail === "string") return d.detail;
  // First field error, e.g. {"line_items": ["..."]} or a bare ["..."].
  const first = Array.isArray(d) ? d[0] : Object.values(d)[0];
  if (Array.isArray(first)) return String(first[0]);
  return typeof first === "string" ? first : null;
}

/**
 * Generic sales-document detail loader. Loads one record from `endpoint` and
 * exposes `reload`, `remove`, and `runAction` (status transitions / conversions).
 * Mirrors useContactDetail; `getViewSet` already routes auth errors to logout, so
 * these catches only own the user-facing toast.
 */
export function useDocumentDetail<T extends { id: number }>(endpoint: string, id: number | null) {
  const { getViewSet } = useDataService();
  const vs = useMemo(() => getViewSet(endpoint), [getViewSet, endpoint]);
  const { message } = App.useApp();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (id == null) return;
    setLoading(true);
    try {
      setData((await vs.retrieve({ id })) as T);
    } catch {
      // Clear stale data so the detail screen shows its not-found state instead of
      // rendering the previously loaded document (e.g. id changed to a deleted one).
      setData(null);
      message.error(i18n.t("sales.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [id, vs, message]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = useCallback(async (): Promise<boolean> => {
    if (id == null) return false;
    try {
      await vs.delete({ id });
      message.success(i18n.t("sales.deleted", { defaultValue: "已删除" }));
      return true;
    } catch (e) {
      message.error(backendDetail(e) ?? i18n.t("sales.deleteFailed", { defaultValue: "删除失败" }));
      return false;
    }
  }, [id, vs, message]);

  /** Run a status transition / conversion action, then reload. Returns the response. */
  const runAction = useCallback(
    async (a: DocAction): Promise<unknown> => {
      if (id == null) return null;
      try {
        const res = await vs.action({ id, action: a.action, method: "POST", body: a.body });
        message.success(i18n.t("sales.actionDone", { defaultValue: "操作成功" }));
        await reload();
        return res;
      } catch (e) {
        message.error(backendDetail(e) ?? i18n.t("sales.actionFailed", { defaultValue: "操作失败" }));
        throw e;
      }
    },
    [id, vs, message, reload],
  );

  return { data, loading, reload, remove, runAction };
}
