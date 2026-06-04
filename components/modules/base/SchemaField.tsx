import { type ReactNode } from "react";
import { DatePicker, Form, Input, InputNumber, Select, Switch } from "antd";
import type { NamePath } from "antd/es/form/interface";
import type { Rule } from "antd/es/form";
import { useReferenceOptions } from "@/hooks/core/useReferenceOptions";
import type { FieldMeta, FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";

export type FieldConfig = {
  label?: string;
  /** Override required (default: from schema). */
  required?: boolean;
  /** Extra antd rules (e.g. email format) appended after the required rule. */
  rules?: Rule[];
  /** Full custom control — the escape hatch from by-type rendering. */
  control?: ReactNode | ((meta: FieldMeta | undefined) => ReactNode);
  /** Choice options from a reference source ('currency' | 'optionset:<cat>'). */
  ref?: string;
  /** Explicit choice options (overrides schema/ref). */
  options?: { value: string; label: string }[];
  /** Props forwarded to the default control (e.g. {min:0}, {rows:3}). */
  inputProps?: Record<string, unknown>;
  /** Extra Form.Item props (style, tooltip, …). */
  itemProps?: Record<string, unknown>;
  /** For boolean-style controls (Switch/Checkbox). */
  valuePropName?: string;
};

type Props = {
  schema: FieldSchema;
  /** Field name used to look up schema metadata (type/required/maxLength). */
  name: string;
  /** Form.Item path, when it differs from `name` — e.g. a Form.List item: [index, name]. */
  namePath?: NamePath;
  config?: FieldConfig;
};

const NUMERIC = new Set(["integer", "float", "decimal"]);

/** snake_case → "Title Case", a readable fallback before the schema label loads. */
const humanize = (name: string) => name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Schema-driven form field: a Form.Item whose control is chosen by the backend
 * OPTIONS field type, with required/maxLength/visibility folded in — and a
 * per-field customization entry (`control` for a full custom widget, plus
 * `ref`/`options`/`rules`/`inputProps` knobs). See docs/schema-driven-forms.md (L2).
 *
 * Layout (which fields, order, sections) stays the page's job — the page lays
 * out <SchemaField/>s; this only owns one field's item + control.
 */
export default function SchemaField({ schema, name, namePath, config = {} }: Props) {
  // Always called (hooks rule); '' → no-op fetch, returns []. So a field opts
  // into reference options purely via config.ref.
  const refOptions = useReferenceOptions(config.ref ?? "");

  // Staff-hidden / unknown fields are absent from the schema → don't render.
  if (!schema.has(name)) return null;

  const meta = schema.field(name);
  const type = meta?.type;
  const required = config.required ?? meta?.required ?? false;
  const rules: Rule[] = [
    ...(required ? [{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }] : []),
    ...(config.rules ?? []),
  ];
  // Label is schema-driven (localized server-side via Accept-Language); config.label
  // only for overrides, humanized name as a cold-load fallback.
  const label = config.label ?? meta?.label ?? humanize(name);

  const isChoice = !config.control && (config.ref || config.options || (meta?.choices.length ?? 0) > 0 || type === "choice");
  const isBoolean = !config.control && type === "boolean";
  const valuePropName = config.valuePropName ?? (isBoolean ? "checked" : undefined);

  const control = ((): ReactNode => {
    if (config.control) return typeof config.control === "function" ? config.control(meta) : config.control;
    if (isChoice) {
      const options = config.options ?? (config.ref ? refOptions : meta?.choices) ?? [];
      return <Select options={options} showSearch optionFilterProp="label" {...config.inputProps} />;
    }
    if (type && NUMERIC.has(type)) return <InputNumber style={{ width: "100%" }} {...config.inputProps} />;
    if (isBoolean) return <Switch {...config.inputProps} />;
    if (type === "date" || type === "datetime") return <DatePicker style={{ width: "100%" }} {...config.inputProps} />;
    return <Input maxLength={meta?.max_length} {...config.inputProps} />;
  })();

  return (
    <Form.Item name={namePath ?? name} label={label} rules={rules} valuePropName={valuePropName} {...config.itemProps}>
      {control}
    </Form.Item>
  );
}
