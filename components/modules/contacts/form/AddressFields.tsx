import { Space } from "antd";
import SchemaField, { FLEX_ITEM } from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";

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
    <>
      <SchemaField schema={s} name="attention" namePath={[prefix, "attention"]} />
      <SchemaField schema={s} name="address_line1" namePath={[prefix, "address_line1"]} />
      <SchemaField schema={s} name="address_line2" namePath={[prefix, "address_line2"]} />
      <Space style={{ display: "flex" }} size="middle">
        <SchemaField schema={s} name="city" namePath={[prefix, "city"]} config={FLEX_ITEM} />
        <SchemaField schema={s} name="state" namePath={[prefix, "state"]} config={FLEX_ITEM} />
      </Space>
      <Space style={{ display: "flex" }} size="middle">
        <SchemaField schema={s} name="postal_code" namePath={[prefix, "postal_code"]} config={FLEX_ITEM} />
        <SchemaField schema={s} name="country" namePath={[prefix, "country"]} config={FLEX_ITEM} />
      </Space>
      <SchemaField schema={s} name="phone" namePath={[prefix, "phone"]} />
    </>
  );
}
