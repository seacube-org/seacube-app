import { Button, Form, Input, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SchemaField, { FLEX_ITEM } from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import NestedItemCard from "./NestedItemCard";

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
              <Space style={{ display: "flex" }} size="middle">
                <SchemaField schema={s} name="bank_name" namePath={[name, "bank_name"]} config={FLEX_ITEM} />
                <SchemaField schema={s} name="account_name" namePath={[name, "account_name"]} config={FLEX_ITEM} />
              </Space>
              <Space style={{ display: "flex" }} size="middle">
                <SchemaField schema={s} name="account_number" namePath={[name, "account_number"]} config={FLEX_ITEM} />
                <SchemaField schema={s} name="currency" namePath={[name, "currency"]} config={{ ...FLEX_ITEM, ref: "currency" }} />
              </Space>
              <Space style={{ display: "flex" }} size="middle">
                <SchemaField schema={s} name="routing_number" namePath={[name, "routing_number"]} config={FLEX_ITEM} />
                <SchemaField schema={s} name="swift_code" namePath={[name, "swift_code"]} config={FLEX_ITEM} />
              </Space>
              <SchemaField schema={s} name="bank_address" namePath={[name, "bank_address"]} config={{ control: <TextArea rows={2} /> }} />
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
