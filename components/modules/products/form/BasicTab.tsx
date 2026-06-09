import { Input, InputNumber } from "antd";
import SchemaField from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import { FIELD_GRID_STYLE, FIELD_ITEM_STYLE, FULL_WIDTH_ITEM_STYLE } from "./layout";

const { TextArea } = Input;

/**
 * Top-level product fields. Label + control + required/maxLength all come from
 * the backend OPTIONS schema; `config` only overrides specifics: `base_unit`
 * choices come from the schema enum, `default_tax_rate` is shown as a percent
 * input (the form holds the percent value; the drawer divides by 100 on submit),
 * and `is_active` renders as a Switch.
 */
export default function BasicTab({ schema }: { schema: FieldSchema }) {
  return (
    <div style={FIELD_GRID_STYLE}>
      <SchemaField schema={schema} name="name" config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="code" config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="category" config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      {/* base_unit choices come straight from the schema enum (KGS/LBS/CTN/PCS). */}
      <SchemaField schema={schema} name="base_unit" config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
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
      <SchemaField schema={schema} name="is_active" config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
    </div>
  );
}
