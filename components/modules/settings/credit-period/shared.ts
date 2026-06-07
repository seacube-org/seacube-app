import i18n from "@/locale/i18n";

export type CreditPeriodTermType = "NET_DAYS" | "DUE_ON_RECEIPT" | "END_OF_MONTH" | "END_OF_NEXT_MONTH";

export type CreditPeriod = {
  id: number;
  organization: number | null;
  name: string;
  label: string; // locale-aware display label (system names translated server-side)
  term_type: CreditPeriodTermType;
  days: number | null;
  is_system: boolean;
  is_default: boolean;
  created_at?: string;
};

export const TERM_TYPE_OPTIONS: { value: CreditPeriodTermType }[] = [
  { value: "NET_DAYS" },
  { value: "DUE_ON_RECEIPT" },
  { value: "END_OF_MONTH" },
  { value: "END_OF_NEXT_MONTH" },
];

export function termTypeLabel(t: CreditPeriodTermType): string {
  switch (t) {
    case "NET_DAYS":
      return i18n.t("creditPeriod.netDays", { defaultValue: "见票后 N 日付款" });
    case "DUE_ON_RECEIPT":
      return i18n.t("creditPeriod.dueOnReceipt", { defaultValue: "收款到期日" });
    case "END_OF_MONTH":
      return i18n.t("creditPeriod.endOfMonth", { defaultValue: "月末到期" });
    default:
      return i18n.t("creditPeriod.endOfNextMonth", { defaultValue: "下个月末到期" });
  }
}

/** The "天数" column: a day count for net-day rules, else "N/A" (rule-based). */
export function daysDisplay(p: Pick<CreditPeriod, "term_type" | "days">): string {
  if (p.term_type === "NET_DAYS") return String(p.days ?? 0);
  if (p.term_type === "DUE_ON_RECEIPT") return "0";
  return "N/A";
}
