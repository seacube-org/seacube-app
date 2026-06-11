import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Button, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCan } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import EntityListView from "@/components/modules/views/EntityListView";
import StatusTag from "@/components/ui/StatusTag";
import type { ColumnOverride } from "@/hooks/core/useEntityColumns";
import { amount } from "@/components/modules/sales/shared/format";
import CreditNoteFormDrawer from "@/components/modules/sales/credit-note/CreditNoteFormDrawer";
import { CREDIT_NOTES_URL, type CreditNoteRow } from "@/components/modules/sales/credit-note/shared";

export default function CreditNotesPage() {
  const router = useRouter();
  const canCreate = useCan("sales_credit_notes", "create");
  const { token } = theme.useToken();
  const [formOpen, setFormOpen] = useState(false);

  // Domain cells: colored status tag + right-aligned money amount. Everything
  // else falls back to the schema's by-type renderer. See useEntityColumns.
  const columnOverrides = useMemo<Record<string, ColumnOverride>>(
    () => ({
      status: { render: (v) => <StatusTag status={String(v ?? "")} /> },
      amount: { align: "right", render: (v) => amount(v) },
    }),
    [],
  );

  return (
    <EntityListView
      entity="credit_note"
      endpoint={CREDIT_NOTES_URL}
      moduleKey="sales_credit_notes"
      columnOverrides={columnOverrides}
      searchPlaceholder={i18n.t("sales.creditNoteSearchPlaceholder", { defaultValue: "搜索编号或客户" })}
      onRowClick={(r) => router.push(`/(app)/(sales)/credit-notes/${(r as CreditNoteRow).id}` as Href)}
      renderSummary={(total) => (
        <span>
          {i18n.t("sales.creditNotesTotal", { defaultValue: "贷项通知单总数" })} ·{" "}
          <b style={{ color: token.colorText }}>{total}</b>
        </span>
      )}
      actions={() =>
        canCreate ? (
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
            {i18n.t("sales.newCreditNote", { defaultValue: "新建贷项通知单" })}
          </Button>
        ) : null
      }
      extras={({ refetch }) => (
        <CreditNoteFormDrawer open={formOpen} creditNote={null} onClose={() => setFormOpen(false)} onSaved={refetch} />
      )}
    />
  );
}
