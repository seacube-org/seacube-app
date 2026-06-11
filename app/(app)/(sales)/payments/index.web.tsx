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
import PaymentFormDrawer from "@/components/modules/sales/payment/PaymentFormDrawer";
import { PAYMENTS_URL, paymentMethodLabel, type PaymentRow } from "@/components/modules/sales/payment/shared";

export default function PaymentsPage() {
  const router = useRouter();
  const canCreate = useCan("sales_payments", "create");
  const { token } = theme.useToken();
  const [formOpen, setFormOpen] = useState(false);

  // Domain cells: status tag, formatted amount, method label. Everything else
  // falls back to the schema's by-type renderer. See useEntityColumns.
  const columnOverrides = useMemo<Record<string, ColumnOverride>>(
    () => ({
      status: { render: (v) => <StatusTag status={String(v ?? "")} /> },
      amount: { align: "right", render: (v) => amount(v) },
      payment_method: { render: (v) => paymentMethodLabel(v as PaymentRow["payment_method"]) },
    }),
    [],
  );

  return (
    <EntityListView
      entity="payment_received"
      endpoint={PAYMENTS_URL}
      moduleKey="sales_payments"
      columnOverrides={columnOverrides}
      searchPlaceholder={i18n.t("sales.paymentsSearchPlaceholder", { defaultValue: "搜索收款单号或客户" })}
      onRowClick={(r) => router.push(`/(app)/(sales)/payments/${r.id}` as Href)}
      renderSummary={(total) => (
        <span>
          {i18n.t("sales.paymentsTotal", { defaultValue: "收款总数" })} ·{" "}
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
            {i18n.t("sales.newPayment", { defaultValue: "新建收款" })}
          </Button>
        ) : null
      }
      extras={({ refetch }) => (
        <PaymentFormDrawer open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} />
      )}
    />
  );
}
