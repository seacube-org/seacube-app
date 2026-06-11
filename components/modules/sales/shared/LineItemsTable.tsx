import { Empty, Typography } from "antd";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import { taxRatePercent } from "@/components/modules/products/shared";
import { amount as fmtAmount, trimDecimal } from "./format";
import type { LineItemRow } from "./types";

const emptyTable = { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> };

const dash = <Typography.Text type="secondary">—</Typography.Text>;

/** Read-only display of a document's line items (detail Overview tab). */
export default function LineItemsTable({ items }: { items: LineItemRow[] }) {
  const columns = [
    {
      title: i18n.t("sales.product", { defaultValue: "产品" }),
      key: "product",
      render: (_: unknown, r: LineItemRow) => (
        <div style={{ minWidth: 0, whiteSpace: "pre-line" }}>
          <div>{r.product_name_snapshot || r.description || dash}</div>
          {r.product_name_snapshot && r.description ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {r.description}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: i18n.t("sales.quantity", { defaultValue: "数量" }),
      key: "quantity",
      width: 150,
      align: "right" as const,
      // Two-level rows show the entry quantity and the derived pricing base
      // ("50 CTN → 1075 KGS"); one-level rows just show the quantity.
      render: (_: unknown, r: LineItemRow) => {
        const priced = `${trimDecimal(r.quantity)} ${r.unit ?? ""}`.trim();
        if (r.conversion_factor == null) return priced;
        const entered = `${trimDecimal(r.entry_qty)} ${r.entry_unit ?? ""}`.trim();
        return (
          <div style={{ lineHeight: 1.4 }}>
            <div>{entered}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              → {priced}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      title: i18n.t("sales.unitPrice", { defaultValue: "单价" }),
      dataIndex: "unit_price",
      key: "unit_price",
      width: 110,
      align: "right" as const,
      render: (v: string) => fmtAmount(v),
    },
    {
      title: i18n.t("sales.discountPct", { defaultValue: "折扣 %" }),
      dataIndex: "discount",
      key: "discount",
      width: 90,
      align: "right" as const,
      render: (v: string) => (Number(v) ? `${trimDecimal(v)}%` : dash),
    },
    {
      title: i18n.t("sales.taxRate", { defaultValue: "税率" }),
      dataIndex: "tax_rate",
      key: "tax_rate",
      width: 90,
      align: "right" as const,
      render: (v: string) => taxRatePercent(v),
    },
    {
      title: i18n.t("sales.lineAmount", { defaultValue: "金额" }),
      dataIndex: "amount",
      key: "amount",
      width: 130,
      align: "right" as const,
      render: (v: string) => <Typography.Text strong>{fmtAmount(v)}</Typography.Text>,
    },
  ];

  return (
    <BasicTable<LineItemRow>
      rowKey={(r) => String(r.id ?? Math.random())}
      columns={columns}
      dataSource={items}
      locale={emptyTable}
    />
  );
}
