import i18n from "@/locale/i18n";
import LineItemsTable from "@/components/modules/sales/shared/LineItemsTable";
import DocumentTotals from "@/components/modules/sales/shared/DocumentTotals";
import { InfoRow, SectionLabel, TAB_PANE_STYLE } from "@/components/modules/base/sections";
import type { QuoteDetail } from "@/components/modules/sales/quote/shared";

/** Right Overview tab: line items, totals, then a trade-terms summary block. */
export default function QuoteOverview({ quote }: { quote: QuoteDetail }) {
  // Single-line port summary (loading → destination), blank when neither set.
  const ports = [quote.port_of_loading, quote.port_of_destination].filter((p) => p && p.trim()).join(" → ");

  return (
    <div style={TAB_PANE_STYLE}>
      <SectionLabel>{i18n.t("sales.tabItems", { defaultValue: "行项目" })}</SectionLabel>
      <LineItemsTable items={quote.items} />
      <DocumentTotals
        subtotal={quote.subtotal}
        tax={quote.tax_amount}
        total={quote.total_amount}
        currency={quote.currency}
      />

      <SectionLabel>{i18n.t("sales.tabTerms", { defaultValue: "贸易条款" })}</SectionLabel>
      <InfoRow label={i18n.t("sales.incoterms", { defaultValue: "贸易术语" })} value={quote.incoterms || undefined} />
      <InfoRow label={i18n.t("sales.ports", { defaultValue: "装运港 → 目的港" })} value={ports || undefined} />
      <InfoRow
        label={i18n.t("sales.paymentTerms", { defaultValue: "付款条款" })}
        value={quote.payment_terms || undefined}
      />
    </div>
  );
}
