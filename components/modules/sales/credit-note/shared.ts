import { useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";
import type { UserDisplay } from "@/components/modules/sales/shared/types";

export const CREDIT_NOTES_URL = API_ENDPOINTS.creditNotes;

// Credit-note lifecycle (see apps/sales/models CreditNote.Status). DRAFT is the
// only editable/deletable state; the rest are locked.
export type CreditNoteStatus = "DRAFT" | "OPEN" | "APPLIED" | "VOIDED";

// Row shape returned by the list endpoint (CreditNoteSerializer — there is no
// separate list serializer, so list and detail share the same fields).
export type CreditNoteRow = {
  id: number;
  credit_number: string;
  contact: number;
  contact_name: string;
  invoice: number | null;
  status: CreditNoteStatus;
  date: string;
  amount: string;
  reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

// Full shape returned by the detail endpoint (CreditNoteSerializer). Same fields
// as the row plus the created-by display blob.
export type CreditNoteDetail = CreditNoteRow & {
  created_by_display: UserDisplay;
};

/** Auth-aware viewset for credit notes — routed through useDataService so a 401 logs out. */
export function useCreditNoteViewSet() {
  const { getViewSet } = useDataService();
  return useMemo(() => getViewSet(CREDIT_NOTES_URL), [getViewSet]);
}
