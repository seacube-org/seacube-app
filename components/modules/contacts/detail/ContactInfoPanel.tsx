import { Typography, theme } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import { formatAddress, type ContactDetail } from "@/components/modules/contacts/shared";
import { InfoRow, SectionLabel } from "./sections";

/** Left rail: schema-labelled basic info, notes, last-modified. */
export default function ContactInfoPanel({ contact, schema }: { contact: ContactDetail; schema: FieldSchema }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        width: 320, flexShrink: 0, padding: "20px 24px",
        borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <SectionLabel>{i18n.t("contacts.basicInfo", { defaultValue: "基本信息" })}</SectionLabel>
      <InfoRow label={schema.label("email", "邮箱")} value={contact.email} />
      <InfoRow label={schema.label("phone", "电话")} value={contact.phone} />
      <InfoRow label={schema.label("website", "网站")} value={contact.website} />
      <InfoRow label={schema.label("tax_id", "税号")} value={contact.tax_id} />
      <InfoRow label={schema.label("currency", "币种")} value={contact.currency} />
      <InfoRow
        label={schema.label("payment_terms", "付款账期（天）")}
        value={contact.payment_terms != null ? String(contact.payment_terms) : undefined}
      />
      <InfoRow
        label={schema.label("billing_address", i18n.t("contacts.billingAddress", { defaultValue: "账单地址" }))}
        value={formatAddress(contact.billing_address) || undefined}
      />

      {contact.notes ? (
        <>
          <SectionLabel>{i18n.t("contacts.notes", { defaultValue: "备注" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {contact.notes}
          </Typography.Paragraph>
        </>
      ) : null}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("contacts.lastModified", { defaultValue: "最后修改" })}: {new Date(contact.updated_at).toLocaleString()}
        </Typography.Text>
      </div>
    </div>
  );
}
