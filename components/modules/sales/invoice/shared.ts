import { useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";
import type { DocumentAddresses, LineItemRow, TradeTerms, UserDisplay } from "@/components/modules/sales/shared/types";

export const INVOICES_URL = API_ENDPOINTS.invoices;

// Invoice lifecycle (see apps/sales/models Invoice.Status). display_status may
// additionally surface OVERDUE for an unpaid invoice past its due date.
export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "VOIDED";

// One payment-to-invoice allocation (PaymentAllocationSerializer), read-only.
export type PaymentAllocation = {
  id: number;
  payment: number;
  payment_number: string;
  invoice: number;
  invoice_number: string;
  amount: string;
};

// Row shape returned by the list endpoint (InvoiceListSerializer).
export type InvoiceRow = {
  id: number;
  invoice_number: string;
  contact: number;
  contact_name: string;
  status: InvoiceStatus;
  display_status: string;
  date: string;
  due_date: string;
  total_amount: string;
  amount_paid: string;
  created_at: string;
};

// Full shape returned by the detail endpoint (InvoiceDetailSerializer).
export type InvoiceDetail = InvoiceRow &
  TradeTerms &
  DocumentAddresses & {
    sales_order: number | null;
    reference: string;
    notes: string;
    terms: string;
    subtotal: string;
    tax_amount: string;
    balance_due: string;
    items: LineItemRow[];
    allocations: PaymentAllocation[];
    updated_at: string;
    created_by_display: UserDisplay;
  };

/** Auth-aware viewset for invoices — routed through useDataService so a 401 logs out. */
export function useInvoiceViewSet() {
  const { getViewSet } = useDataService();
  return useMemo(() => getViewSet(INVOICES_URL), [getViewSet]);
}
