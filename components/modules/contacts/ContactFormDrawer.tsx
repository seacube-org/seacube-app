import { useEffect, useState } from "react";
import { App, Button, Drawer, Form, Tabs } from "antd";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import { CONTACTS_URL, useContactViewSet, type ContactDetail } from "./shared";
import BasicTab from "./form/BasicTab";
import AddressTab from "./form/AddressTab";
import PersonsTab from "./form/PersonsTab";
import BankAccountsTab from "./form/BankAccountsTab";

type Props = {
  open: boolean;
  contact: ContactDetail | null; // null = create
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Contact create/edit drawer — orchestrates the Form + Tabs; each tab is its own
 * module under ./form. Field schema (controls, labels, required/visibility) comes
 * from DRF OPTIONS via useFieldMeta. See docs/schema-driven-forms.md (L2).
 */
export default function ContactFormDrawer({ open, contact, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const vs = useContactViewSet();
  // Edit reads the detail endpoint's OPTIONS (carries `PUT`), create reads the
  // collection's (`POST`). Without this, a profile with `update` but not `create`
  // gets an empty schema (collection OPTIONS omits POST) and no fields render.
  const schema = useFieldMeta(contact ? `${CONTACTS_URL}${contact.id}/` : CONTACTS_URL);
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
    { key: "basic", label: i18n.t("contacts.tabBasic", { defaultValue: "基本信息" }), forceRender: true, children: <BasicTab schema={schema} /> },
    { key: "address", label: i18n.t("contacts.tabAddress", { defaultValue: "地址" }), forceRender: true, children: <AddressTab schema={schema} form={form} /> },
    { key: "persons", label: i18n.t("contacts.tabPersons", { defaultValue: "联系人" }), forceRender: true, children: <PersonsTab schema={schema} /> },
    { key: "banks", label: i18n.t("contacts.tabBanks", { defaultValue: "银行账户" }), forceRender: true, children: <BankAccountsTab schema={schema} /> },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{ wrapper: { width: 600 } }}
      title={isEdit ? i18n.t("contacts.edit", { defaultValue: "编辑联系人" }) : i18n.t("contacts.new", { defaultValue: "新建联系人" })}
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
