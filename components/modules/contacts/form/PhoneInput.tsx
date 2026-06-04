import { useMemo, useState } from "react";
import { Input, Select, Space } from "antd";
import type { InputProps } from "antd";

type PhoneInputProps = Omit<InputProps, "addonBefore" | "onChange" | "value"> & {
  value?: string;
  onChange?: (value: string) => void;
};

// Common dialing countries. `code` is the dial code stored in the phone string;
// `iso` is the unique Select value (several countries share a dial code, e.g. +1).
const COUNTRIES: { iso: string; code: string; name: string }[] = [
  { iso: "CN", code: "+86", name: "China" },
  { iso: "HK", code: "+852", name: "Hong Kong" },
  { iso: "MO", code: "+853", name: "Macau" },
  { iso: "TW", code: "+886", name: "Taiwan" },
  { iso: "US", code: "+1", name: "United States" },
  { iso: "CA", code: "+1", name: "Canada" },
  { iso: "GB", code: "+44", name: "United Kingdom" },
  { iso: "AU", code: "+61", name: "Australia" },
  { iso: "NZ", code: "+64", name: "New Zealand" },
  { iso: "SG", code: "+65", name: "Singapore" },
  { iso: "MY", code: "+60", name: "Malaysia" },
  { iso: "TH", code: "+66", name: "Thailand" },
  { iso: "VN", code: "+84", name: "Vietnam" },
  { iso: "PH", code: "+63", name: "Philippines" },
  { iso: "ID", code: "+62", name: "Indonesia" },
  { iso: "IN", code: "+91", name: "India" },
  { iso: "JP", code: "+81", name: "Japan" },
  { iso: "KR", code: "+82", name: "South Korea" },
  { iso: "BD", code: "+880", name: "Bangladesh" },
  { iso: "PK", code: "+92", name: "Pakistan" },
  { iso: "LK", code: "+94", name: "Sri Lanka" },
  { iso: "DE", code: "+49", name: "Germany" },
  { iso: "FR", code: "+33", name: "France" },
  { iso: "IT", code: "+39", name: "Italy" },
  { iso: "ES", code: "+34", name: "Spain" },
  { iso: "NL", code: "+31", name: "Netherlands" },
  { iso: "BE", code: "+32", name: "Belgium" },
  { iso: "PT", code: "+351", name: "Portugal" },
  { iso: "NO", code: "+47", name: "Norway" },
  { iso: "DK", code: "+45", name: "Denmark" },
  { iso: "SE", code: "+46", name: "Sweden" },
  { iso: "RU", code: "+7", name: "Russia" },
  { iso: "TR", code: "+90", name: "Turkey" },
  { iso: "AE", code: "+971", name: "United Arab Emirates" },
  { iso: "SA", code: "+966", name: "Saudi Arabia" },
  { iso: "BR", code: "+55", name: "Brazil" },
  { iso: "MX", code: "+52", name: "Mexico" },
  { iso: "CL", code: "+56", name: "Chile" },
  { iso: "PE", code: "+51", name: "Peru" },
  { iso: "EC", code: "+593", name: "Ecuador" },
  { iso: "ZA", code: "+27", name: "South Africa" },
  { iso: "EG", code: "+20", name: "Egypt" },
];

const DEFAULT_ISO = "CN";
const DIAL_CODES = [...new Set(COUNTRIES.map((c) => c.code))];
// Longest-first, for unambiguous prefix matching of space-less E.164 values.
const DIAL_CODES_BY_LEN = [...DIAL_CODES].sort((a, b) => b.length - a.length);

// Dropdown options, sorted by country name. The box shows just the dial code
// (optionLabelProp="code"); the dropdown row shows "+code  Country"; search
// matches name + code via searchText.
const OPTIONS = COUNTRIES.slice()
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({
    value: c.iso,
    code: c.code,
    searchText: `${c.name} ${c.code}`,
    label: (
      <span>
        <span style={{ display: "inline-block", minWidth: 46, color: "#6b7280" }}>{c.code}</span>
        {c.name}
      </span>
    ),
  }));

const codeForIso = (iso: string) => COUNTRIES.find((c) => c.iso === iso)?.code ?? "+86";
const isoForCode = (code: string) => COUNTRIES.find((c) => c.code === code)?.iso;

function splitPhone(value?: string, fallbackCode = "+86") {
  const raw = String(value ?? "").trim();
  // Our stored format is space-delimited ("+86 123…") — unambiguous.
  const spaced = DIAL_CODES.find((c) => raw === c || raw.startsWith(`${c} `));
  if (spaced) return { code: spaced, number: raw.slice(spaced.length).trimStart() };
  // Legacy / imported E.164 without a space ("+8613800138000"): longest dial-code
  // prefix wins, so editing doesn't duplicate the country code.
  const prefix = DIAL_CODES_BY_LEN.find((c) => raw.startsWith(c));
  if (prefix) return { code: prefix, number: raw.slice(prefix.length).trimStart() };
  return { code: fallbackCode, number: raw };
}

export default function PhoneInput({ value, onChange, maxLength, ...props }: PhoneInputProps) {
  const [preferredIso, setPreferredIso] = useState(DEFAULT_ISO);
  const parsed = useMemo(() => splitPhone(value, codeForIso(preferredIso)), [value, preferredIso]);
  const numberMaxLength = typeof maxLength === "number" ? Math.max(0, maxLength - parsed.code.length - 1) : undefined;
  // Keep the user's exact country pick when its dial code still matches; otherwise
  // resolve the stored dial code to a country (first match for shared codes).
  const selectedIso = codeForIso(preferredIso) === parsed.code ? preferredIso : (isoForCode(parsed.code) ?? preferredIso);

  const emit = (code: string, number: string) => {
    onChange?.(number.trim() ? `${code} ${number}` : "");
  };

  return (
    <Space.Compact block>
      <Select
        showSearch={{ optionFilterProp: "searchText" }}
        value={selectedIso}
        options={OPTIONS}
        optionLabelProp="code"
        popupMatchSelectWidth={false}
        style={{ width: 82, flexShrink: 0 }}
        onChange={(iso) => {
          setPreferredIso(iso);
          emit(codeForIso(iso), parsed.number);
        }}
      />
      <Input
        {...props}
        value={parsed.number}
        maxLength={numberMaxLength}
        style={{ flex: 1, ...props.style }}
        onChange={(event) => emit(parsed.code, event.target.value)}
      />
    </Space.Compact>
  );
}
