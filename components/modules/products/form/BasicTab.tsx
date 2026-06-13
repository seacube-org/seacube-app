import { Form, Input, InputNumber, Mentions, Typography, theme } from "antd";
import SchemaField from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import {
  BUILTIN_TEMPLATE_CODES,
  renderSpecTemplate,
  templateCodes,
} from "@/components/modules/sales/shared/specTemplate";
import { sampleSpecValue, useProductAttributes, type ProductAttribute } from "../shared";
import { FIELD_GRID_STYLE, FIELD_ITEM_STYLE, FULL_WIDTH_ITEM_STYLE } from "./layout";

const { TextArea } = Input;

// A mention query can only be a placeholder: code chars plus an optional
// ":percent" tail. Anything else (e.g. "/", ",", literal text) ends the
// mention session immediately instead of leaving an empty dropdown open.
const MENTION_QUERY = /^[A-Za-z0-9_]*(?::[a-z]*)?$/;

/** The product's currently assigned attributes, resolved against the catalog
 * (seed attributes cover non-admin editors, whose catalog fetch is forbidden). */
function useAssignedAttributes(seedAttributes: ProductAttribute[]): ProductAttribute[] {
  const assignments = Form.useWatch("attribute_assignments") as { attribute_id?: number }[] | undefined;
  const { attributes } = useProductAttributes(true);
  const byId = new Map([...seedAttributes, ...attributes].map((a) => [a.id, a]));
  return (assignments ?? [])
    .map((row) => (row?.attribute_id != null ? byId.get(row.attribute_id) : undefined))
    .filter((a): a is ProductAttribute => !!a);
}

/**
 * Template editor with @-mention autocomplete: typing `@` lists the assigned
 * attribute codes (percent attributes also offer a `:percent` variant) and the
 * line-level builtins. Form.Item injects value/onChange.
 */
function TemplateMentions({
  seedAttributes,
  ...rest
}: {
  seedAttributes: ProductAttribute[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  const assigned = useAssignedAttributes(seedAttributes);
  const options = [
    ...assigned.map((a) => ({ key: a.code, value: a.code, label: `${a.code} · ${a.name}` })),
    ...assigned
      .filter((a) => a.data_type === "percent")
      .map((a) => ({ key: `${a.code}:percent`, value: `${a.code}:percent`, label: `${a.code}:percent · 10%` })),
    { key: "unit", value: "unit", label: `unit · ${i18n.t("products.builtinUnit", { defaultValue: "计价单位" })}` },
    {
      key: "entry_unit",
      value: "entry_unit",
      label: `entry_unit · ${i18n.t("products.builtinEntryUnit", { defaultValue: "录入单位" })}`,
    },
  ];
  return (
    <Mentions
      {...rest}
      autoSize={{ minRows: 2, maxRows: 6 }}
      maxLength={200}
      prefix="@"
      validateSearch={(text) => MENTION_QUERY.test(text)}
      options={options}
      placeholder={'e.g. "@grade, @glazing:percent glazing, size: @size"'}
    />
  );
}

/**
 * Live render of the description template against sample values for the
 * product's currently assigned attributes (first choice / 10 / 10% / the
 * attribute name, by type). Codes not in the assignment set stay blank — so
 * the preview also demonstrates segment dropping — and are flagged, mirroring
 * the backend's save-time validation.
 */
function TemplatePreview({ seedAttributes }: { seedAttributes: ProductAttribute[] }) {
  const { token } = theme.useToken();
  const template = Form.useWatch("description_template") as string | undefined;
  const baseUnit = Form.useWatch("base_unit") as string | undefined;
  const assigned = useAssignedAttributes(seedAttributes);

  if (!template?.trim()) return null;

  const sample: Record<string, unknown> = {};
  for (const attr of assigned) sample[attr.code] = sampleSpecValue(attr);
  // Builtin samples: @unit previews as the product's base unit, @entry_unit
  // as a carton (the typical two-level entry).
  const rendered = renderSpecTemplate(template, sample, { unit: baseUnit ?? "KGS", entry_unit: "CTN" });
  const unknown = templateCodes(template).filter((c) => !(c in sample) && !BUILTIN_TEMPLATE_CODES.has(c));

  return (
    <div style={{ ...FULL_WIDTH_ITEM_STYLE, marginTop: -12, marginBottom: 16 }}>
      <div
        style={{
          padding: "8px 12px",
          background: token.colorFillQuaternary,
          borderRadius: token.borderRadius,
          fontSize: 13,
          whiteSpace: "pre-line",
        }}
      >
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("products.templatePreview", { defaultValue: "预览" })}:{" "}
        </Typography.Text>
        {rendered || (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {i18n.t("products.templatePreviewEmpty", { defaultValue: "(空)" })}
          </Typography.Text>
        )}
      </div>
      {unknown.length > 0 && (
        <Typography.Text type="warning" style={{ fontSize: 12 }}>
          {i18n.t("products.templateUnknownCodes", { defaultValue: "未分配的规格代码" })}:{" "}
          {unknown.map((c) => `@${c}`).join(", ")}
        </Typography.Text>
      )}
    </div>
  );
}

/**
 * Top-level product fields. Label + control + required/maxLength all come from
 * the backend OPTIONS schema; `config` only overrides specifics: `base_unit`
 * choices come from the schema enum, `default_tax_rate` is shown as a percent
 * input (the form holds the percent value; the drawer divides by 100 on submit),
 * and `is_active` renders as a Switch.
 */
export default function BasicTab({
  schema,
  seedAttributes = [],
}: {
  schema: FieldSchema;
  seedAttributes?: ProductAttribute[];
}) {
  return (
    <div style={FIELD_GRID_STYLE}>
      <SchemaField schema={schema} name="name" config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="code" config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="category" config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      {/* base_unit codes come from the core OptionSet 'unit' category (the model
          no longer declares choices, so the OPTIONS enum is empty). */}
      <SchemaField
        schema={schema}
        name="base_unit"
        config={{ ref: "optionset:unit", itemProps: { style: FIELD_ITEM_STYLE } }}
      />
      {/* Tax stored as a 0-1 decimal; collected here as a percent for usability. */}
      <SchemaField
        schema={schema}
        name="default_tax_rate"
        config={{
          label: i18n.t("products.defaultTaxRate", { defaultValue: "默认税率" }),
          control: <InputNumber style={{ width: "100%" }} min={0} max={100} suffix="%" />,
          itemProps: { style: FIELD_ITEM_STYLE },
        }}
      />
      <SchemaField
        schema={schema}
        name="description"
        config={{ control: <TextArea rows={4} />, itemProps: { style: FULL_WIDTH_ITEM_STYLE } }}
      />
      {/* Spec→line-description template: @code placeholders resolve against the
          line item's spec; a blank line description is auto-composed from it.
          Comma-separated segments drop entirely when their values are blank. */}
      <SchemaField
        schema={schema}
        name="description_template"
        config={{
          control: <TemplateMentions seedAttributes={seedAttributes} />,
          itemProps: {
            style: FULL_WIDTH_ITEM_STYLE,
            tooltip: i18n.t("products.descriptionTemplateHint", {
              defaultValue:
                "用 @规格代码 引用规格值;@unit/@entry_unit 引用行的计价/录入单位;:percent 把 0.1 显示为 10%;逗号分隔的片段在其值全为空时整段不渲染",
            }),
          },
        }}
      />
      <TemplatePreview seedAttributes={seedAttributes} />
      <SchemaField schema={schema} name="is_active" config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
    </div>
  );
}
