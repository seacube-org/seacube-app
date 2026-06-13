import { useEffect, useMemo, useRef, useState } from "react";
import { AutoComplete, Button, Divider, Form, Input, InputNumber, Select, Switch, Tooltip, theme } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import { useReferenceOptions } from "@/hooks/core/useReferenceOptions";
import ProductFormDrawer from "@/components/modules/products/ProductFormDrawer";
import {
  PRODUCTS_URL,
  type ProductAttribute,
  type ProductAttributeAssignment,
  type ProductDetail,
} from "@/components/modules/products/shared";
import { useProductCatalog } from "./useProductCatalog";
import { amount as fmtAmount, num, trimDecimal } from "./format";
import { computeTotals, lineAmount, lineQuantity } from "./lineMath";
import { renderSpecTemplate } from "./specTemplate";
import type { LineItemRow } from "./types";

// Zoho-style flat table: item details (product + auto description + collapsible
// spec) | entry qty+unit | pricing (factor + unit + preview + weight chips) |
// price | discount | tax | amount+delete (sticky right). Price / discount / tax
// share one width; below TABLE_MIN_WIDTH the row scrolls horizontally under the
// right-pinned amount column instead of squeezing the inputs.
const GRID_COLUMNS = "minmax(280px, 1.6fr) 190px 110px 110px 110px 150px";
const TABLE_MIN_WIDTH = 1050;
const CELL_GAP = 12;

const cellItemStyle = { margin: 0 } as const;
// Weight-chip buttons: compact enough to sit under the qty inputs as a row.
const chipBtnStyle = { fontSize: 12, height: 22, paddingInline: 8 } as const;

/** Round a float factor to ≤6 decimals (the backend field precision). */
const round6 = (n: number) => Number(n.toFixed(6));

// Mirrors the backend model defaults (LineItem entry_unit/unit default 'PCS').
const DEFAULT_UNIT = "PCS";
// Weight chips fill kg-per-entry-unit factors (the gross-weight attribute is
// kg-based), so applying one defaults the pricing unit to KGS.
const WEIGHT_PRICING_UNIT = "KGS";

/** Spec entry label, shown above its input: long attribute names ("Gross
 *  Weight / Carton") wrap to a second line before clamping (title = fallback). */
function SpecLabel({ text }: { text: string }) {
  return (
    <span
      title={text}
      style={{
        fontSize: 12,
        lineHeight: 1.3,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 2,
        overflow: "hidden",
      }}
    >
      {text}
    </span>
  );
}

/**
 * InputNumber for percent attributes: the user types the percentage (10) while
 * the form keeps the stored fraction (0.1) — the backend, the description
 * template's :percent modifier and the weight chips all consume fractions.
 * Converting on value/onChange (not formatter/parser) keeps intermediate
 * typing like "12." intact. Form.Item injects value/onChange.
 */
function PercentInput({
  value,
  onChange,
}: {
  value?: number | string | null;
  onChange?: (v: number | null) => void;
}) {
  const display = value == null || value === "" ? null : Number((Number(value) * 100).toFixed(6));
  return (
    <InputNumber
      style={{ width: "100%" }}
      suffix="%"
      min={0}
      value={display}
      onChange={(v) => onChange?.(v == null ? null : Number((Number(v) / 100).toFixed(8)))}
    />
  );
}

