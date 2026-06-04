import { useEffect, useState } from "react";
import {
  App, Button, Drawer, Form, Input, InputNumber, Segmented, Select, Space, Switch, Tabs, Typography,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { CURRENCY_OPTIONS } from "@/components/modules/layout/constants";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import i18n from "@/locale/i18n";
import {
  TYPE_OPTIONS, typeLabel, useContactViewSet, type ContactDetail,
} from "./shared";

const { TextArea } = Input;

/** Billing / shipping address sub-fields, nested under `prefix` (a JSONField on the backend). */
function AddressFields({ prefix }: { prefix: "billing_address" | "shipping_address" }) {
  return (
    <>
      <Form.Item name={[prefix, "attention"]} label={i18n.t("contacts.attention", { defaultValue: "收件人" })}>
        <Input />
      </Form.Item>
      <Form.Item name={[prefix, "address_line1"]} label={i18n.t("contacts.line1", { defaultValue: "地址行 1" })}>
        <Input />
      </Form.Item>
      <Form.Item name={[prefix, "address_line2"]} label={i18n.t("contacts.line2", { defaultValue: "地址行 2" })}>
        <Input />
      </Form.Item>
      <Space style={{ display: "flex" }} size="middle">
        <Form.Item name={[prefix, "city"]} label={i18n.t("contacts.city", { defaultValue: "城市" })} style={{ flex: 1 }}>
          <Input />
        </Form.Item>
        <Form.Item name={[prefix, "state"]} label={i18n.t("contacts.state", { defaultValue: "省/州" })} style={{ flex: 1 }}>
          <Input />
        </Form.Item>
      </Space>
      <Space style={{ display: "flex" }} size="middle">
        <Form.Item name={[prefix, "postal_code"]} label={i18n.t("contacts.postalCode", { defaultValue: "邮编" })} style={{ flex: 1 }}>
          <Input />
        </Form.Item>
        <Form.Item name={[prefix, "country"]} label={i18n.t("contacts.country", { defaultValue: "国家" })} style={{ flex: 1 }}>
          <Input />
        </Form.Item>
      </Space>
      <Form.Item name={[prefix, "phone"]} label={i18n.t("contacts.phone", { defaultValue: "电话" })}>
        <Input />
      </Form.Item>
    </>
  );
}

function PersonsTab() {
  return (
    <Form.List name="persons">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <div key={key} style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Typography.Text type="secondary">{i18n.t("contacts.person", { defaultValue: "联系人" })} #{name + 1}</Typography.Text>
                <Button type="text" size="small" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
              </div>
              <Space style={{ display: "flex" }} size="middle">
                <Form.Item
                  name={[name, "name"]}
                  label={i18n.t("contacts.personName", { defaultValue: "姓名" })}
                  rules={[{ required: true, message: i18n.t("contacts.required", { defaultValue: "必填" }) }]}
                  style={{ flex: 1 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item name={[name, "title"]} label={i18n.t("contacts.personTitle", { defaultValue: "职位" })} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
              </Space>
              <Space style={{ display: "flex" }} size="middle">
                <Form.Item name={[name, "email"]} label={i18n.t("contacts.email", { defaultValue: "邮箱" })}
                  rules={[{ type: "email", message: i18n.t("contacts.emailInvalid", { defaultValue: "邮箱格式不正确" }) }]} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
                <Form.Item name={[name, "phone"]} label={i18n.t("contacts.phone", { defaultValue: "电话" })} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
              </Space>
              <Form.Item name={[name, "is_primary"]} label={i18n.t("contacts.primaryPerson", { defaultValue: "主要联系人" })} valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </div>
          ))}
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ is_primary: false })}>
            {i18n.t("contacts.addPerson", { defaultValue: "添加联系人" })}
          </Button>
        </>
      )}
    </Form.List>
  );
}

