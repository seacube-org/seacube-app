import { Input } from "antd";
import SchemaField from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import PhoneInput from "./PhoneInput";
import { FIELD_GRID_STYLE, FIELD_ITEM_STYLE, FULL_WIDTH_ITEM_STYLE } from "./layout";

const { TextArea } = Input;

/**
 * Top-level contact fields. Label + control + required/maxLength/visibility all
 * come from the backend OPTIONS schema (labels localized via Accept-Language).
 * `config` is only for overrides: `notes` custom control, `currency` ref source,
 * `email` format rule, and layout (Space rows / flex).
 *
 * `type` is intentionally absent: it's derived server-side from the contact's
 * documents (read_only in OPTIONS), shown as a tag in the drawer title.
 */
export default function BasicTab({ schema }: { schema: FieldSchema }) {
  return (
    <div style={FIELD_GRID_STYLE}>
      <SchemaField schema={schema} name="name" config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
      <SchemaField
        schema={schema}
        name="email"
        config={{
          itemProps: { style: FIELD_ITEM_STYLE },
          rules: [{ type: "email", message: i18n.t("contacts.emailInvalid", { defaultValue: "邮箱格式不正确" }) }],
        }}
      />
      <SchemaField
        schema={schema}
        name="phone"
        config={{
          itemProps: { style: FIELD_ITEM_STYLE },
          control: (meta) => <PhoneInput maxLength={meta?.max_length} />,
        }}
      />
      <SchemaField schema={schema} name="website" config={{ itemProps: { style: FULL_WIDTH_ITEM_STYLE } }} />
      {/* tax_id is staff-hidden → absent from the schema for STAFF → SchemaField renders null. */}
      <SchemaField schema={schema} name="tax_id" config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
      <SchemaField
        schema={schema}
        name="currency"
        config={{ ref: "currency", itemProps: { style: FIELD_ITEM_STYLE } }}
      />
      {/* Credit period (账期): configurable rule that drives invoice/bill due dates.
          Full-width on its own row — it would otherwise sit alone (currency pairs
          with tax_id, and payment_terms below is full-width). */}
      <SchemaField
        schema={schema}
        name="credit_period"
        config={{
          ref: "credit_period",
          // Optional FK — clearing it falls the contact back to the org default.
          inputProps: { allowClear: true },
          itemProps: { style: FULL_WIDTH_ITEM_STYLE },
        }}
      />
      {/* Payment terms: free-text commercial arrangement, e.g. "30% adv, 70% balance". */}
      <SchemaField
        schema={schema}
        name="payment_terms"
        config={{ control: <TextArea rows={2} />, itemProps: { style: FULL_WIDTH_ITEM_STYLE } }}
      />
      <SchemaField
        schema={schema}
        name="notes"
        config={{ control: <TextArea rows={4} />, itemProps: { style: FULL_WIDTH_ITEM_STYLE } }}
      />
    </div>
  );
}
