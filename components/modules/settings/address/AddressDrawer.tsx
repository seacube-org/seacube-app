import { useEffect, useMemo, useState } from "react";
import { App, Button, Drawer, Form, Input, Select, Space } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { ADDRESS_TYPE_OPTIONS, addressTypeLabel, type Address } from "./shared";

/** Create / edit an org address-book entry. */
export default function AddressDrawer({
  open,
  address,
  onClose,
  onSaved,
}: {
  open: boolean;
  address: Address | null; // null = create
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const { getViewSet, endpoints } = useDataService();
  const addressVS = useMemo(() => getViewSet(endpoints.addresses), [getViewSet, endpoints]);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = address != null;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      label: address?.label ?? "",
      address_type: address?.address_type ?? "OTHER",
      attention: address?.attention ?? "",
      address_line1: address?.address_line1 ?? "",
      address_line2: address?.address_line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postal_code: address?.postal_code ?? "",
      country: address?.country ?? "China",
      phone: address?.phone ?? "",
      fax: address?.fax ?? "",
    });
  }, [open, address, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) await addressVS.update({ id: address.id, body: values });
      else await addressVS.create({ body: values });
      message.success(i18n.t("account.saved", { defaultValue: "已保存" }));
      onSaved();
      onClose();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("account.saveFailed", { defaultValue: "保存失败，请重试" }));
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
      styles={{ wrapper: { width: 480 } }}
      title={
        isEdit
          ? i18n.t("address.edit", { defaultValue: "编辑地址" })
          : i18n.t("address.new", { defaultValue: "新建地址" })
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
          name="label"
          label={i18n.t("address.label", { defaultValue: "名称" })}
          tooltip={i18n.t("address.labelHint", { defaultValue: "例如：总部、苏州仓库" })}
        >
          <Input placeholder={i18n.t("address.labelPlaceholder", { defaultValue: "例如：总部" })} />
        </Form.Item>
        <Form.Item name="address_type" label={i18n.t("address.type", { defaultValue: "类型" })}>
          <Select options={ADDRESS_TYPE_OPTIONS.map((o) => ({ value: o.value, label: addressTypeLabel(o.value) }))} />
        </Form.Item>
        <Form.Item name="attention" label={i18n.t("address.attention", { defaultValue: "收件人" })}>
          <Input />
        </Form.Item>
        <Form.Item name="address_line1" label={i18n.t("address.line1", { defaultValue: "地址行 1" })}>
          <Input />
        </Form.Item>
        <Form.Item name="address_line2" label={i18n.t("address.line2", { defaultValue: "地址行 2" })}>
          <Input />
        </Form.Item>
        <Space style={{ display: "flex" }} size="middle">
          <Form.Item name="city" label={i18n.t("address.city", { defaultValue: "城市" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="state" label={i18n.t("address.state", { defaultValue: "省/州" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>
        <Space style={{ display: "flex" }} size="middle">
          <Form.Item name="postal_code" label={i18n.t("address.postalCode", { defaultValue: "邮编" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="country" label={i18n.t("address.country", { defaultValue: "国家" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>
        <Space style={{ display: "flex" }} size="middle">
          <Form.Item name="phone" label={i18n.t("address.phone", { defaultValue: "电话" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="fax" label={i18n.t("address.fax", { defaultValue: "传真" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  );
}
