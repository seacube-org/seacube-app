import { useCallback, useEffect, useState } from "react";
import { Avatar, Button, Divider, Select, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDataService } from "@/hooks/core/useDataService";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import { useAuthStore } from "@/stores/authStore";
import { rows } from "@/utils/pagination";
import {
  CONTACTS_URL,
  avatarColor,
  initials,
  type ContactDetail,
  type ContactRow,
  type ContactType,
} from "@/components/modules/contacts/shared";
import ContactFormDrawer from "@/components/modules/contacts/ContactFormDrawer";
import i18n from "@/locale/i18n";

type ContactOption = {
  value: number;
  label: string;
  /** Secondary line in the dropdown (email, falling back to phone). */
  caption: string;
  type: ContactType;
};

function toOption(c: ContactRow | ContactDetail): ContactOption {
  return { value: c.id, label: c.name, caption: c.email || c.phone || "", type: c.type };
}

// Module-level cache of the contact options per active org (mirrors
// useProductCatalog). Cleared when the org changes via the keyed cache entry.
const _cache = new Map<string, ContactOption[]>();
const _inflight = new Map<string, Promise<ContactOption[]>>();

/** Loads contacts as dropdown options for the customer selector. */
export function useContactOptions(enabled = true): {
  options: ContactOption[];
  loading: boolean;
  /** Insert a freshly created contact into the cached options (quick-add). */
  add: (c: ContactRow | ContactDetail) => void;
} {
  const { getViewSet } = useDataService();
  const orgKey = String(useAuthStore((s) => s.activeOrgId) ?? "");
  const [options, setOptions] = useState<ContactOption[]>(_cache.get(orgKey) ?? []);
  const [loading, setLoading] = useState(!_cache.has(orgKey) && enabled);

  useEffect(() => {
    if (!enabled || _cache.has(orgKey)) {
      if (_cache.has(orgKey)) setOptions(_cache.get(orgKey)!);
      return;
    }
    let active = true;
    let p = _inflight.get(orgKey);
    if (!p) {
      p = getViewSet(CONTACTS_URL)
        // is_active: only offer live contacts — archived ones stay linked to their
        // history but shouldn't be pickable on new documents.
        .list({ params: { page_size: 1000, ordering: "name", is_active: true } })
        .then((data) => {
          const out = rows<ContactRow>(data).map(toOption);
          _cache.set(orgKey, out);
          return out;
        })
        .catch(() => [] as ContactOption[])
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

  const add = useCallback(
    (c: ContactRow | ContactDetail) => {
      const next = [...(_cache.get(orgKey) ?? []), toOption(c)].sort((a, b) => a.label.localeCompare(b.label));
      _cache.set(orgKey, next);
      setOptions(next);
    },
    [orgKey],
  );

  return { options, loading, add };
}

/** Drop the cached contact options (call after creating/editing contacts). */
export function invalidateContactOptions(): void {
  _cache.clear();
  _inflight.clear();
}

type Props = {
  value?: number | null;
  onChange?: (value: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Controlled customer selector — searchable Select backed by the contact list,
 * with a Zoho-style "+ new customer" footer that quick-creates a contact via
 * ContactFormDrawer and auto-selects it.
 */
export default function ContactSelect({ value, onChange, disabled, placeholder }: Props) {
  const { token } = theme.useToken();
  const { options, loading, add } = useContactOptions(true);
  const { getViewSet } = useDataService();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  // The selected contact may not be in the active list (e.g. it was archived after
  // this document was created). Fetch it once so the field shows its name instead of
  // a raw id — kept local, NOT pushed into the shared active-options cache, so it
  // never leaks into other pickers' new-selection dropdowns.
  const [selectedOption, setSelectedOption] = useState<ContactOption | null>(null);
  useEffect(() => {
    if (value == null || options.some((o) => o.value === value)) {
      setSelectedOption(null);
      return;
    }
    if (selectedOption?.value === value) return; // already fetched
    let alive = true;
    getViewSet(CONTACTS_URL)
      .retrieve({ id: value })
      .then((c) => alive && setSelectedOption(toOption(c as ContactDetail)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value, options, selectedOption, getViewSet]);
  const mergedOptions =
    selectedOption && !options.some((o) => o.value === selectedOption.value)
      ? [selectedOption, ...options]
      : options;
  // Collection OPTIONS advertises POST only when the user may create contacts —
  // an empty schema means no create permission, so hide the quick-add footer.
  const schema = useFieldMeta(CONTACTS_URL);
  const canCreate = schema.has("name");

  return (
    <>
      <Select<number, ContactOption>
        showSearch
        allowClear
        loading={loading}
        disabled={disabled}
        value={value ?? undefined}
        onChange={(v) => onChange?.(v ?? null)}
        options={mergedOptions}
        filterOption={(input, option) => {
          const q = input.trim().toLowerCase();
          if (!option) return false;
          return option.label.toLowerCase().includes(q) || option.caption.toLowerCase().includes(q);
        }}
        optionRender={(option) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar
              size={28}
              style={{
                backgroundColor: avatarColor(option.data.type, token.colorPrimary),
                flexShrink: 0,
                fontSize: 12,
              }}
            >
              {initials(option.data.label)}
            </Avatar>
            <div style={{ minWidth: 0, lineHeight: 1.3 }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {option.data.label}
              </div>
              {option.data.caption && (
                <div
                  style={{
                    fontSize: 12,
                    color: token.colorTextTertiary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {option.data.caption}
                </div>
              )}
            </div>
          </div>
        )}
        popupRender={(menu) =>
          canCreate ? (
            <>
              {menu}
              <Divider style={{ margin: "4px 0" }} />
              {/* preventDefault so the click doesn't blur the Select before onClick fires;
                  the drawer then takes focus, which closes the dropdown. */}
              <Button
                type="link"
                icon={<PlusOutlined />}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setQuickAddOpen(true)}
              >
                {i18n.t("sales.newCustomer", { defaultValue: "新建客户" })}
              </Button>
            </>
          ) : (
            menu
          )
        }
        placeholder={placeholder ?? i18n.t("sales.selectOrAddCustomer", { defaultValue: "选择或添加客户" })}
        style={{ width: "100%" }}
      />
      <ContactFormDrawer
        open={quickAddOpen}
        contact={null}
        onClose={() => setQuickAddOpen(false)}
        onSaved={(saved) => {
          add(saved);
          onChange?.(saved.id);
        }}
      />
    </>
  );
}
