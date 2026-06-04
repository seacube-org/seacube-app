import { Input, Segmented, Space } from "antd";
import SchemaField, { FLEX_ITEM } from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import { TYPE_OPTIONS, typeLabel, type ContactType } from "../shared";

const { TextArea } = Input;

/**
 * Top-level contact fields. Label + control + required/maxLength/visibility all
 * come from the backend OPTIONS schema (labels localized via Accept-Language).
 * `config` is only for overrides: `type`/`notes` custom controls, `currency` ref
 * source, `email` format rule, and layout (Space rows / flex).
 */
export default function BasicTab({ schema }: { schema: FieldSchema }) {
  const typeValues = schema.choices("type");
  const typeOptions = (
    typeValues.length ? typeValues.map((c) => c.value) : TYPE_OPTIONS.map((o) => o.value)
  ).map((v) => ({ value: v, label: typeLabel(v as ContactType) }));

  return (
    <>
      <SchemaField schema={schema} name="type" config={{ control: <Segmented options={typeOptions} /> }} />
      <SchemaField schema={schema} name="name" />
      <Space style={{ display: "flex" }} size="middle">
        <SchemaField
          schema={schema}
          name="email"
          config={{
            ...FLEX_ITEM,
            rules: [{ type: "email", message: i18n.t("contacts.emailInvalid", { defaultValue: "邮箱格式不正确" }) }],
          }}
        />
        <SchemaField schema={schema} name="phone" config={FLEX_ITEM} />
      </Space>
      <SchemaField schema={schema} name="website" />
      <Space style={{ display: "flex" }} size="middle">
        {/* tax_id is staff-hidden → absent from the schema for STAFF → SchemaField renders null. */}
        <SchemaField schema={schema} name="tax_id" config={FLEX_ITEM} />
        <SchemaField schema={schema} name="currency" config={{ ...FLEX_ITEM, ref: "currency" }} />
      </Space>
      <SchemaField schema={schema} name="payment_terms" config={{ inputProps: { min: 0, style: { width: "100%" } } }} />
      <SchemaField schema={schema} name="notes" config={{ control: <TextArea rows={3} /> }} />
    </>
  );
}
