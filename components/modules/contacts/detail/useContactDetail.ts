import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import i18n from "@/locale/i18n";
import { extractApiErrorMessage } from "@/utils/apiError";
import { useContactViewSet, type ContactDetail } from "@/components/modules/contacts/shared";

/**
 * Loads one contact and exposes `reload`, `setActive` (archive/reactivate) and
 * `remove`. `remove`/`setActive` toast on failure — surfacing the backend reason
 * when present (e.g. the delete guard naming the blocking documents) — and return
 * true on success so the caller can react.
 */
export function useContactDetail(contactId: number | null) {
  const vs = useContactViewSet();
  const { message } = App.useApp();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (contactId == null) return;
    setLoading(true);
    try {
      setContact((await vs.retrieve({ id: contactId })) as ContactDetail);
    } catch {
      message.error(i18n.t("contacts.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [contactId, vs, message]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = useCallback(async (): Promise<boolean> => {
    if (contactId == null) return false;
    try {
      await vs.delete({ id: contactId });
      message.success(i18n.t("contacts.deleted", { defaultValue: "已删除" }));
      return true;
    } catch (err) {
      // The delete guard returns a 400 explaining which documents block the delete
      // and steering toward archiving — show that reason instead of a generic toast.
      message.error(extractApiErrorMessage(err) ?? i18n.t("contacts.deleteFailed", { defaultValue: "删除失败" }));
      return false;
    }
  }, [contactId, vs, message]);

  // Archive (false) / reactivate (true) via a PATCH of is_active.
  const setActive = useCallback(
    async (active: boolean): Promise<boolean> => {
      if (contactId == null) return false;
      try {
        setContact((await vs.update({ id: contactId, body: { is_active: active } })) as ContactDetail);
        message.success(
          active
            ? i18n.t("contacts.reactivated", { defaultValue: "已恢复" })
            : i18n.t("contacts.archived", { defaultValue: "已停用" }),
        );
        return true;
      } catch (err) {
        message.error(extractApiErrorMessage(err) ?? i18n.t("contacts.saveFailed", { defaultValue: "操作失败" }));
        return false;
      }
    },
    [contactId, vs, message],
  );

  return { contact, loading, reload, remove, setActive };
}