function BankAccountsTab() {
  return (
    <Form.List name="bank_accounts">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <div key={key} style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Typography.Text type="secondary">{i18n.t("contacts.bankAccount", { defaultValue: "银行账户" })} #{name + 1}</Typography.Text>
                <Button type="text" size="small" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
              </div>
              <Space style={{ display: "flex" }} size="middle">
                <Form.Item
                  name={[name, "bank_name"]}
                  label={i18n.t("contacts.bankName", { defaultValue: "银行名称" })}
                  rules={[{ required: true, message: i18n.t("contacts.required", { defaultValue: "必填" }) }]}
                  style={{ flex: 1 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name={[name, "account_name"]}
                  label={i18n.t("contacts.accountName", { defaultValue: "账户名" })}
                  rules={[{ required: true, message: i18n.t("contacts.required", { defaultValue: "必填" }) }]}
                  style={{ flex: 1 }}
                >
                  <Input />
                </Form.Item>
              </Space>
              <Space style={{ display: "flex" }} size="middle">
                <Form.Item
                  name={[name, "account_number"]}
                  label={i18n.t("contacts.accountNumber", { defaultValue: "账号" })}
                  rules={[{ required: true, message: i18n.t("contacts.required", { defaultValue: "必填" }) }]}
                  style={{ flex: 1 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item name={[name, "currency"]} label={i18n.t("contacts.currency", { defaultValue: "币种" })} style={{ flex: 1 }}>
                  <Select options={CURRENCY_OPTIONS} showSearch optionFilterProp="label" />
                </Form.Item>
              </Space>
              <Space style={{ display: "flex" }} size="middle">
                <Form.Item name={[name, "routing_number"]} label={i18n.t("contacts.routingNumber", { defaultValue: "行号" })} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
                <Form.Item name={[name, "swift_code"]} label={i18n.t("contacts.swiftCode", { defaultValue: "SWIFT" })} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
              </Space>
              <Form.Item name={[name, "bank_address"]} label={i18n.t("contacts.bankAddress", { defaultValue: "开户行地址" })}>
                <TextArea rows={2} />
              </Form.Item>
              <Form.Item name={[name, "is_default"]} label={i18n.t("contacts.defaultBank", { defaultValue: "默认账户" })} valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </div>
          ))}
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ currency: "CNY", is_default: false })}>
            {i18n.t("contacts.addBank", { defaultValue: "添加银行账户" })}
          </Button>
        </>
      )}
    </Form.List>
  );
}

type Props = {
  open: boolean;
  contact: ContactDetail | null; // null = create
  onClose: () => void;
  onSaved: () => void;
};

