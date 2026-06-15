import { Button, Form } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SchemaField from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import NestedItemCard from "./NestedItemCard";
import AddressFields from "./AddressFields";
import { useSingleDefault } from "./useSingleDefault";
import { FIELD_GRID_STYLE, FIELD_ITEM_STYLE, FULL_WIDTH_ITEM_STYLE } from "./layout";

/**
 * The contact's address book (Form.List). Each row is a labelled address with
 * "default billing" / "default shipping" switches; those defaults prefill new
 * sales documents. Schema-driven via `schema.nested("addresses")` (same pattern
 * as PersonsTab). The backend enforces one default of each kind per contact.
 */
export default function AddressTab({ schema }: { schema: FieldSchema }) {
  const s = schema.nested("addresses");
  // Default billing / shipping is unique per contact — keep the switches single-select.
  const keepSingleDefault = useSingleDefault("addresses");

  return (
    <Form.List name="addresses">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <NestedItemCard
              key={key}
              title={`${i18n.t("contacts.address", { defaultValue: "地址" })} #${name + 1}`}
              onRemove={() => remove(name)}
            >
              <SchemaField
                schema={s}
                name="label"
                namePath={[name, "label"]}
                config={{
                  label: i18n.t("contacts.addressLabel", { defaultValue: "标签" }),
                  itemProps: { style: FULL_WIDTH_ITEM_STYLE },
                  inputProps: { placeholder: i18n.t("contacts.addressLabelHint", { defaultValue: "如:上海仓 / 总部" }) },
                }}
              />
              <AddressFields schema={s} namePrefix={[name]} />
              <div style={{ ...FIELD_GRID_STYLE, marginTop: 4 }}>
                <SchemaField
                  schema={s}
                  name="is_default_billing"
                  namePath={[name, "is_default_billing"]}
                  config={{
                    inputProps: {
                      size: "small",
                      onChange: (checked: boolean) => checked && keepSingleDefault("is_default_billing", name),
                    },
                    itemProps: { style: FIELD_ITEM_STYLE },
                  }}
                />
                <SchemaField
                  schema={s}
                  name="is_default_shipping"
                  namePath={[name, "is_default_shipping"]}
                  config={{
                    inputProps: {
                      size: "small",
                      onChange: (checked: boolean) => checked && keepSingleDefault("is_default_shipping", name),
                    },
                    itemProps: { style: FIELD_ITEM_STYLE },
                  }}
                />
              </div>
            </NestedItemCard>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => add({ is_default_billing: fields.length === 0, is_default_shipping: fields.length === 0, sort_order: fields.length })}
          >
            {i18n.t("contacts.addAddress", { defaultValue: "添加地址" })}
          </Button>
        </>
      )}
    </Form.List>
  );
}
