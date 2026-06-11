import { Typography, theme } from "antd";
import i18n from "@/locale/i18n";
import { money } from "./format";

type Row = { label: string; value: string; strong?: boolean };

/**
 * Right-aligned subtotal / tax / total block for a sales document. Pass the
 * server-computed amounts; an optional `extra` rows array adds e.g. Amount Paid /
 * Balance Due for invoices.
 */
export default function DocumentTotals({
  subtotal,
  tax,
  total,
  currency,
  extra = [],
}: {
  subtotal: unknown;
  tax: unknown;
  total: unknown;
  currency?: string;
  extra?: Row[];
}) {
  const { token } = theme.useToken();
  const rows: Row[] = [
    { label: i18n.t("sales.subtotal", { defaultValue: "小计" }), value: money(subtotal, currency) },
    { label: i18n.t("sales.taxTotal", { defaultValue: "税额" }), value: money(tax, currency) },
    { label: i18n.t("sales.total", { defaultValue: "合计" }), value: money(total, currency), strong: true },
    ...extra,
  ];
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
      <div style={{ minWidth: 280 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              borderTop: r.strong ? `1px solid ${token.colorBorderSecondary}` : undefined,
            }}
          >
            <Typography.Text type={r.strong ? undefined : "secondary"}>{r.label}</Typography.Text>
            <Typography.Text strong={r.strong} style={r.strong ? { fontSize: 16 } : undefined}>
              {r.value}
            </Typography.Text>
          </div>
        ))}
      </div>
    </div>
  );
}
