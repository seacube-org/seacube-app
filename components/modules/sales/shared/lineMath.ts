// Client-side mirror of apps.sales.models.mixins.LineItem.compute_derived_fields,
// used only for the live preview in the line-item editor. The backend remains
// authoritative — it recomputes amount/tax/weights on save.
import { num } from "./format";
import type { LineItemRow } from "./types";

/** Pricing base: entry_qty × (conversion_factor ?? 1). */
export function lineQuantity(row: LineItemRow): number {
  const factor = row.conversion_factor == null || row.conversion_factor === "" ? 1 : num(row.conversion_factor);
  return num(row.entry_qty) * factor;
}

/** Net line amount: quantity × unit_price × (1 − discount/100). */
export function lineAmount(row: LineItemRow): number {
  const qty = lineQuantity(row);
  return qty * num(row.unit_price) * (1 - num(row.discount) / 100);
}

export function lineTax(row: LineItemRow): number {
  return lineAmount(row) * num(row.tax_rate);
}

export type Totals = { subtotal: number; tax: number; total: number };

/** Document totals from a list of editable rows (preview). */
export function computeTotals(rows: LineItemRow[] | undefined): Totals {
  const list = rows ?? [];
  const subtotal = list.reduce((s, r) => s + lineAmount(r), 0);
  const tax = list.reduce((s, r) => s + lineTax(r), 0);
  return { subtotal, tax, total: subtotal + tax };
}
