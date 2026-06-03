export type OrgAddress = {
  id?: number;
  attention?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  fax?: string;
};

export type Organization = {
  id: number;
  name: string;
  legal_name?: string;
  slug?: string;
  logo?: string | null;
  tax_number?: string;
  phone?: string;
  website?: string;
  contact_email?: string;
  /** Bound/primary address — a PK into the org's address book. */
  address?: number | null;
  /** Expanded primary address (read-only) for display. */
  address_detail?: OrgAddress | null;
  currency?: string;
  timezone?: string;
  created_at?: string;
};
