import { Typography, theme } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import StatusTag from "@/components/ui/StatusTag";
import { InfoRow, SectionLabel } from "@/components/modules/base/sections";
import { amount, money } from "@/components/modules/sales/shared/format";
import { paymentMethodLabel, type PaymentDetail } from "@/components/modules/sales/payment/shared";

/** Left rail: schema-labelled payment fields, status tag, notes, last-modified. */
export default function PaymentInfoPanel({ payment, schema }: { payment: PaymentDetail; schema: FieldSchema }) {
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
      <SectionLabel>{i18n.t("sales.paymentInfo", { defaultValue: "收款信息" })}</SectionLabel>

      <div style={{ marginBottom: 14 }}>
        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 2 }}>
          {schema.label("status", i18n.t("sales.status", { defaultValue: "状态" }))}
        </Typography.Text>
        <StatusTag status={payment.status} />
      </div>

      <InfoRow
        label={schema.label("contact", i18n.t("sales.customer", { defaultValue: "客户" }))}
        value={payment.contact_name}
      />
      <InfoRow
        label={schema.label("date", i18n.t("sales.paymentDate", { defaultValue: "收款日期" }))}
        value={payment.date}
      />
      <InfoRow
        label={schema.label("amount", i18n.t("sales.amount", { defaultValue: "金额" }))}
        value={money(payment.amount)}
      />
      <InfoRow
        label={schema.label("bank_charge", i18n.t("sales.bankCharge", { defaultValue: "银行手续费" }))}
        value={amount(payment.bank_charge)}
      />
      <InfoRow
        label={schema.label("payment_method", i18n.t("sales.paymentMethod", { defaultValue: "收款方式" }))}
        value={paymentMethodLabel(payment.payment_method)}
      />
      <InfoRow
        label={schema.label("reference", i18n.t("sales.reference", { defaultValue: "参考号" }))}
        value={payment.reference || undefined}
      />

      {payment.notes ? (
        <>
          <SectionLabel>{i18n.t("sales.notes", { defaultValue: "备注" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {payment.notes}
          </Typography.Paragraph>
        </>
      ) : null}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("sales.lastModified", { defaultValue: "最后修改" })}: {new Date(payment.updated_at).toLocaleString()}
        </Typography.Text>
      </div>
    </div>
  );
}
