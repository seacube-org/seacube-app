import { useEffect, useState } from "react";
import { Select } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { useAuthStore } from "@/stores/authStore";
import { rows } from "@/utils/pagination";
import { API_ENDPOINTS } from "@/constants/Constants";
import i18n from "@/locale/i18n";

type InvoiceOption = { value: number; label: string };

// Minimal slice of the invoice list row needed for the option label.
type InvoiceListRow = { id: number; invoice_number: string };

// Module-level cache of the invoice options per active org (mirrors ContactSelect).
// Cleared implicitly when the org changes via the keyed cache entry.
const _cache = new Map<string, InvoiceOption[]>();
const _inflight = new Map<string, Promise<InvoiceOption[]>>();

/** Loads invoices as `{value:id, label:invoice_number}` options for the linked-invoice selector. */
function useInvoiceOptions(enabled = true): { options: InvoiceOption[]; loading: boolean } {
  const { getViewSet } = useDataService();
  const orgKey = String(useAuthStore((s) => s.activeOrgId) ?? "");
  const [options, setOptions] = useState<InvoiceOption[]>(_cache.get(orgKey) ?? []);
  const [loading, setLoading] = useState(!_cache.has(orgKey) && enabled);

  useEffect(() => {
    if (!enabled || _cache.has(orgKey)) {
      if (_cache.has(orgKey)) setOptions(_cache.get(orgKey)!);
      return;
    }
    let active = true;
    let p = _inflight.get(orgKey);
    if (!p) {
      p = getViewSet(API_ENDPOINTS.invoices)
        .list({ params: { page_size: 1000 } })
        .then((data) => {
          const out = rows<InvoiceListRow>(data).map((inv) => ({ value: inv.id, label: inv.invoice_number }));
          _cache.set(orgKey, out);
          return out;
        })
        .catch(() => [] as InvoiceOption[])
        .finally(() => _inflight.delete(orgKey));
      _inflight.set(orgKey, p);
    }
    p.then((out) => {
      if (!active) return;
      setOptions(out);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [enabled, getViewSet, orgKey]);

  return { options, loading };
}

type Props = {
  value?: number | null;
  onChange?: (value: number | null) => void;
  disabled?: boolean;
};

/** Controlled linked-invoice selector — searchable Select backed by the invoice list. Optional/clearable. */
export default function InvoiceSelect({ value, onChange, disabled }: Props) {
  const { options, loading } = useInvoiceOptions(true);
  return (
    <Select
      showSearch
      allowClear
      loading={loading}
      disabled={disabled}
      value={value ?? undefined}
      onChange={(v) => onChange?.(v ?? null)}
      options={options}
      optionFilterProp="label"
      placeholder={i18n.t("sales.selectInvoice", { defaultValue: "选择发票（可选）" })}
      style={{ width: "100%" }}
    />
  );
}
