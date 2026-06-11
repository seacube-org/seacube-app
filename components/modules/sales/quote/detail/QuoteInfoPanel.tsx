import { Typography, theme } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import StatusTag from "@/components/ui/StatusTag";
import { InfoRow, SectionLabel } from "@/components/modules/contacts/detail/sections";
import type { QuoteDetail } from "@/components/modules/sales/quote/shared";

/** Left rail: schema-labelled basic info, status, notes, last-modified. */
export default function QuoteInfoPanel({ quote, schema }: { quote: QuoteDetail; schema: FieldSchema }) {
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
        value={quote.contact_name}
      />
      <InfoRow label={schema.label("date", i18n.t("sales.date", { defaultValue: "日期" }))} value={quote.date} />
      <InfoRow
        label={schema.label("expiry_date", i18n.t("sales.expiryDate", { defaultValue: "有效期至" }))}
        value={quote.expiry_date ?? undefined}
      />
      <InfoRow
        label={schema.label("currency", i18n.t("sales.currency", { defaultValue: "币种" }))}
        value={quote.currency}
      />

      <div style={{ marginBottom: 14 }}>
        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 2 }}>
          {schema.label("status", i18n.t("sales.status", { defaultValue: "状态" }))}
        </Typography.Text>
        <StatusTag status={quote.display_status} />
      </div>

      <InfoRow
        label={schema.label("reference", i18n.t("sales.reference", { defaultValue: "参考号" }))}
        value={quote.reference || undefined}
      />

      {quote.notes ? (
        <>
          <SectionLabel>{i18n.t("sales.notes", { defaultValue: "备注" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {quote.notes}
          </Typography.Paragraph>
        </>
      ) : null}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("sales.lastModified", { defaultValue: "最后修改" })}: {new Date(quote.updated_at).toLocaleString()}
        </Typography.Text>
      </div>
    </div>
  );
}
