import { useEffect, useState } from "react";
import { App, Button, Col, DatePicker, Drawer, Form, Input, Row, Tabs } from "antd";
import { applyFieldErrors, nestedListError } from "@/components/modules/settings/formErrors";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import SchemaField from "@/components/modules/base/SchemaField";
import ContactSelect from "@/components/modules/sales/shared/ContactSelect";
import LineItemsEditor from "@/components/modules/sales/shared/LineItemsEditor";
import TradeTermsFields from "@/components/modules/sales/shared/TradeTermsFields";
import DocumentAddressSection, {
  documentAddressBody,
  documentAddressSeed,
  useContactAddressPrefill,
} from "@/components/modules/sales/shared/DocumentAddressSection";
import { fromPicker, toPicker } from "@/components/modules/sales/shared/dates";
import { INVOICES_URL, useInvoiceViewSet, type InvoiceDetail } from "./shared";

type Props = {
  open: boolean;
  invoice: InvoiceDetail | null; // null = create
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Invoice create/edit drawer. Mirrors ContactFormDrawer: a single Form spread
 * across Tabs (basic / items / terms), with field schema (labels, required) from
 * DRF OPTIONS via useFieldMeta. Editing is only reachable while DRAFT (the parent
 * gates the edit button), and the backend rejects edits to locked statuses.
 */
export default function InvoiceFormDrawer({ open, invoice, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const vs = useInvoiceViewSet();
  const prefillAddresses = useContactAddressPrefill();
  // Edit reads the detail endpoint's OPTIONS (carries `PUT`), create reads the
  // collection's (`POST`) — without this an update-only profile gets an empty schema.
  const schema = useFieldMeta(invoice ? `${INVOICES_URL}${invoice.id}/` : INVOICES_URL);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basic");
  const isEdit = invoice != null;

  useEffect(() => {
    if (!open) return;
    setTab("basic");
    // resetFields first: the form store survives drawer close, so seeding alone
    // would merge stale nested item/terms values from a previous invoice.
    form.resetFields();
    form.setFieldsValue({
      // invoice_number / status are read-only (server-assigned).
      contact: invoice?.contact ?? undefined,
      date: toPicker(invoice?.date),
      due_date: toPicker(invoice?.due_date),
      reference: invoice?.reference ?? "",
      notes: invoice?.notes ?? "",
      terms: invoice?.terms ?? "",
      // Trade-terms block.
      currency: invoice?.currency ?? "CNY",
      payment_terms: invoice?.payment_terms ?? "",
      incoterms: invoice?.incoterms ?? undefined,
      incoterms_location: invoice?.incoterms_location ?? "",
      shipment_type: invoice?.shipment_type ?? undefined,
      port_of_loading: invoice?.port_of_loading ?? "",
      port_of_destination: invoice?.port_of_destination ?? "",
      items: invoice?.items ?? [],
      // Snapshots: seed from the invoice (edit); prefill from the customer only on
      // a user contact change (onValuesChange), never on this programmatic seed.
      ...documentAddressSeed(invoice),
    });
  }, [open, invoice, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    // Dates → "YYYY-MM-DD"; the backend DateFields reject dayjs objects.
    const body = {
      ...values,
      date: fromPicker(values.date as Parameters<typeof fromPicker>[0]),
      due_date: fromPicker(values.due_date as Parameters<typeof fromPicker>[0]),
      ...documentAddressBody(form),
    };
    setSaving(true);
    try {
      if (isEdit) await vs.update({ id: invoice.id, body });
      else await vs.create({ body });
      message.success(i18n.t("sales.saved", { defaultValue: "已保存" }));
      onSaved();
      onClose();
    } catch (err) {
      const handled = applyFieldErrors(form, err);
      // Nested items errors land on the Form.List (no visible error slot) —
      // toast the first message so a failed save is never silent.
      const itemsError = nestedListError(err);
      if (itemsError) {
        message.error(itemsError);
      } else if (!handled) {
        message.error(i18n.t("sales.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
      // Surface nested-tab validation errors by jumping back to the basic tab.
      setTab("basic");
    } finally {
      setSaving(false);
    }
  };

  const watchedCurrency = Form.useWatch("currency", form) as string | undefined;

  const basic = (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="contact"
          label={schema.label("contact", i18n.t("sales.customer", { defaultValue: "客户" }))}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <ContactSelect />
        </Form.Item>
      </Col>
      <Col span={12}>
        <SchemaField schema={schema} name="reference" />
      </Col>
      <Col span={12}>
        <Form.Item
          name="date"
          label={schema.label("date", i18n.t("sales.invoiceDate", { defaultValue: "开票日期" }))}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          name="due_date"
          label={schema.label("due_date", i18n.t("sales.dueDate", { defaultValue: "到期日" }))}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Col>
      <Col span={24}>
        <SchemaField schema={schema} name="terms" config={{ control: <Input.TextArea rows={2} /> }} />
      </Col>
      <Col span={24}>
        <SchemaField schema={schema} name="notes" config={{ control: <Input.TextArea rows={3} /> }} />
      </Col>
      <Col span={24}>
        <DocumentAddressSection schema={schema} />
      </Col>
    </Row>
  );

  const items = [
    {
      key: "basic",
      label: i18n.t("sales.tabBasic", { defaultValue: "基本信息" }),
      forceRender: true,
      children: basic,
    },
    {
      key: "items",
      label: i18n.t("sales.tabItems", { defaultValue: "行项目" }),
      forceRender: true,
      children: <LineItemsEditor currency={watchedCurrency} enabled={open} />,
    },
    {
      key: "terms",
      label: i18n.t("sales.tabTerms", { defaultValue: "贸易条款" }),
      forceRender: true,
      children: <TradeTermsFields schema={schema} />,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{
        wrapper: { width: "min(1120px, 100vw)" },
        body: { padding: "5px 32px 24px" },
        footer: { padding: "12px 24px" },
      }}
      title={
        isEdit
          ? i18n.t("sales.editInvoice", { defaultValue: "编辑发票" })
          : i18n.t("sales.newInvoice", { defaultValue: "新建发票" })
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
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={(changed) => {
          if ("contact" in changed) prefillAddresses(form, changed.contact as number | null);
        }}
      >
        <Tabs activeKey={tab} onChange={setTab} items={items} />
      </Form>
    </Drawer>
  );
}
