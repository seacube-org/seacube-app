import { Typography, theme } from "antd";
import { InfoRow, SectionLabel } from "@/components/modules/contacts/detail/sections";
import { money } from "@/components/modules/sales/shared/format";
import i18n from "@/locale/i18n";
import type { CreditNoteDetail } from "../shared";

/**
 * Overview tab for a credit note. There are no line items, so this stays light:
 * the key details, the reason / notes, and a single right-aligned credit-amount
 * block (DocumentTotals' subtotal/tax split doesn't apply to a flat credit).
 */
export default function CreditNoteOverview({ data }: { data: CreditNoteDetail }) {
  const { token } = theme.useToken();
  return (
    <div style={{ padding: "4px 0 24px", maxWidth: 960 }}>
      <SectionLabel>{i18n.t("sales.details", { defaultValue: "明细" })}</SectionLabel>
      <InfoRow label={i18n.t("sales.customer", { defaultValue: "客户" })} value={data.contact_name} />
      <InfoRow
        label={i18n.t("sales.linkedInvoice", { defaultValue: "关联发票" })}
        value={data.invoice != null ? `#${data.invoice}` : undefined}
      />
      <InfoRow label={i18n.t("sales.date", { defaultValue: "日期" })} value={data.date} />

      <SectionLabel>{i18n.t("sales.reason", { defaultValue: "原因" })}</SectionLabel>
      {data.reason ? (
        <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{data.reason}</Typography.Paragraph>
      ) : (
        <Typography.Text type="secondary">—</Typography.Text>
      )}

      {data.notes ? (
        <>
          <SectionLabel>{i18n.t("sales.notes", { defaultValue: "备注" })}</SectionLabel>
          <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{data.notes}</Typography.Paragraph>
        </>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            minWidth: 280,
            padding: "10px 0",
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Typography.Text>{i18n.t("sales.creditAmount", { defaultValue: "贷项金额" })}</Typography.Text>
          <Typography.Text strong style={{ fontSize: 16 }}>
            {money(data.amount)}
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}
