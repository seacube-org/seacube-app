import { Button, Form, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SchemaField from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import NestedItemCard from "./NestedItemCard";
import { FIELD_GRID_STYLE, FIELD_ITEM_STYLE, FULL_WIDTH_ITEM_STYLE } from "./layout";

const { TextArea } = Input;

/** Bank accounts (Form.List). Same nested-schema pattern as PersonsTab. */
export default function BankAccountsTab({ schema }: { schema: FieldSchema }) {
  const s = schema.nested("bank_accounts");
  return (
    <Form.List name="bank_accounts">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <NestedItemCard
              key={key}
              title={`${i18n.t("contacts.bankAccount", { defaultValue: "银行账户" })} #${name + 1}`}
              onRemove={() => remove(name)}
            >
              <div style={FIELD_GRID_STYLE}>
                <SchemaField schema={s} name="bank_name" namePath={[name, "bank_name"]} config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
                <SchemaField schema={s} name="account_name" namePath={[name, "account_name"]} config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
                <SchemaField
                  schema={s}
                  name="account_number"
                  namePath={[name, "account_number"]}
                  config={{ itemProps: { style: FIELD_ITEM_STYLE } }}
                />
                <SchemaField
                  schema={s}
                  name="currency"
                  namePath={[name, "currency"]}
                  config={{ ref: "currency", itemProps: { style: FIELD_ITEM_STYLE } }}
                />
                <SchemaField
                  schema={s}
                  name="routing_number"
                  namePath={[name, "routing_number"]}
                  config={{ itemProps: { style: FIELD_ITEM_STYLE } }}
                />
                <SchemaField schema={s} name="swift_code" namePath={[name, "swift_code"]} config={{ itemProps: { style: FIELD_ITEM_STYLE } }} />
                <SchemaField
                  schema={s}
                  name="bank_address"
                  namePath={[name, "bank_address"]}
                  config={{ control: <TextArea rows={2} />, itemProps: { style: FULL_WIDTH_ITEM_STYLE } }}
                />
              </div>
              <SchemaField schema={s} name="is_default" namePath={[name, "is_default"]} config={{ inputProps: { size: "small" } }} />
            </NestedItemCard>
          ))}
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ currency: "CNY", is_default: false })}>
            {i18n.t("contacts.addBank", { defaultValue: "添加银行账户" })}
          </Button>
        </>
      )}
    </Form.List>
  );
}