export default function ContactFormDrawer({ open, contact, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const vs = useContactViewSet();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basic");
  const isEdit = contact != null;

  useEffect(() => {
    if (!open) return;
    setTab("basic");
    // resetFields first: the form store survives drawer close, so seeding alone
    // would merge stale nested address/list values from a previous contact.
    form.resetFields();
    form.setFieldsValue({
      type: contact?.type ?? "CUSTOMER",
      name: contact?.name ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      website: contact?.website ?? "",
      currency: contact?.currency ?? "CNY",
      notes: contact?.notes ?? "",
      billing_address: contact?.billing_address ?? {},
      shipping_address: contact?.shipping_address ?? {},
      persons: contact?.persons ?? [],
      bank_accounts: contact?.bank_accounts ?? [],
      // tax_id / payment_terms are hidden from STAFF by the backend — only seed
      // them when actually present so we don't echo back blocked fields.
      ...(contact?.tax_id !== undefined ? { tax_id: contact.tax_id } : {}),
      ...(contact?.payment_terms !== undefined ? { payment_terms: contact.payment_terms } : {}),
    });
  }, [open, contact, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    // Drop staff-restricted fields when blank/untouched so a STAFF user editing
    // only the name/phone isn't rejected for sending tax_id / payment_terms.
    const body = { ...values };
    if (body.tax_id === "" || body.tax_id == null) delete body.tax_id;
    if (body.payment_terms == null) delete body.payment_terms;
    setSaving(true);
    try {
      if (isEdit) await vs.update({ id: contact.id, body });
      else await vs.create({ body });
      message.success(i18n.t("contacts.saved", { defaultValue: "已保存" }));
      onSaved();
      onClose();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("contacts.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
      // Surface nested-tab validation errors by jumping back to the basic tab.
      setTab("basic");
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      key: "basic",
      label: i18n.t("contacts.tabBasic", { defaultValue: "基本信息" }),
      forceRender: true,
      children: (
        <>
          <Form.Item name="type" label={i18n.t("contacts.type", { defaultValue: "类型" })}>
            <Segmented options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: typeLabel(o.value) }))} />
          </Form.Item>
          <Form.Item
            name="name"
            label={i18n.t("contacts.name", { defaultValue: "名称" })}
            rules={[{ required: true, message: i18n.t("contacts.required", { defaultValue: "必填" }) }]}
          >
            <Input />
          </Form.Item>
          <Space style={{ display: "flex" }} size="middle">
            <Form.Item name="email" label={i18n.t("contacts.email", { defaultValue: "邮箱" })}
              rules={[{ type: "email", message: i18n.t("contacts.emailInvalid", { defaultValue: "邮箱格式不正确" }) }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label={i18n.t("contacts.phone", { defaultValue: "电话" })} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="website" label={i18n.t("contacts.website", { defaultValue: "网站" })}>
            <Input />
          </Form.Item>
          <Space style={{ display: "flex" }} size="middle">
            <Form.Item name="tax_id" label={i18n.t("contacts.taxId", { defaultValue: "税号" })} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="currency" label={i18n.t("contacts.currency", { defaultValue: "币种" })} style={{ flex: 1 }}>
              <Select options={CURRENCY_OPTIONS} showSearch optionFilterProp="label" />
            </Form.Item>
          </Space>
          <Form.Item name="payment_terms" label={i18n.t("contacts.paymentTerms", { defaultValue: "付款账期（天）" })}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="notes" label={i18n.t("contacts.notes", { defaultValue: "备注" })}>
            <TextArea rows={3} />
          </Form.Item>
        </>
      ),
    },
    {
      key: "address",
      label: i18n.t("contacts.tabAddress", { defaultValue: "地址" }),
      forceRender: true,
      children: (
        <>
          <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
            {i18n.t("contacts.billingAddress", { defaultValue: "账单地址" })}
          </Typography.Text>
          <AddressFields prefix="billing_address" />
          <Typography.Text strong style={{ display: "block", margin: "20px 0 12px" }}>
            {i18n.t("contacts.shippingAddress", { defaultValue: "收货地址" })}
          </Typography.Text>
          <Button
            size="small"
            style={{ marginBottom: 12 }}
            onClick={() => form.setFieldValue("shipping_address", form.getFieldValue("billing_address") ?? {})}
          >
            {i18n.t("contacts.copyBilling", { defaultValue: "与账单地址相同" })}
          </Button>
          <AddressFields prefix="shipping_address" />
        </>
      ),
    },
    {
      key: "persons",
      label: i18n.t("contacts.tabPersons", { defaultValue: "联系人" }),
      forceRender: true,
      children: <PersonsTab />,
    },
    {
      key: "banks",
      label: i18n.t("contacts.tabBanks", { defaultValue: "银行账户" }),
      forceRender: true,
      children: <BankAccountsTab />,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{ wrapper: { width: 600 } }}
      title={isEdit
        ? i18n.t("contacts.edit", { defaultValue: "编辑联系人" })
        : i18n.t("contacts.new", { defaultValue: "新建联系人" })}
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
        <Tabs activeKey={tab} onChange={setTab} items={items} />
      </Form>
    </Drawer>
  );
}
