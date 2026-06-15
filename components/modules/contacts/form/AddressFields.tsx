import type { NamePath } from "antd/es/form/interface";
import SchemaField from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import PhoneInput from "./PhoneInput";
import { FIELD_GRID_STYLE, FIELD_ITEM_STYLE, FULL_WIDTH_ITEM_STYLE } from "./layout";

/**
 * The eight address sub-fields, schema-driven. `schema` is the address child
 * serializer's schema (e.g. `contactSchema.nested("addresses")` or
 * `docSchema.nested("billing_address")`); `namePrefix` is the Form path the
 * fields hang under — `["billing_address"]` for a fixed object, or `[index]`
 * inside a `<Form.List name="addresses">`. Labels come from OPTIONS (localized).
 */
export default function AddressFields({ schema, namePrefix }: { schema: FieldSchema; namePrefix: (string | number)[] }) {
  const at = (leaf: string): NamePath => [...namePrefix, leaf];
  return (
    <div style={FIELD_GRID_STYLE}>
      <SchemaField schema={schema} name="attention" namePath={at("attention")} config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="address_line1" namePath={at("address_line1")} config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="address_line2" namePath={at("address_line2")} config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="city" namePath={at("city")} config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="state" namePath={at("state")} config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="postal_code" namePath={at("postal_code")} config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      <SchemaField schema={schema} name="country" namePath={at("country")} config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      <SchemaField
        schema={schema}
        name="phone"
        namePath={at("phone")}
        config={{
          itemProps: { style: FULL_WIDTH_ITEM_STYLE },
          control: (meta) => <PhoneInput maxLength={meta?.max_length} />,
        }}
      />
    </div>
  );
}
