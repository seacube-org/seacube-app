import { Button, Form, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SchemaField, { FLEX_ITEM } from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import NestedItemCard from "./NestedItemCard";

/**
 * Contact persons (Form.List). Nested fields are schema-driven too:
 * `schema.nested("persons")` is the child serializer's schema; SchemaField looks
 * up metadata by leaf `name` while `namePath` ([index, leaf]) addresses the item.
 */
export default function PersonsTab({ schema }: { schema: FieldSchema }) {
  const s = schema.nested("persons");
  return (
    <Form.List name="persons">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <NestedItemCard
              key={key}
              title={`${i18n.t("contacts.person", { defaultValue: "联系人" })} #${name + 1}`}
              onRemove={() => remove(name)}
            >
              <Space style={{ display: "flex" }} size="middle">
                <SchemaField schema={s} name="name" namePath={[name, "name"]} config={FLEX_ITEM} />
                <SchemaField schema={s} name="title" namePath={[name, "title"]} config={FLEX_ITEM} />
              </Space>
              <Space style={{ display: "flex" }} size="middle">
                <SchemaField
                  schema={s}
                  name="email"
                  namePath={[name, "email"]}
                  config={{
                    ...FLEX_ITEM,
                    rules: [{ type: "email", message: i18n.t("contacts.emailInvalid", { defaultValue: "邮箱格式不正确" }) }],
                  }}
                />
                <SchemaField schema={s} name="phone" namePath={[name, "phone"]} config={FLEX_ITEM} />
              </Space>
              <SchemaField schema={s} name="is_primary" namePath={[name, "is_primary"]} config={{ inputProps: { size: "small" } }} />
            </NestedItemCard>
          ))}
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ is_primary: false })}>
            {i18n.t("contacts.addPerson", { defaultValue: "添加联系人" })}
          </Button>
        </>
      )}
    </Form.List>
  );
}
