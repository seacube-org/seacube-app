// Money / decimal helpers shared across the sales documents. Backend amounts are
// DRF decimal strings (e.g. "2000.00"); these helpers parse and present them.

/** Parse a decimal string/number to a finite number, or 0 for blank/invalid. */
export function num(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Format an amount as `1,234.56` (no currency symbol). Blank → "0.00". */
export function amount(v: unknown): string {
  return num(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format an amount with its currency code, e.g. `USD 1,234.56`. Uses the plain
 * code prefix (not a locale symbol) so multi-currency lists stay unambiguous.
 */
export function money(v: unknown, currency?: string | null): string {
  const body = amount(v);
  return currency ? `${currency} ${body}` : body;
}

/** Trim trailing zeros from a decimal string for compact display ("10.000" → "10"). */
export function trimDecimal(v: unknown): string {
  if (v == null || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return String(Number(n.toFixed(3)));
}