/** One product attribute input, bound to items[name].spec[attribute.code]. */
function SpecAttributeField({
  rowName,
  attr,
  required,
}: {
  rowName: number;
  attr: ProductAttribute;
  required: boolean;
}) {
  const rules = required
    ? [{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]
    : undefined;
  const path = [rowName, "spec", attr.code];
  const label = attr.unit ? `${attr.name} (${attr.unit})` : attr.name;

  let control;
  if (attr.data_type === "choice") {
    control = (
      <Select
        allowClear
        showSearch={{ optionFilterProp: "label" }}
        options={(attr.choices ?? []).map((c) => ({ value: c, label: c }))}
      />
    );
  } else if (attr.data_type === "choice_or_custom") {
    control = (
      <AutoComplete
        allowClear
        options={(attr.choices ?? []).map((c) => ({ value: c }))}
        showSearch={{
          filterOption: (input, opt) =>
            String(opt?.value ?? "")
              .toLowerCase()
              .includes(input.toLowerCase()),
        }}
      />
    );
  } else if (attr.data_type === "percent") {
    control = <PercentInput />;
  } else if (attr.data_type === "decimal") {
    control = <InputNumber style={{ width: "100%" }} />;
  } else if (attr.data_type === "boolean") {
    control = <Switch />;
  } else {
    control = <Input />;
  }

  return (
    <Form.Item
      layout="vertical"
      name={path}
      label={<SpecLabel text={label} />}
      colon={false}
      rules={rules}
      valuePropName={attr.data_type === "boolean" ? "checked" : undefined}
      style={cellItemStyle}
    >
      {control}
    </Form.Item>
  );
}

type Props = {
  /** ISO currency code shown on the totals footer's 合计 line. */
  currency?: string;
  /** Defer the product catalog fetch until the form is actually shown. */
  enabled?: boolean;
};

/**
 * Form.List editor for sales document line items (Quote / SalesOrder / Invoice).
 *
 * Zoho-benchmarked layout: the item-details cell stacks the product select, the
 * auto-composed description (from the product's spec template) and a collapsible
 * spec section holding the product's assigned attribute inputs. spec is purely
 * descriptive — pricing is entry_qty × (conversion_factor ?? 1) = quantity, and
 * when the pricing unit is a weight unit that quantity IS the line's weight
 * (docs/plans/weight-from-pricing.md, line-items-zoho-simple.md).
 *
 * Weight chips ([毛重]/[净重], computed from the row's gross-weight/glazing spec
 * values) prefill the factor on weight-priced rows. A chip-written factor stays
 * linked to the spec — editing gross weight / glazing rewrites it — until the
 * user types their own value; weight-priced rows whose factor matches neither
 * weight show a soft mismatch hint.
 */
export default function LineItemsEditor({ currency, enabled = true }: Props) {
  const { token } = theme.useToken();
  const form = Form.useFormInstance();
  const catalog = useProductCatalog(enabled);
  const watchedRaw = Form.useWatch("items", form) as LineItemRow[] | undefined;
  const watched = useMemo(() => watchedRaw ?? [], [watchedRaw]);
  // Row index whose product select triggered quick-add (null = drawer closed).
  const [quickAddRow, setQuickAddRow] = useState<number | null>(null);
  // Rows with their spec section expanded (by Form.List field name).
  const [specOpen, setSpecOpen] = useState<Set<number>>(new Set());
  // Collection OPTIONS advertises POST only when the user may create products —
  // an empty schema means no create permission, so hide the quick-add footer.
  const productSchema = useFieldMeta(PRODUCTS_URL);
  const canCreateProduct = productSchema.has("name");

  // Unit codes from the core OptionSet 'unit' category; meta.is_weight marks
  // mass units (KGS/LBS) — those gate the weight chips.
  const unitRefs = useReferenceOptions("optionset:unit");
  const unitOptions = useMemo(() => unitRefs.map((u) => ({ value: u.value, label: u.value })), [unitRefs]);
  const weightUnits = useMemo(
    () => new Set(unitRefs.filter((u) => u.meta?.is_weight === true).map((u) => u.value)),
    [unitRefs],
  );

  const productOptions = useMemo(() => {
    const opts = catalog.products.map((p) => ({ value: p.id, label: p.code ? `${p.name} (${p.code})` : p.name }));
    // The catalog lists active products only — a row may reference a product
    // that was deactivated after the document was created. Surface it from the
    // per-id detail cache (loadDetail fetches regardless of active) so the
    // select shows its name instead of a raw id.
    const seen = new Set(catalog.products.map((p) => p.id));
    for (const row of watched) {
      const id = row?.product;
      if (id == null || seen.has(id)) continue;
      seen.add(id);
      const d = catalog.getDetail(id);
      const name = d ? (d.code ? `${d.name} (${d.code})` : d.name) : `#${id}`;
      opts.push({
        value: id,
        label: `${name} · ${i18n.t("products.inactive", { defaultValue: "已停用" })}`,
      });
    }
    return opts;
  }, [catalog, watched]);

  // Lazily fetch detail (attribute_assignments) for any product referenced by a row.
  useEffect(() => {
    for (const row of watched) {
      if (row?.product != null && !catalog.getDetail(row.product)) {
        void catalog.loadDetail(row.product);
      }
    }
  }, [watched, catalog]);

  const patchRow = (rowName: number, patch: Partial<LineItemRow>) => {
    const items = (form.getFieldValue("items") as LineItemRow[]) ?? [];
    const copy = [...items];
    copy[rowName] = { ...(copy[rowName] ?? {}), ...patch };
    form.setFieldValue("items", copy);
  };

  const onSelectProduct = (rowName: number, productId: number | null) => {
    if (productId == null) return;
    void catalog.loadDetail(productId).then((detail) => {
      const items = (form.getFieldValue("items") as LineItemRow[]) ?? [];
      const row = items[rowName] ?? {};
      // A newer selection on this row won the race — drop this stale response so
      // it can't overwrite the current product / prefilled fields.
      if (row.product !== productId) return;
      const next = { ...row, product: productId };
      const p = detail ?? catalog.byId.get(productId);
      if (p) {
        // The snapshot freezes the product name on the document; refresh it on an
        // explicit product change (the backend only auto-fills it when blank).
        // Description is generated from description_template (see effect below).
        next.product_name_snapshot = p.name;
        // Prefill units from the product's base unit while they're untouched.
        if (p.base_unit) {
          if ((row.entry_unit ?? DEFAULT_UNIT) === DEFAULT_UNIT) next.entry_unit = p.base_unit;
          if ((row.unit ?? DEFAULT_UNIT) === DEFAULT_UNIT) next.unit = p.base_unit;
        }
        if ((row.tax_rate == null || row.tax_rate === "") && detail?.default_tax_rate != null) {
          next.tax_rate = detail.default_tax_rate;
        }
      }
      const copy = [...items];
      copy[rowName] = next;
      form.setFieldValue("items", copy);
      // Surface the spec section right away when the product demands values.
      if (detail?.attribute_assignments?.some((a) => a.is_required)) {
        setSpecOpen((prev) => new Set(prev).add(rowName));
      }
    });
  };

  // Quick-added product: cache it, set it on the row that opened the drawer, and
  // run the normal selection prefill (detail is already cached by catalog.add).
  const onQuickAddSaved = (saved: ProductDetail) => {
    catalog.add(saved);
    if (quickAddRow == null) return;
    patchRow(quickAddRow, { product: saved.id });
    onSelectProduct(quickAddRow, saved.id);
  };

  // Auto-compose descriptions from the product's description_template. A row
  // keeps regenerating while its description is blank or still equals the last
  // auto-generated value; once the user types their own text it's left alone
  // (clearing the field re-enables generation). Mirrors the backend autofill.
  const lastAutoDesc = useRef(new Map<number, string>());
  // Factor a chip last wrote per row (+ which weight it was): while the row's
  // factor still equals it, spec edits rewrite the factor (effect below); a
  // hand-typed or cleared factor breaks the link.
  const lastAutoFactor = useRef(new Map<number, { kind: "gross" | "net"; value: number }>());
  const lastRowCount = useRef(0);
  useEffect(() => {
    // The map is keyed by row index; removing a row shifts indices, so reset
    // tracking on any count change (safe failure: auto-regen pauses until the
    // description matches the template again, instead of overwriting wrongly).
    if (watched.length !== lastRowCount.current) {
      lastRowCount.current = watched.length;
      lastAutoDesc.current.clear();
      lastAutoFactor.current.clear(); // chip links are index-keyed too
    }
    watched.forEach((row, idx) => {
      if (row?.product == null) return;
      const template = catalog.getDetail(row.product)?.description_template;
      if (!template) return;
      // @unit must see the EFFECTIVE pricing unit: one-level rows mirror
      // entry_unit on save, so mirror here too before rendering.
      const factored = row.conversion_factor != null && row.conversion_factor !== "";
      const expected = renderSpecTemplate(template, row.spec, {
        unit: (factored ? row.unit : row.entry_unit) ?? "",
        entry_unit: row.entry_unit ?? "",
      });
      const current = row.description ?? "";
      if (current === expected) {
        lastAutoDesc.current.set(idx, expected);
        return;
      }
      const last = lastAutoDesc.current.get(idx) ?? "";
      if (current !== "" && current !== last) return; // user-written — don't touch
      patchRow(idx, { description: expected });
      lastAutoDesc.current.set(idx, expected);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched, catalog]);

  // Chip-written factors follow the spec: while a row's factor still equals
  // what the chip wrote, editing gross weight / glazing rewrites it to the
  // refreshed gross/net figure. Hand-editing or clearing the factor unlinks.
  useEffect(() => {
    watched.forEach((row, idx) => {
      const auto = lastAutoFactor.current.get(idx);
      if (!auto) return;
      const current = row?.conversion_factor;
      if (current == null || current === "" || Math.abs(num(current) - auto.value) > 1e-9) {
        lastAutoFactor.current.delete(idx);
        return;
      }
      // The link only holds while the row is weight-priced; switching to a
      // non-weight unit (e.g. PCS) repurposes the factor, so stop following.
      if (!weightUnits.has(row?.unit ?? "")) {
        lastAutoFactor.current.delete(idx);
        return;
      }
      const gw = num((row?.spec ?? {}).gross_weight_per_carton);
      if (!(gw > 0)) return; // weight cleared — keep the factor, resume if it returns
      const expected = auto.kind === "gross" ? round6(gw) : round6(gw * (1 - num((row?.spec ?? {}).glazing)));
      if (Math.abs(expected - auto.value) <= 1e-9) return;
      patchRow(idx, { conversion_factor: expected });
      lastAutoFactor.current.set(idx, { kind: auto.kind, value: expected });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched]);

  // Weight chip: fill the factor from the row's spec values and record the
  // chip→factor link for the follow-through effect above; default the pricing
  // unit to KGS while it's untouched.
  const applyChip = (rowName: number, kind: "gross" | "net", value: number, row: LineItemRow) => {
    const patch: Partial<LineItemRow> = { conversion_factor: value };
    if (!row.unit || !weightUnits.has(row.unit)) patch.unit = WEIGHT_PRICING_UNIT;
    patchRow(rowName, patch);
    lastAutoFactor.current.set(rowName, { kind, value });
  };

  const toggleSpec = (rowName: number) => {
    setSpecOpen((prev) => {
      const next = new Set(prev);
      if (next.has(rowName)) next.delete(rowName);
      else next.add(rowName);
      return next;
    });
  };

  const headerCell = (label: string, align: "left" | "right" = "left") => (
    <div style={{ fontSize: 13, fontWeight: 600, color: token.colorTextSecondary, textAlign: align }}>{label}</div>
  );

  const totals = computeTotals(watched);

  // Totals live outside the scrolling region, pinned to the right edge.
  const totalsLine = (label: string, value: string, strong = false) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 32,
        padding: "4px 0",
        fontSize: strong ? 15 : 13,
        fontWeight: strong ? 600 : undefined,
        color: strong ? token.colorText : token.colorTextSecondary,
      }}
    >
      <span>{label}</span>
      <span style={{ color: token.colorText, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );

  // Right-pinned amount column (kept for narrow viewports; on wide screens the
  // table fits and sticky degrades to a normal column). Sticky cells stretch
  // over the row's vertical padding so scrolling content can't peek around them.
  const stickyCell = (vPad: number, background: string): React.CSSProperties => ({
    position: "sticky",
    right: 0,
    zIndex: 2,
    alignSelf: "stretch",
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    margin: `${-vPad}px -16px ${-vPad}px 0`,
    padding: `${vPad}px 16px ${vPad}px 12px`,
    borderLeft: `1px solid ${token.colorBorderSecondary}`,
    background,
  });
  // The header bg token is translucent — layer it over the container colour so
  // the sticky header cell stays opaque while content scrolls beneath it.
  const stickyHeaderBg = `linear-gradient(${token.colorFillQuaternary}, ${token.colorFillQuaternary}) ${token.colorBgContainer}`;

  // Spec validation errors per row, surfaced as a red badge on the toggle so
  // collapsed required fields aren't silently invisible.
  const fieldErrors = form.getFieldsError().filter((f) => f.errors.length > 0);

  return (
    <Form.List name="items">
      {(fields, { add, remove }) => (
        <>
          <div
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadiusLG,
              overflow: "hidden",
            }}
          >
            {/* Only this region scrolls horizontally; the footers below stay put. */}
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: TABLE_MIN_WIDTH }}>
                {/* Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID_COLUMNS,
                    gap: CELL_GAP,
                    padding: "12px 16px",
                    background: token.colorFillQuaternary,
                  }}
                >
                  {headerCell(i18n.t("sales.itemDetails", { defaultValue: "品目详情" }))}
                  {headerCell(i18n.t("sales.quantity", { defaultValue: "数量" }))}
                  {headerCell(i18n.t("sales.unitPrice", { defaultValue: "单价" }))}
                  {headerCell(i18n.t("sales.discountPct", { defaultValue: "折扣 %" }))}
                  {headerCell(i18n.t("sales.taxRate", { defaultValue: "税率 (0–1)" }))}
                  <div style={stickyCell(12, stickyHeaderBg)}>
                    <div style={{ flex: 1 }}>
                      {headerCell(i18n.t("sales.lineAmount", { defaultValue: "金额" }), "right")}
                    </div>
                    <div style={{ width: 32 }} />
                  </div>
                </div>

                {fields.length === 0 && (
                  <div
                    style={{
                      padding: "24px 16px",
                      textAlign: "center",
                      color: token.colorTextTertiary,
                      borderTop: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    {i18n.t("sales.noLineItems", { defaultValue: "尚无行项目" })}
                  </div>
                )}

                {fields.map(({ key, name }) => {
                  const row = watched[name] ?? {};
                  const factorSet = row.conversion_factor != null && row.conversion_factor !== "";
                  const assignments: ProductAttributeAssignment[] =
                    row.product != null ? (catalog.getDetail(row.product)?.attribute_assignments ?? []) : [];
                  const hasSpec = assignments.length > 0;
                  const expanded = specOpen.has(name);
                  const specHasError = fieldErrors.some(
                    (f) => f.name[0] === "items" && f.name[1] === name && f.name[2] === "spec",
                  );

                  // Weight chips: from the row's spec values, shown while the row
                  // is (or is becoming) weight-priced — never on rows already
                  // two-level in a non-weight unit (e.g. ×24 PCS).
                  const gw = num((row.spec ?? {}).gross_weight_per_carton);
                  const glazing = num((row.spec ?? {}).glazing);
                  const chipGross = gw > 0 ? round6(gw) : 0;
                  const chipNet = gw > 0 ? round6(gw * (1 - glazing)) : 0;
                  const chipsVisible = gw > 0 && (!factorSet || weightUnits.has(row.unit ?? ""));
                  const factorIs = (v: number) => factorSet && Math.abs(num(row.conversion_factor) - v) <= 1e-9;
                  // Soft hint, not a blocking rule: a weight-priced row whose
                  // factor matches neither spec weight is usually stale/mistyped.
                  const factorMismatch =
                    factorSet &&
                    gw > 0 &&
                    weightUnits.has(row.unit ?? "") &&
                    !factorIs(chipGross) &&
                    !factorIs(chipNet);

                  return (
                    <div
                      key={key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: GRID_COLUMNS,
                        gap: CELL_GAP,
                        alignItems: "start",
                        padding: "14px 16px",
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      {/* Existing item id — hidden but registered so it travels with the row (diff-by-id sync). */}
                      <Form.Item name={[name, "id"]} hidden>
                        <Input />
                      </Form.Item>

                      {/* Item details: product + auto description + collapsible spec. */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Form.Item name={[name, "product"]} style={cellItemStyle}>
                          <Select
                            allowClear
                            showSearch={{ optionFilterProp: "label" }}
                            loading={catalog.loading}
                            options={productOptions}
                            placeholder={i18n.t("sales.selectOrAddProduct", { defaultValue: "选择或添加产品" })}
                            onChange={(v) => onSelectProduct(name, v ?? null)}
                            popupRender={(menu) =>
                              canCreateProduct ? (
                                <>
                                  {menu}
                                  <Divider style={{ margin: "4px 0" }} />
                                  {/* preventDefault so the click doesn't blur the Select before
                                      onClick fires; the drawer then takes focus, closing the dropdown. */}
                                  <Button
                                    type="link"
                                    icon={<PlusOutlined />}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setQuickAddRow(name)}
                                  >
                                    {i18n.t("sales.newProduct", { defaultValue: "新建产品" })}
                                  </Button>
                                </>
                              ) : (
                                menu
                              )
                            }
                          />
                        </Form.Item>

                        <Form.Item name={[name, "description"]} style={cellItemStyle}>
                          <Input.TextArea
                            autoSize={{ minRows: 1, maxRows: 6 }}
                            maxLength={500}
                            placeholder={i18n.t("sales.description", { defaultValue: "描述" })}
                          />
                        </Form.Item>

                        {hasSpec && (
                          <>
                            <Button
                              type="link"
                              size="small"
                              danger={specHasError}
                              onClick={() => toggleSpec(name)}
                              style={{ alignSelf: "flex-start", padding: 0, height: "auto", fontSize: 12 }}
                            >
                              {expanded ? "▾" : "▸"} {i18n.t("sales.spec", { defaultValue: "规格" })}(
                              {assignments.length}){specHasError ? " ⚠" : ""}
                            </Button>
                            {/* display:none keeps the fields mounted so values persist
                                and required-attr validation still runs while collapsed. */}
                            <div
                              style={{
                                display: expanded ? "grid" : "none",
                                // Label-above fields in an adaptive grid: two columns
                                // at the cell's usual width, one on narrow viewports.
                                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                columnGap: 12,
                                rowGap: 8,
                                padding: "10px 12px",
                                background: token.colorFillQuaternary,
                                borderRadius: token.borderRadius,
                              }}
                            >
                              {assignments.map((a) => (
                                <SpecAttributeField
                                  key={a.attribute.code}
                                  rowName={name}
                                  attr={a.attribute}
                                  required={a.is_required}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Quantity, two symmetric [qty][unit] lines: the entry count
                          on top, the conversion (×factor + pricing unit) below —
                          "100 CTN ×10 KGS = 1000 KGS". Blank factor = one-level
                          pricing; the pricing unit then mirrors the entry unit
                          (greyed, matching the server-side mirror on save). */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Form.Item name={[name, "entry_qty"]} style={{ ...cellItemStyle, flex: 1, minWidth: 0 }}>
                            <InputNumber min={0} style={{ width: "100%" }} />
                          </Form.Item>
                          <Form.Item name={[name, "entry_unit"]} style={{ ...cellItemStyle, width: 76 }}>
                            <Select options={unitOptions} showSearch={{ optionFilterProp: "label" }} />
                          </Form.Item>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Form.Item
                            name={[name, "conversion_factor"]}
                            style={{ ...cellItemStyle, flex: 1, minWidth: 0 }}
                          >
                            <InputNumber
                              min={0}
                              prefix="×"
                              style={{ width: "100%" }}
                              placeholder="1 : 1"
                              title={i18n.t("sales.conversionFactorHint", {
                                defaultValue: "每录入单位折合的计价单位数；留空为一级计价",
                              })}
                            />
                          </Form.Item>
                          {factorSet ? (
                            <Form.Item name={[name, "unit"]} style={{ ...cellItemStyle, width: 76 }}>
                              <Select options={unitOptions} showSearch={{ optionFilterProp: "label" }} />
                            </Form.Item>
                          ) : (
                            <Select
                              disabled
                              value={row.entry_unit ?? DEFAULT_UNIT}
                              options={unitOptions}
                              style={{ width: 76 }}
                            />
                          )}
                        </div>
                        {factorSet && (
                          <div style={{ fontSize: 12, color: token.colorTextTertiary, textAlign: "right" }}>
                            = {trimDecimal(String(lineQuantity(row)))} {row.unit ?? ""}
                          </div>
                        )}
                        {chipsVisible && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {/* Real buttons (hover feedback + tooltip) so the one-click
                                fill is discoverable; solid primary = factor matches. */}
                            <Tooltip
                              title={i18n.t("sales.chipApplyHint", {
                                defaultValue: "点击填入换算系数 ×{{value}}（跟随规格更新）",
                                value: trimDecimal(chipGross),
                              })}
                            >
                              <Button
                                size="small"
                                type={factorIs(chipGross) ? "primary" : "default"}
                                style={chipBtnStyle}
                                onClick={() => applyChip(name, "gross", chipGross, row)}
                              >
                                {i18n.t("sales.chipGross", { defaultValue: "毛重" })} {trimDecimal(chipGross)}
                              </Button>
                            </Tooltip>
                            {chipNet !== chipGross && (
                              <Tooltip
                                title={i18n.t("sales.chipApplyHint", {
                                  defaultValue: "点击填入换算系数 ×{{value}}（跟随规格更新）",
                                  value: trimDecimal(chipNet),
                                })}
                              >
                                <Button
                                  size="small"
                                  type={factorIs(chipNet) ? "primary" : "default"}
                                  style={chipBtnStyle}
                                  onClick={() => applyChip(name, "net", chipNet, row)}
                                >
                                  {i18n.t("sales.chipNet", { defaultValue: "净重" })} {trimDecimal(chipNet)}
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                        )}
                        {factorMismatch && (
                          <div style={{ fontSize: 12, color: token.colorWarning }}>
                            {i18n.t("sales.factorMismatch", {
                              defaultValue: "系数与规格毛重/净重不符（{{expected}}）",
                              expected:
                                chipNet !== chipGross
                                  ? `${trimDecimal(chipGross)} / ${trimDecimal(chipNet)}`
                                  : trimDecimal(chipGross),
                            })}
                          </div>
                        )}
                      </div>

                      <Form.Item name={[name, "unit_price"]} style={cellItemStyle}>
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item name={[name, "discount"]} style={cellItemStyle}>
                        <InputNumber min={0} max={100} style={{ width: "100%" }} />
                      </Form.Item>

                      <Form.Item name={[name, "tax_rate"]} style={cellItemStyle}>
                        <InputNumber min={0} max={1} step={0.01} style={{ width: "100%" }} />
                      </Form.Item>

                      <div style={stickyCell(14, token.colorBgContainer)}>
                        <div
                          style={{
                            flex: 1,
                            paddingTop: 5,
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: 500,
                          }}
                        >
                          {fmtAmount(lineAmount(row))}
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          aria-label="remove"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pinned below the scroll region: add-row action. */}
            <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, padding: "6px 8px" }}>
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    entry_qty: 1,
                    entry_unit: DEFAULT_UNIT,
                    unit: DEFAULT_UNIT,
                    unit_price: 0,
                    discount: 0,
                    tax_rate: 0,
                    spec: {},
                  })
                }
              >
                {i18n.t("sales.addLineItem", { defaultValue: "添加行项目" })}
              </Button>
            </div>

            {/* Pinned totals footer, right-aligned. */}
            <div
              style={{
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                padding: "12px 20px",
                background: token.colorFillQuaternary,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div style={{ minWidth: 320 }}>
                {totalsLine(i18n.t("sales.subtotal", { defaultValue: "小计" }), fmtAmount(totals.subtotal))}
                {totalsLine(i18n.t("sales.taxTotal", { defaultValue: "税额" }), fmtAmount(totals.tax))}
                <Divider style={{ margin: "6px 0" }} />
                {totalsLine(
                  `${i18n.t("sales.total", { defaultValue: "合计" })}${currency ? ` (${currency})` : ""}`,
                  fmtAmount(totals.total),
                  true,
                )}
              </div>
            </div>
          </div>

          {/* Quick-add product drawer, shared by all rows (renders via portal). */}
          <ProductFormDrawer
            open={quickAddRow != null}
            product={null}
            onClose={() => setQuickAddRow(null)}
            onSaved={onQuickAddSaved}
          />
        </>
      )}
    </Form.List>
  );
}
