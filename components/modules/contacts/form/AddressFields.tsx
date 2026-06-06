import SchemaField from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import PhoneInput from "./PhoneInput";
import { FIELD_GRID_STYLE, FIELD_ITEM_STYLE, FULL_WIDTH_ITEM_STYLE } from "./layout";

/**
 * Billing / shipping address sub-fields (a JSONField on the backend). Schema-driven:
 * `schema.nested(prefix)` is the address child serializer (billing & shipping share
 * the same shape); labels come from OPTIONS (localized via Accept-Language).
 */
export default function AddressFields({
  schema,
  prefix,
}: {
  schema: FieldSchema;
  prefix: "billing_address" | "shipping_address";
}) {
  const s = schema.nested(prefix);
  return (
    <div style={FIELD_GRID_STYLE}>
      <SchemaField
        schema={s}
        name="attention"
        namePath={[prefix, "attention"]}
        config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }}
      />
      <SchemaField
        schema={s}
        name="address_line1"
        namePath={[prefix, "address_line1"]}
        config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }}
      />
      <SchemaField
        schema={s}
        name="address_line2"
        namePath={[prefix, "address_line2"]}
        config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }}
      />
      <SchemaField
        schema={s}
        name="city"
        namePath={[prefix, "city"]}
        config={{ itemProps: { style: FIELD_ITEM_STYLE } }}
      />
      <SchemaField
        schema={s}
        name="state"
        namePath={[prefix, "state"]}
        config={{ itemProps: { style: FIELD_ITEM_STYLE } }}
      />
      <SchemaField
        schema={s}
        name="postal_code"
        namePath={[prefix, "postal_code"]}
        config={{ itemProps: { style: FIELD_ITEM_STYLE } }}
      />
      <SchemaField
        schema={s}
        name="country"
        namePath={[prefix, "country"]}
        config={{ itemProps: { style: FIELD_ITEM_STYLE } }}
      />
      <SchemaField
        schema={s}
        name="phone"
        namePath={[prefix, "phone"]}
        config={{
          itemProps: { style: FULL_WIDTH_ITEM_STYLE },
          control: (meta) => <PhoneInput maxLength={meta?.max_length} />,
        }}
      />
    </div>
  );
}
