import { Typography, theme } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import StatusTag from "@/components/ui/StatusTag";
import { InfoRow, SectionLabel } from "@/components/modules/contacts/detail/sections";
import type { InvoiceDetail } from "@/components/modules/sales/invoice/shared";

/** Left rail: customer, dates, currency, status, reference, notes, last-modified. */
export default function InvoiceInfoPanel({ invoice, schema }: { invoice: InvoiceDetail; schema: FieldSchema }) {
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
        value={invoice.contact_name}
      />
      <InfoRow
        label={schema.label("date", i18n.t("sales.invoiceDate", { defaultValue: "开票日期" }))}
        value={invoice.date}
      />
      <InfoRow
        label={schema.label("due_date", i18n.t("sales.dueDate", { defaultValue: "到期日" }))}
        value={invoice.due_date}
      />
      <InfoRow
        label={schema.label("currency", i18n.t("sales.currency", { defaultValue: "币种" }))}
        value={invoice.currency}
      />

      <div style={{ marginBottom: 14 }}>
        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
          {i18n.t("sales.status", { defaultValue: "状态" })}
        </Typography.Text>
        <StatusTag status={invoice.display_status} />
      </div>

      <InfoRow
        label={schema.label("reference", i18n.t("sales.reference", { defaultValue: "参考号" }))}
        value={invoice.reference || undefined}
      />

      {invoice.notes ? (
        <>
          <SectionLabel>{i18n.t("sales.notes", { defaultValue: "备注" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {invoice.notes}
          </Typography.Paragraph>
        </>
      ) : null}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("sales.lastModified", { defaultValue: "最后修改" })}: {new Date(invoice.updated_at).toLocaleString()}
        </Typography.Text>
      </div>
    </div>
  );
}
