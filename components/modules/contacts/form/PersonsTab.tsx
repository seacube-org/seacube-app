import { Button, Form } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SchemaField from "@/components/modules/base/SchemaField";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import NestedItemCard from "./NestedItemCard";
import PhoneInput from "./PhoneInput";
import { useSingleDefault } from "./useSingleDefault";
import { FIELD_GRID_STYLE, FIELD_ITEM_STYLE } from "./layout";

/**
 * Contact persons (Form.List). Nested fields are schema-driven too:
 * `schema.nested("persons")` is the child serializer's schema; SchemaField looks
 * up metadata by leaf `name` while `namePath` ([index, leaf]) addresses the item.
 */
export default function PersonsTab({ schema }: { schema: FieldSchema }) {
  const s = schema.nested("persons");
  // Only one person can be the primary contact — keep the switch single-select.
  const keepSingleDefault = useSingleDefault("persons");
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
              <div style={FIELD_GRID_STYLE}>
                <SchemaField
                  schema={s}
                  name="name"
                  namePath={[name, "name"]}
                  config={{ itemProps: { style: FIELD_ITEM_STYLE } }}
                />
                <SchemaField
                  schema={s}
                  name="title"
                  namePath={[name, "title"]}
                  config={{ itemProps: { style: FIELD_ITEM_STYLE } }}
                />
                <SchemaField
                  schema={s}
                  name="email"
                  namePath={[name, "email"]}
                  config={{
                    itemProps: { style: FIELD_ITEM_STYLE },
                    rules: [
                      { type: "email", message: i18n.t("contacts.emailInvalid", { defaultValue: "邮箱格式不正确" }) },
                    ],
                  }}
                />
                <SchemaField
                  schema={s}
                  name="phone"
                  namePath={[name, "phone"]}
                  config={{
                    itemProps: { style: FIELD_ITEM_STYLE },
                    control: (meta) => <PhoneInput maxLength={meta?.max_length} />,
                  }}
                />
              </div>
              <SchemaField
                schema={s}
                name="is_primary"
                namePath={[name, "is_primary"]}
                config={{
                  inputProps: {
                    size: "small",
                    onChange: (checked: boolean) => checked && keepSingleDefault("is_primary", name),
                  },
                }}
              />
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
