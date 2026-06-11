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
import SalesOrderFormDrawer from "@/components/modules/sales/sales-order/SalesOrderFormDrawer";
import { SO_ORDERS_URL, type SalesOrderRow } from "@/components/modules/sales/sales-order/shared";

export default function SalesOrdersPage() {
  const router = useRouter();
  const canCreate = useCan("sales_orders", "create");
  const { token } = theme.useToken();
  const [formOpen, setFormOpen] = useState(false);

  // Domain cells: lifecycle + the two derived status columns render as StatusTags
  // (status uses the EXPIRED/OVERDUE-aware display_status), total as a money string.
  // Everything else falls back to the schema's by-type renderer.
  const columnOverrides = useMemo<Record<string, ColumnOverride>>(
    () => ({
      status: { render: (v, r) => <StatusTag status={String((r as SalesOrderRow).display_status ?? v)} /> },
      invoice_status: { render: (v) => <StatusTag status={String(v ?? "")} /> },
      fulfillment_status: { render: (v) => <StatusTag status={String(v ?? "")} /> },
      total_amount: { align: "right", render: (v) => amount(v) },
    }),
    [],
  );

  return (
    <EntityListView
      entity="sales_order"
      endpoint={SO_ORDERS_URL}
      moduleKey="sales_orders"
      columnOverrides={columnOverrides}
      searchPlaceholder={i18n.t("sales.searchOrders", { defaultValue: "搜索订单号或客户" })}
      onRowClick={(r) => router.push(`/(app)/(sales)/orders/${r.id}` as Href)}
      renderSummary={(total) => (
        <span>
          {i18n.t("sales.totalOrders", { defaultValue: "销售订单总数" })} ·{" "}
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
            {i18n.t("sales.newOrder", { defaultValue: "新建销售订单" })}
          </Button>
        ) : null
      }
      extras={({ refetch }) => (
        <SalesOrderFormDrawer open={formOpen} order={null} onClose={() => setFormOpen(false)} onSaved={refetch} />
      )}
    />
  );
}
