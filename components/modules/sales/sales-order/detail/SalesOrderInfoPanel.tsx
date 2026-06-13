import { Typography, theme } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import StatusTag from "@/components/ui/StatusTag";
import { InfoRow, SectionLabel } from "@/components/modules/base/sections";
import type { SalesOrderDetail } from "@/components/modules/sales/sales-order/shared";

/** A labelled row whose value is a StatusTag (for the derived status fields). */
function StatusInfoRow({ label, status }: { label: string; status: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
        {label}
      </Typography.Text>
      <StatusTag status={status} />
    </div>
  );
}

/** Left rail: schema-labelled basic info, derived status tags, reference, notes, last-modified. */
export default function SalesOrderInfoPanel({ order, schema }: { order: SalesOrderDetail; schema: FieldSchema }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        padding: "20px 24px",
        borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <SectionLabel>{i18n.t("sales.basicInfo", { defaultValue: "基本信息" })}</SectionLabel>
      <InfoRow
        label={schema.label("contact", i18n.t("sales.customer", { defaultValue: "客户" }))}
        value={order.contact_name}
      />
      <InfoRow label={schema.label("date", i18n.t("sales.date", { defaultValue: "日期" }))} value={order.date} />
      <InfoRow
        label={schema.label("expected_ship_date", i18n.t("sales.expectedShipDate", { defaultValue: "预计发货日" }))}
        value={order.expected_ship_date || undefined}
      />
      <InfoRow
        label={schema.label("currency", i18n.t("sales.currency", { defaultValue: "币种" }))}
        value={order.currency || undefined}
      />

      <SectionLabel>{i18n.t("sales.statusInfo", { defaultValue: "状态" })}</SectionLabel>
      <StatusInfoRow
        label={schema.label("status", i18n.t("sales.status", { defaultValue: "状态" }))}
        status={order.display_status ?? order.status}
      />
      <StatusInfoRow
        label={i18n.t("sales.invoiceStatus", { defaultValue: "开票状态" })}
        status={order.invoice_status}
      />
      <StatusInfoRow
        label={i18n.t("sales.fulfillmentStatus", { defaultValue: "履约状态" })}
        status={order.fulfillment_status}
      />
      <StatusInfoRow
        label={i18n.t("sales.paymentStatus", { defaultValue: "收款状态" })}
        status={order.payment_status}
      />

      <SectionLabel>{i18n.t("sales.reference", { defaultValue: "参考号" })}</SectionLabel>
      <InfoRow
        label={schema.label("reference", i18n.t("sales.reference", { defaultValue: "参考号" }))}
        value={order.reference || undefined}
      />

      {order.notes ? (
        <>
          <SectionLabel>{i18n.t("sales.notes", { defaultValue: "备注" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {order.notes}
          </Typography.Paragraph>
        </>
      ) : null}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("sales.lastModified", { defaultValue: "最后修改" })}: {new Date(order.updated_at).toLocaleString()}
        </Typography.Text>
      </div>
    </div>
  );
}
