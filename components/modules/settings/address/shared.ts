import i18n from "@/locale/i18n";

export type AddressType = "BILLING" | "SHIPPING" | "OTHER";

export type Address = {
  id: number;
  organization: number | null;
  label: string;
  address_type: AddressType;
  attention: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  fax: string;
  created_at?: string;
};

export const ADDRESS_TYPE_OPTIONS: { value: AddressType }[] = [
  { value: "BILLING" },
  { value: "SHIPPING" },
  { value: "OTHER" },
];

export function addressTypeLabel(t: AddressType): string {
  switch (t) {
    case "BILLING":
      return i18n.t("address.typeBilling", { defaultValue: "账单地址" });
    case "SHIPPING":
      return i18n.t("address.typeShipping", { defaultValue: "收货地址" });
    default:
      return i18n.t("address.typeOther", { defaultValue: "其他" });
  }
}

export function addressTypeColor(t: AddressType): string {
  switch (t) {
    case "BILLING":
      return "gold";
    case "SHIPPING":
      return "blue";
    default:
      return "default";
  }
}

/** One-line address (empty parts dropped). */
export function formatAddressLine(a?: Partial<Address> | null): string {
  if (!a) return "";
  return [a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

/** Dropdown label: the address's name, else its formatted line, else a fallback. */
export function addressOptionLabel(a: Address): string {
  return a.label?.trim() || formatAddressLine(a) || i18n.t("address.untitled", { defaultValue: "未命名地址" });
}
