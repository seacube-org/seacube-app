import { Empty, Typography } from "antd";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import { SectionLabel } from "@/components/modules/contacts/detail/sections";
import { amount as fmtAmount } from "@/components/modules/sales/shared/format";
import { type PaymentAllocation, type PaymentDetail } from "@/components/modules/sales/payment/shared";

const emptyTable = { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> };

/** Overview tab: the read-only allocations table (which invoices this payment paid). */
export default function PaymentOverview({ payment }: { payment: PaymentDetail }) {
  const columns = [
    {
      title: i18n.t("sales.invoiceNumber", { defaultValue: "发票号" }),
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (v: string) => v || "—",
    },
    {
      title: i18n.t("sales.amount", { defaultValue: "金额" }),
      dataIndex: "amount",
      key: "amount",
      width: 160,
      align: "right" as const,
      render: (v: string) => <Typography.Text strong>{fmtAmount(v)}</Typography.Text>,
    },
  ];

  return (
    <div style={{ padding: "4px 0 24px", maxWidth: 720 }}>
      <SectionLabel>{i18n.t("sales.allocations", { defaultValue: "核销明细" })}</SectionLabel>
      <BasicTable<PaymentAllocation>
        rowKey={(r) => String(r.id)}
        columns={columns}
        dataSource={payment.allocations}
        locale={emptyTable}
      />
    </div>
  );
}
