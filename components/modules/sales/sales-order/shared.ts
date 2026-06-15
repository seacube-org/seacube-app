import { useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";
import type { DocumentAddresses, LineItemRow, TradeTerms, UserDisplay } from "@/components/modules/sales/shared/types";

export const SO_ORDERS_URL = API_ENDPOINTS.salesOrders; // "/api/sales/orders/"

// Lifecycle status (DRAFT / CONFIRMED / CANCELLED). The serializer also returns
// `display_status` (the localized label-aware code) used for the StatusTag.
export type SalesOrderStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

// Derived display fields computed server-side (read-only on list + detail).
export type InvoiceStatus = "UNINVOICED" | "PARTIALLY_INVOICED" | "FULLY_INVOICED";
export type FulfillmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "FULFILLED";

// Row shape returned by the list endpoint (SalesOrderListSerializer).
export type SalesOrderRow = {
  id: number;
  order_number: string;
  contact: number | null; // FK id
  contact_name: string;
  status: SalesOrderStatus;
  display_status: string;
  invoice_status: InvoiceStatus;
  fulfillment_status: FulfillmentStatus;
  payment_status: string;
  date: string;
  total_amount: string;
  created_at: string;
};

// Full shape returned by the detail endpoint (SalesOrderDetailSerializer).
export type SalesOrderDetail = SalesOrderRow &
  TradeTerms &
  DocumentAddresses & {
    quote: number | null; // FK id (source quote, when converted)
    expected_ship_date: string | null;
    reference: string;
    notes: string;
    terms: string;
    subtotal: string;
    tax_amount: string;
    items: LineItemRow[];
    updated_at: string;
    created_by_display: UserDisplay;
  };

/** Auth-aware viewset for sales orders — routed through useDataService so a 401 logs out. */
export function useSalesOrderViewSet() {
  const { getViewSet } = useDataService();
  return useMemo(() => getViewSet(SO_ORDERS_URL), [getViewSet]);
}
