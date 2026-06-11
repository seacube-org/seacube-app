import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Button, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCan } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import EntityListView from "@/components/modules/views/EntityListView";
import type { ColumnOverride } from "@/hooks/core/useEntityColumns";
import StatusTag from "@/components/ui/StatusTag";
import { amount } from "@/components/modules/sales/shared/format";
import InvoiceFormDrawer from "@/components/modules/sales/invoice/InvoiceFormDrawer";
import { INVOICES_URL, type InvoiceRow } from "@/components/modules/sales/invoice/shared";

export default function InvoicesPage() {
  const router = useRouter();
  const canCreate = useCan("sales_invoices", "create");
  const { token } = theme.useToken();
  const [formOpen, setFormOpen] = useState(false);

  // Domain cells: lifecycle status tag (display_status, OVERDUE-aware) and the
  // two money columns. Everything else falls back to the schema renderer.
  const columnOverrides = useMemo<Record<string, ColumnOverride>>(
    () => ({
      status: { render: (_, r) => <StatusTag status={(r as InvoiceRow).display_status} /> },
      total_amount: { align: "right", render: (v) => amount(v) },
      amount_paid: { align: "right", render: (v) => amount(v) },
    }),
    [],
  );

  return (
    <EntityListView
      entity="invoice"
      endpoint={INVOICES_URL}
      moduleKey="sales_invoices"
      columnOverrides={columnOverrides}
      searchPlaceholder={i18n.t("sales.searchInvoices", { defaultValue: "搜索发票号或客户" })}
      onRowClick={(r) => router.push(`/(app)/(sales)/invoices/${r.id}` as Href)}
      renderSummary={(total) => (
        <span>
          {i18n.t("sales.invoicesTotal", { defaultValue: "发票总数" })} ·{" "}
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
            {i18n.t("sales.newInvoice", { defaultValue: "新建发票" })}
          </Button>
        ) : null
      }
      extras={({ refetch }) => (
        <InvoiceFormDrawer open={formOpen} invoice={null} onClose={() => setFormOpen(false)} onSaved={refetch} />
      )}
    />
  );
}
