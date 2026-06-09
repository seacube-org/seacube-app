import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Avatar, Button, Tag, Typography, theme } from "antd";
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { useCan } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import EntityListView from "@/components/modules/views/EntityListView";
import type { ColumnOverride } from "@/hooks/core/useEntityColumns";
import ContactFormDrawer from "@/components/modules/contacts/ContactFormDrawer";
import {
  avatarColor,
  CONTACTS_URL,
  initials,
  typeColor,
  typeLabel,
  type ContactRow,
  type ContactType,
} from "@/components/modules/contacts/shared";

export default function ContactsPage() {
  const router = useRouter();
  const canCreate = useCan("contacts", "create");
  const { token } = theme.useToken();
  const [formOpen, setFormOpen] = useState(false);

  // Domain cells: avatar name, colored type tag, raw currency code. Everything
  // else falls back to the schema's by-type renderer. See useEntityColumns.
  const columnOverrides = useMemo<Record<string, ColumnOverride>>(
    () => ({
      name: {
        render: (v, r) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar
              size={24}
              style={{ background: avatarColor((r as ContactRow).type, token.colorPrimary), flexShrink: 0, fontSize: 11 }}
            >
              {initials(String(v ?? ""))}
            </Avatar>
            <Typography.Text strong ellipsis={{ tooltip: String(v ?? "") }}>
              {String(v ?? "")}
            </Typography.Text>
          </div>
        ),
      },
      type: { render: (v) => <Tag color={typeColor(v as ContactType)}>{typeLabel(v as ContactType)}</Tag> },
      currency: { render: (v) => (v ? String(v) : <Typography.Text type="secondary">—</Typography.Text>) },
    }),
    [token],
  );

  return (
    <EntityListView
      entity="contact"
      endpoint={CONTACTS_URL}
      moduleKey="contacts"
      columnOverrides={columnOverrides}
      searchPlaceholder={i18n.t("contacts.searchPlaceholder", { defaultValue: "搜索名称、邮箱或电话" })}
      onRowClick={(r) => router.push(`/(app)/contacts/${r.id}` as Href)}
      renderSummary={(total) => (
        <span>
          {i18n.t("contacts.total", { defaultValue: "联系人总数" })} · <b style={{ color: token.colorText }}>{total}</b>
        </span>
      )}
      actions={() => (
        <>
          <div style={{ display: "flex", padding: 3, borderRadius: 18, background: "#f4f7f9" }}>
            <Button
              shape="circle"
              icon={<UnorderedListOutlined />}
              style={{ width: 28, height: 28, border: 0, background: "#dff0fb", color: "#2277a8", boxShadow: "none" }}
            />
            <Button
              shape="circle"
              icon={<AppstoreOutlined />}
              style={{
                width: 28,
                height: 28,
                border: 0,
                background: "transparent",
                color: token.colorTextSecondary,
                boxShadow: "none",
              }}
            />
          </div>
          {canCreate && (
            <Button
              icon={<PlusOutlined />}
              onClick={() => setFormOpen(true)}
              style={{
                height: 32,
                border: 0,
                borderRadius: 18,
                paddingInline: 18,
                background: token.colorPrimary,
                color: "#fff",
                fontWeight: 700,
                boxShadow: "none",
              }}
            >
              {i18n.t("contacts.new", { defaultValue: "新建联系人" })}
            </Button>
          )}
          {/* The "..." overflow menu (export/refresh/reset widths) now lives in
              the shared EntityListView toolbar, so it's no longer rendered here. */}
        </>
      )}
      extras={({ refetch }) => (
        <ContactFormDrawer open={formOpen} contact={null} onClose={() => setFormOpen(false)} onSaved={refetch} />
      )}
    />
  );
}
