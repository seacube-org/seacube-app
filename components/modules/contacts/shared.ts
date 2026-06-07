import { useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import i18n from "@/locale/i18n";

export const CONTACTS_URL = "/api/contacts/contacts/";

// Derived server-side from the contact's sales/purchase documents (read-only).
export type ContactType = "CUSTOMER" | "VENDOR" | "BOTH" | "UNCLASSIFIED";

export type ContactAddress = {
  attention?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
};

export type ContactPerson = {
  id?: number;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
};

export type BankAccount = {
  id?: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number?: string;
  swift_code?: string;
  bank_address?: string;
  currency?: string;
  is_default?: boolean;
};

// Credit period rule, as embedded read-only in the contact detail response.
export type CreditPeriodDetail = {
  id: number;
  name: string;
  label: string; // locale-aware display label (system names translated server-side)
  term_type: string;
  days: number | null;
};

// Row shape returned by the list endpoint (ContactListSerializer).
export type ContactRow = {
  id: number;
  type: ContactType;
  name: string;
  email: string;
  phone: string;
  currency: string;
  credit_period?: number | null; // FK id; staff-hidden
  payment_terms?: string; // free-text commercial arrangement; staff-hidden
  created_at: string;
};

type UserDisplay = { id: number; username: string; display_name: string } | null;

// Full shape returned by the detail endpoint (ContactDetailSerializer).
export type ContactDetail = ContactRow & {
  website: string;
  tax_id: string;
  credit_period_detail?: CreditPeriodDetail | null; // read-only display of credit_period
  notes: string;
  billing_address: ContactAddress;
  shipping_address: ContactAddress;
  persons: ContactPerson[];
  bank_accounts: BankAccount[];
  updated_at: string;
  created_by_display: UserDisplay;
};

/** Auth-aware viewset for contacts — routed through useDataService so a 401 logs out. */
export function useContactViewSet() {
  const { getViewSet } = useDataService();
  return useMemo(() => getViewSet(CONTACTS_URL), [getViewSet]);
}

export function typeLabel(t: ContactType): string {
  switch (t) {
    case "CUSTOMER":
      return i18n.t("contacts.typeCustomer", { defaultValue: "客户" });
    case "VENDOR":
      return i18n.t("contacts.typeVendor", { defaultValue: "供应商" });
    case "UNCLASSIFIED":
      return i18n.t("contacts.typeUnclassified", { defaultValue: "未分类" });
    default:
      return i18n.t("contacts.typeBoth", { defaultValue: "客户兼供应商" });
  }
}

export function typeColor(t: ContactType): string {
  switch (t) {
    case "CUSTOMER":
      return "blue";
    case "VENDOR":
      return "purple";
    case "UNCLASSIFIED":
      return "default";
    default:
      return "geekblue";
  }
}

/** Up to two uppercase initials from a name, for avatars. */
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Avatar background for a contact type — vendors stand out (purple), else primary. */
export function avatarColor(type: ContactType, primary: string): string {
  return typeColor(type) === "purple" ? "#722ed1" : primary;
}

const ADDRESS_KEYS: (keyof ContactAddress)[] = [
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
];

/** Single-line summary of an address JSON blob (empty string when blank). */
export function formatAddress(addr: ContactAddress | undefined): string {
  if (!addr) return "";
  return ADDRESS_KEYS.map((k) => addr[k])
    .filter((v) => v && String(v).trim())
    .join(", ");
}
