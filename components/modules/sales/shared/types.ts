// Shared types for the sales documents (Quote / SalesOrder / Invoice and the
// simpler PaymentReceived / CreditNote records). Field shapes mirror the DRF
// serializers in apps/sales/serializers.

import type { ContactAddress } from "@/components/modules/contacts/shared";

/**
 * One editable/displayable document line item (QuoteItem / SalesOrderItem /
 * InvoiceItem). Two-level pricing: the user enters entry_qty in entry_unit; an
 * optional conversion_factor (pricing units per entry unit) derives the
 * pricing quantity. factor null = one-level (unit mirrors entry_unit). Unit
 * codes come from the backend OptionSet 'unit' category.
 */
export type LineItemRow = {
  id?: number;
  product?: number | null;
  product_name_snapshot?: string;
  description?: string;
  spec?: Record<string, unknown>;
  entry_qty?: string | number;
  entry_unit?: string;
  conversion_factor?: string | number | null;
  unit_price?: string | number;
  discount?: string | number;
  tax_rate?: string | number;
  // Server-computed (read-only in display):
  unit?: string;
  quantity?: string | number;
  amount?: string;
  tax_amount?: string;
  // SalesOrderItem-only extras:
  invoiced_quantity?: string;
  fulfillment_source?: string;
  // InvoiceItem-only:
  so_item?: number | null;
};

/** A user display blob ({id, username, display_name}) as returned by created_by_display. */
export type UserDisplay = { id: number; username: string; display_name: string } | null;

/** Trade-terms block shared by Quote / SalesOrder / Invoice. */
export type TradeTerms = {
  port_of_loading?: string;
  port_of_destination?: string;
  incoterms?: string;
  incoterms_location?: string;
  currency?: string;
  payment_terms?: string;
  shipment_type?: string;
};

/** Billing / shipping address SNAPSHOTS on a sales document — frozen copies of
 *  the contact's defaults at create time (docs/plans/document-addresses.md). */
export type DocumentAddresses = {
  billing_address?: ContactAddress;
  shipping_address?: ContactAddress;
};

/** A status-transition action button spec for StatusActionBar. */
export type DocAction = {
  key: string;
  label: string;
  /** ViewSet action path (e.g. "send", "convert-to-order"). */
  action: string;
  primary?: boolean;
  danger?: boolean;
  /** When set, a confirm dialog with this body is shown before running. */
  confirm?: string;
  /** Optional request body. */
  body?: Record<string, unknown>;
};
