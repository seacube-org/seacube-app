import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import i18n from "@/locale/i18n";
import { useContactViewSet, type ContactDetail } from "@/components/modules/contacts/shared";

/**
 * Loads one contact and exposes `reload` + `remove` (both toast on failure).
 * `remove` returns true on success so the caller can navigate away.
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

  useEffect(() => { reload(); }, [reload]);

  const remove = useCallback(async (): Promise<boolean> => {
    if (contactId == null) return false;
    try {
      await vs.delete({ id: contactId });
      message.success(i18n.t("contacts.deleted", { defaultValue: "已删除" }));
      return true;
    } catch {
      message.error(i18n.t("contacts.deleteFailed", { defaultValue: "删除失败" }));
      return false;
    }
  }, [contactId, vs, message]);

  return { contact, loading, reload, remove };
}
