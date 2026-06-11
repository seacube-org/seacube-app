import { Typography } from "antd";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import { SectionLabel } from "@/components/modules/contacts/detail/sections";
import DocumentTotals from "@/components/modules/sales/shared/DocumentTotals";
import LineItemsTable from "@/components/modules/sales/shared/LineItemsTable";
import { amount as fmtAmount } from "@/components/modules/sales/shared/format";
import type { InvoiceDetail, PaymentAllocation } from "@/components/modules/sales/invoice/shared";

/** Overview tab: line items, totals (with amount paid / balance due), allocations. */
export default function InvoiceOverview({ invoice }: { invoice: InvoiceDetail }) {
  const allocationColumns = [
    {
      title: i18n.t("sales.paymentNumber", { defaultValue: "收款单号" }),
      dataIndex: "payment_number",
      key: "payment_number",
    },
    {
      title: i18n.t("sales.amount", { defaultValue: "金额" }),
      dataIndex: "amount",
      key: "amount",
      width: 160,
      align: "right" as const,
      render: (v: string) => fmtAmount(v),
    },
  ];

  return (
    <div style={{ padding: "4px 0 24px", maxWidth: 960 }}>
      <SectionLabel>{i18n.t("sales.lineItems", { defaultValue: "行项目" })}</SectionLabel>
      <LineItemsTable items={invoice.items} />

      <DocumentTotals
        subtotal={invoice.subtotal}
        tax={invoice.tax_amount}
        total={invoice.total_amount}
        currency={invoice.currency}
        extra={[
          { label: i18n.t("sales.amountPaid", { defaultValue: "已收款" }), value: fmtAmount(invoice.amount_paid) },
          {
            label: i18n.t("sales.balanceDue", { defaultValue: "应收余额" }),
            value: fmtAmount(invoice.balance_due),
            strong: true,
          },
        ]}
      />

      {invoice.allocations.length ? (
        <>
          <SectionLabel>{i18n.t("sales.allocations", { defaultValue: "收款分配" })}</SectionLabel>
          <BasicTable<PaymentAllocation>
            rowKey={(r) => String(r.id)}
            columns={allocationColumns}
            dataSource={invoice.allocations}
          />
        </>
      ) : null}

      {invoice.terms ? (
        <>
          <SectionLabel>{i18n.t("sales.terms", { defaultValue: "条款" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap" }}>
            {invoice.terms}
          </Typography.Paragraph>
        </>
      ) : null}
    </div>
  );
}
