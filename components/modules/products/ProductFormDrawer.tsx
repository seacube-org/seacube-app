import { useEffect, useMemo, useState } from "react";
import { App, Button, Drawer, Form, Space, Tabs, Tag } from "antd";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import { PRODUCTS_URL, useProductViewSet, type ProductDetail } from "./shared";
import BasicTab from "./form/BasicTab";
import AttributesTab from "./form/AttributesTab";

type Props = {
  open: boolean;
  product: ProductDetail | null; // null = create
  onClose: () => void;
  /** Receives the saved record so callers can e.g. auto-select a quick-added product. */
  onSaved: (saved: ProductDetail) => void;
};

type FormValues = {
  name?: string;
  code?: string;
  category?: string;
  base_unit?: string;
  default_tax_rate?: number; // percent in the form (e.g. 13), stored as 0.13
  description?: string;
  description_template?: string;
  is_active?: boolean;
  attribute_assignments?: { id?: number; attribute_id?: number; is_required?: boolean }[];
};

/** Decimal tax fraction ("0.1300") → percent for the form (13). */
function fractionToPercent(raw: string | number | null | undefined): number {
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : Number((n * 100).toFixed(2));
}

/**
 * Product create/edit drawer — orchestrates the Form + Tabs (Basics + Attributes).
 * Field schema (controls, labels, required) comes from DRF OPTIONS via useFieldMeta;
 * the Attributes tab manages nested attribute_assignments (not schema-driven).
 */
export default function ProductFormDrawer({ open, product, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const vs = useProductViewSet();
  // Edit reads the detail endpoint's OPTIONS (carries PUT), create the collection's (POST).
  const schema = useFieldMeta(product ? `${PRODUCTS_URL}${product.id}/` : PRODUCTS_URL);
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basic");
  const isEdit = product != null;

  // Seed the Attributes tab with the product's already-assigned attributes so a
  // non-admin editor (who can't read the admin-only catalog) still sees their names.
  const seedAttributes = useMemo(() => (product?.attribute_assignments ?? []).map((a) => a.attribute), [product]);

  useEffect(() => {
    if (!open) return;
    setTab("basic");
    form.resetFields();
    form.setFieldsValue({
      name: product?.name ?? "",
      code: product?.code ?? "",
      category: product?.category ?? "",
      base_unit: product?.base_unit ?? "KGS",
      default_tax_rate: fractionToPercent(product?.default_tax_rate),
      description: product?.description ?? "",
      description_template: product?.description_template ?? "",
      is_active: product?.is_active ?? true,
      attribute_assignments: (product?.attribute_assignments ?? []).map((a) => ({
        id: a.id,
        attribute_id: a.attribute.id,
        is_required: a.is_required,
      })),
    });
  }, [open, product, form]);

  const onFinish = async (values: FormValues) => {
    const body: Record<string, unknown> = {
      name: values.name,
      code: values.code ?? "",
      category: values.category ?? "",
      base_unit: values.base_unit,
      // Form holds a percent; the backend stores a 0-1 decimal fraction.
      default_tax_rate: Number(((values.default_tax_rate ?? 0) / 100).toFixed(4)),
      description: values.description ?? "",
      description_template: values.description_template ?? "",
      is_active: values.is_active ?? true,
      // sort_order is derived from row order; drop rows without a chosen attribute.
      attribute_assignments: (values.attribute_assignments ?? [])
        .filter((r) => r.attribute_id != null)
        .map((r, i) => ({
          ...(r.id != null ? { id: r.id } : {}),
          attribute_id: r.attribute_id,
          is_required: !!r.is_required,
          sort_order: i,
        })),
    };
    setSaving(true);
    try {
      const saved = (isEdit ? await vs.update({ id: product.id, body }) : await vs.create({ body })) as ProductDetail;
      message.success(i18n.t("products.saved", { defaultValue: "已保存" }));
      onSaved(saved);
      onClose();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("products.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
    } finally {
      setSaving(false);
    }
  };

  // Jump to the tab that holds the first client-side validation error.
  const onFinishFailed = (e: { errorFields: { name: (string | number)[] }[] }) => {
    const path = e.errorFields[0]?.name ?? [];
    setTab(path[0] === "attribute_assignments" ? "attributes" : "basic");
  };

  const items = [
    {
      key: "basic",
      label: i18n.t("products.tabBasic", { defaultValue: "基本信息" }),
      forceRender: true,
      children: <BasicTab schema={schema} seedAttributes={seedAttributes} />,
    },
    {
      key: "attributes",
      label: i18n.t("products.tabAttributes", { defaultValue: "规格属性" }),
      forceRender: true,
      children: <AttributesTab enabled={open} seedAttributes={seedAttributes} />,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{
        wrapper: { width: "min(720px, 100vw)" },
        body: { padding: "5px 32px 24px" },
        footer: { padding: "12px 24px" },
      }}
      title={
        <Space>
          {isEdit
            ? i18n.t("products.edit", { defaultValue: "编辑产品" })
            : i18n.t("products.new", { defaultValue: "新建产品" })}
          {product && !product.is_active && (
            <Tag color="default">{i18n.t("products.inactive", { defaultValue: "已停用" })}</Tag>
          )}
        </Space>
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
      <Form form={form} layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed}>
        <Tabs activeKey={tab} onChange={setTab} items={items} />
      </Form>
    </Drawer>
  );
}
