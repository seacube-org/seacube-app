import { useEffect, useState } from "react";
import { App, Button, Drawer, Form, Input, Select, Typography } from "antd";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import {
  CHOICE_TYPES,
  DATA_TYPES,
  dataTypeLabel,
  useProductAttributeViewSet,
  type ProductAttribute,
  type ProductAttributeDataType,
} from "./shared";

type FormValues = {
  name?: string;
  code?: string;
  data_type?: ProductAttributeDataType;
  choices?: string[];
  unit?: string;
};

/**
 * Create / edit a global product attribute (admin-only). `code` is the stable key
 * the weight engine / line-item spec reference, so it's set only on create (auto-
 * generated from name when blank) and read-only afterwards. For system attributes,
 * `data_type` is locked too — only name / choices / unit stay editable.
 */
export default function ProductAttributeDrawer({
  open,
  attribute,
  onClose,
  onSaved,
}: {
  open: boolean;
  attribute: ProductAttribute | null; // null = create
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const vs = useProductAttributeViewSet();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const isEdit = attribute != null;
  const isSystem = !!attribute?.is_system;
  const dataType = Form.useWatch("data_type", form);
  const showChoices = CHOICE_TYPES.has(dataType as ProductAttributeDataType);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      name: attribute?.name ?? "",
      code: attribute?.code ?? "",
      data_type: attribute?.data_type ?? "text",
      choices: attribute?.choices ?? [],
      unit: attribute?.unit ?? "",
    });
  }, [open, attribute, form]);

  const onFinish = async (values: FormValues) => {
    const dt = values.data_type as ProductAttributeDataType;
    const body: Record<string, unknown> = {
      name: values.name,
      data_type: dt,
      unit: values.unit ?? "",
      // choices only meaningful for choice types; null otherwise.
      choices: CHOICE_TYPES.has(dt) ? (values.choices ?? []) : null,
    };
    // code is immutable after creation; on create it's optional (auto from name).
    if (!isEdit && values.code) body.code = values.code;
    setSaving(true);
    try {
      if (isEdit) await vs.update({ id: attribute.id, body });
      else await vs.create({ body });
      message.success(i18n.t("productAttribute.saved", { defaultValue: "已保存" }));
      onSaved();
      onClose();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("productAttribute.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{ wrapper: { width: 460 } }}
      title={
        isEdit
          ? i18n.t("productAttribute.edit", { defaultValue: "编辑规格属性" })
          : i18n.t("productAttribute.new", { defaultValue: "新建规格属性" })
      }
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {i18n.t("common.save", { defaultValue: "保存" })}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label={i18n.t("productAttribute.name", { defaultValue: "名称" })}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <Input placeholder={i18n.t("productAttribute.namePlaceholder", { defaultValue: "例如：玻化率、规格" })} />
        </Form.Item>

        <Form.Item
          name="code"
          label={i18n.t("productAttribute.code", { defaultValue: "代码" })}
          extra={
            isEdit
              ? i18n.t("productAttribute.codeImmutable", { defaultValue: "代码创建后不可修改" })
              : i18n.t("productAttribute.codeHint", { defaultValue: "留空将根据名称自动生成" })
          }
        >
          <Input disabled={isEdit} placeholder="glazing" />
        </Form.Item>

        <Form.Item name="data_type" label={i18n.t("productAttribute.dataType", { defaultValue: "数据类型" })}>
          <Select disabled={isSystem} options={DATA_TYPES.map((t) => ({ value: t, label: dataTypeLabel(t) }))} />
        </Form.Item>
        {isSystem && (
          <Typography.Text
            type="secondary"
            style={{ display: "block", marginTop: -12, marginBottom: 12, fontSize: 12 }}
          >
            {i18n.t("productAttribute.systemLocked", {
              defaultValue: "系统属性：代码与数据类型不可更改，也不可删除",
            })}
          </Typography.Text>
        )}

        {showChoices && (
          <Form.Item
            name="choices"
            label={i18n.t("productAttribute.choices", { defaultValue: "可选项" })}
            extra={i18n.t("productAttribute.choicesHint", { defaultValue: "回车添加一项" })}
          >
            <Select
              mode="tags"
              tokenSeparators={[",", "，"]}
              open={false}
              placeholder={i18n.t("productAttribute.choicesPlaceholder", { defaultValue: "输入选项后回车" })}
            />
          </Form.Item>
        )}

        <Form.Item
          name="unit"
          label={i18n.t("productAttribute.unit", { defaultValue: "单位/提示" })}
          extra={i18n.t("productAttribute.unitHint", { defaultValue: "显示提示，如 % / kg / g" })}
        >
          <Input placeholder="%" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
