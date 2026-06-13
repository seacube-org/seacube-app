import { Typography, theme } from "antd";
import StatusTag from "@/components/ui/StatusTag";
import { InfoRow, SectionLabel } from "@/components/modules/base/sections";
import { money } from "@/components/modules/sales/shared/format";
import i18n from "@/locale/i18n";
import type { CreditNoteDetail } from "../shared";

/** Left rail: customer, linked invoice, date, amount, status, reason, notes, last-modified. */
export default function CreditNoteInfoPanel({ data }: { data: CreditNoteDetail }) {
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

      <div style={{ marginBottom: 14 }}>
        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 2 }}>
          {i18n.t("sales.status", { defaultValue: "状态" })}
        </Typography.Text>
        <StatusTag status={data.status} />
      </div>

      <InfoRow label={i18n.t("sales.customer", { defaultValue: "客户" })} value={data.contact_name} />
      <InfoRow
        label={i18n.t("sales.linkedInvoice", { defaultValue: "关联发票" })}
        value={data.invoice != null ? `#${data.invoice}` : undefined}
      />
      <InfoRow label={i18n.t("sales.date", { defaultValue: "日期" })} value={data.date} />
      <InfoRow label={i18n.t("sales.amount", { defaultValue: "金额" })} value={money(data.amount)} />

      {data.reason ? (
        <>
          <SectionLabel>{i18n.t("sales.reason", { defaultValue: "原因" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {data.reason}
          </Typography.Paragraph>
        </>
      ) : null}

      {data.notes ? (
        <>
          <SectionLabel>{i18n.t("sales.notes", { defaultValue: "备注" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {data.notes}
          </Typography.Paragraph>
        </>
      ) : null}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("sales.lastModified", { defaultValue: "最后修改" })}: {new Date(data.updated_at).toLocaleString()}
        </Typography.Text>
      </div>
    </div>
  );
}
