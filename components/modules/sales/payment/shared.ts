import { useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";
import i18n from "@/locale/i18n";
import type { UserDisplay } from "@/components/modules/sales/shared/types";

export const PAYMENTS_URL = API_ENDPOINTS.paymentsReceived;

// Payments are create-only + void; status only ever flips NORMAL → VOIDED.
export type PaymentStatus = "NORMAL" | "VOIDED";

export type PaymentMethod = "BANK_TRANSFER" | "CASH" | "CHECK" | "OTHER";

// One read-only allocation row embedded in the payment detail (PaymentAllocationSerializer).
export type PaymentAllocation = {
  id: number;
  payment_number: string;
  invoice_number: string;
  amount: string;
};

// Row shape returned by the list endpoint (PaymentReceivedSerializer fields).
export type PaymentRow = {
  id: number;
  payment_number: string;
  contact: number | null;
  contact_name: string;
  status: PaymentStatus;
  date: string;
  amount: string;
  bank_charge: string;
  payment_method: PaymentMethod;
  reference: string;
  created_at: string;
};

// Full shape returned by the detail endpoint (PaymentReceivedSerializer).
export type PaymentDetail = PaymentRow & {
  notes: string;
  allocations: PaymentAllocation[];
  updated_at: string;
  created_by_display: UserDisplay;
};

/** Auth-aware viewset for payments — routed through useDataService so a 401 logs out. */
export function usePaymentViewSet() {
  const { getViewSet } = useDataService();
  return useMemo(() => getViewSet(PAYMENTS_URL), [getViewSet]);
}

/** Human label for a payment method code. */
export function paymentMethodLabel(code: PaymentMethod | string | null | undefined): string {
  switch (code) {
    case "BANK_TRANSFER":
      return i18n.t("sales.paymentMethodBankTransfer", { defaultValue: "银行转账" });
    case "CASH":
      return i18n.t("sales.paymentMethodCash", { defaultValue: "现金" });
    case "CHECK":
      return i18n.t("sales.paymentMethodCheck", { defaultValue: "支票" });
    case "OTHER":
      return i18n.t("sales.paymentMethodOther", { defaultValue: "其他" });
    default:
      return code ? String(code) : "—";
  }
}

/** The four payment methods as Select options (single source for both drawers). */
export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = (
  ["BANK_TRANSFER", "CASH", "CHECK", "OTHER"] as PaymentMethod[]
).map((value) => ({ value, label: paymentMethodLabel(value) }));
