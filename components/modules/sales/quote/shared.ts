import { useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";
import type { LineItemRow, TradeTerms, UserDisplay } from "@/components/modules/sales/shared/types";

export const QUOTES_URL = API_ENDPOINTS.quotes;

// Row shape returned by the list endpoint (QuoteListSerializer).
export type QuoteRow = {
  id: number;
  quote_number: string;
  contact: number | null; // FK id
  contact_name: string;
  status: string;
  display_status: string; // EXPIRED-aware label code (DRAFT/SENT/.../EXPIRED)
  date: string;
  expiry_date: string | null;
  total_amount: string;
  created_at: string;
};

// Full shape returned by the detail endpoint (QuoteDetailSerializer). Adds the
// trade-terms block, the editable text fields, server-computed totals and the
// line items.
export type QuoteDetail = QuoteRow &
  TradeTerms & {
    reference: string;
    notes: string;
    terms: string;
    subtotal: string;
    tax_amount: string;
    items: LineItemRow[];
    updated_at: string;
    created_by_display: UserDisplay;
  };

/** Auth-aware viewset for quotes — routed through useDataService so a 401 logs out. */
export function useQuoteViewSet() {
  const { getViewSet } = useDataService();
  return useMemo(() => getViewSet(QUOTES_URL), [getViewSet]);
}
