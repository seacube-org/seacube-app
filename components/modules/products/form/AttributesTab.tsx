import { useMemo } from "react";
import { Button, Empty, Form, Input, Select, Spin, Switch, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import NestedItemCard from "@/components/modules/contacts/form/NestedItemCard";
import { attributeTypeLabel, useProductAttributes, type ProductAttribute } from "../shared";

type RowValue = { id?: number; attribute_id?: number; is_required?: boolean };

/**
 * Product ↔ attribute assignments (Form.List on `attribute_assignments`). The
 * picker is the org's global ProductAttribute catalog (admin-managed); each row
 * binds one attribute plus a per-product "required" flag. `sort_order` is derived
 * from row order by the drawer on submit, so it isn't edited here. Duplicate
 * attributes are filtered out (the backend enforces unique product+attribute).
 *
 * `enabled` defers the catalog fetch until the drawer is actually open.
 */
/**
 * `seedAttributes` are the attributes already assigned to the product (carried
 * from the detail response). They're merged into the catalog so a non-admin
 * editor — who can't read the admin-only catalog endpoint — still sees the names
 * of attributes already on the product instead of raw numeric ids.
 */
export default function AttributesTab({
  enabled,
  seedAttributes = [],
}: {
  enabled: boolean;
  seedAttributes?: ProductAttribute[];
}) {
  const form = Form.useFormInstance();
  const { attributes, loading } = useProductAttributes(enabled);
  const watchedRaw = Form.useWatch("attribute_assignments", form) as RowValue[] | undefined;
  const watched = useMemo(() => watchedRaw ?? [], [watchedRaw]);

  // Catalog first, then seeded assignments fill any gaps the catalog is missing
  // (e.g. when the catalog is empty for a non-admin editor).
  const merged = useMemo(() => {
    const map = new Map<number, ProductAttribute>();
    for (const a of seedAttributes) map.set(a.id, a);
    for (const a of attributes) map.set(a.id, a);
    return [...map.values()];
  }, [attributes, seedAttributes]);

  const byId = useMemo(() => new Map(merged.map((a) => [a.id, a])), [merged]);
  // Map the catalog into Select options once; rows then just filter this stable
  // list (keeps option object identities stable across renders).
  const allOptions = useMemo(() => merged.map((a) => ({ value: a.id, label: a.name, attr: a })), [merged]);
  const chosenIds = useMemo(
    () => new Set(watched.map((r) => r?.attribute_id).filter((v): v is number => v != null)),
    [watched],
  );

  const optionsFor = (currentId?: number) => allOptions.filter((o) => o.value === currentId || !chosenIds.has(o.value));

  if (loading) return <Spin style={{ display: "block", margin: "32px auto" }} />;

  const allAssigned = merged.length > 0 && chosenIds.size >= merged.length;

  return (
    <Form.List name="attribute_assignments">
      {(fields, { add, remove, move }) => (
        <>
          {fields.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                attributes.length === 0
                  ? i18n.t("products.noGlobalAttributes", {
                      defaultValue: "暂无可用的全局属性（需管理员先定义）",
                    })
                  : i18n.t("products.noAttributesAssigned", { defaultValue: "尚未绑定任何规格属性" })
              }
              style={{ margin: "20px 0" }}
            />
          )}

          {fields.map(({ key, name }, idx) => {
            const row = watched[name] ?? {};
            const attr: ProductAttribute | undefined =
              row.attribute_id != null ? byId.get(row.attribute_id) : undefined;
            return (
              <NestedItemCard
                key={key}
                title={`${i18n.t("products.attribute", { defaultValue: "规格属性" })} #${idx + 1}`}
                onRemove={() => remove(name)}
                // Reorder rows; sort_order is recomputed from row order on save.
                onMoveUp={idx > 0 ? () => move(name, name - 1) : undefined}
                onMoveDown={idx < fields.length - 1 ? () => move(name, name + 1) : undefined}
              >
                {/* Existing assignment id — hidden but registered so it travels with
                    the row on reorder; without it, move() drops the id and the row
                    is saved as a new assignment (duplicate product+attribute). */}
                <Form.Item name={[name, "id"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item
                  name={[name, "attribute_id"]}
                  label={i18n.t("products.attribute", { defaultValue: "规格属性" })}
                  rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
                  style={{ marginBottom: 12 }}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder={i18n.t("products.selectAttribute", { defaultValue: "选择属性" })}
                    options={optionsFor(row.attribute_id)}
                    optionRender={(opt) => {
                      const a = (opt.data as { attr: ProductAttribute }).attr;
                      return (
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{a.name}</span>
                          <Tag style={{ fontSize: 11 }}>{attributeTypeLabel(a.data_type)}</Tag>
                          {a.unit ? (
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {a.unit}
                            </Typography.Text>
                          ) : null}
                        </span>
                      );
                    }}
                  />
                </Form.Item>

                {attr ? (
                  <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 10 }}>
                    {i18n.t("products.attributeCode", { defaultValue: "代码" })}: {attr.code}
                    {attr.choices?.length
                      ? ` · ${i18n.t("products.choiceCount", { defaultValue: "{{n}} 个选项", n: attr.choices.length })}`
                      : ""}
                  </Typography.Text>
                ) : null}

                <Form.Item
                  name={[name, "is_required"]}
                  label={i18n.t("products.requiredOnEntry", { defaultValue: "录单必填" })}
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Switch size="small" />
                </Form.Item>
              </NestedItemCard>
            );
          })}

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            disabled={attributes.length === 0 || allAssigned}
            onClick={() => add({ is_required: false })}
          >
            {i18n.t("products.addAttribute", { defaultValue: "添加规格属性" })}
          </Button>
        </>
      )}
    </Form.List>
  );
}
