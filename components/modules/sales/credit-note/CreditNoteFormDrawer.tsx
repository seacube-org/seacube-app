import { useEffect, useState } from "react";
import { App, Button, DatePicker, Drawer, Form, Input, InputNumber } from "antd";
import dayjs from "dayjs";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import ContactSelect from "@/components/modules/sales/shared/ContactSelect";
import { fromPicker, toPicker } from "@/components/modules/sales/shared/dates";
import i18n from "@/locale/i18n";
import { useCreditNoteViewSet, type CreditNoteDetail } from "./shared";
import InvoiceSelect from "./InvoiceSelect";

type Props = {
  open: boolean;
  creditNote: CreditNoteDetail | null; // null = create
  onClose: () => void;
  onSaved: () => void;
};

// Form value shape (dates are dayjs while in the picker).
type FormValues = {
  contact?: number | null;
  invoice?: number | null;
  date?: dayjs.Dayjs | null;
  amount?: number | null;
  reason?: string;
  notes?: string;
};

/**
 * Credit-note create/edit drawer — a simple record (no line items, no trade
 * terms). credit_number/status are read-only server-side; only the commercial
 * fields are editable, and only while the note is DRAFT. Mirrors
 * ContactFormDrawer's schema/error-handling flow.
 */
export default function CreditNoteFormDrawer({ open, creditNote, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const vs = useCreditNoteViewSet();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const isEdit = creditNote != null;

  useEffect(() => {
    if (!open) return;
    // resetFields first: the form store survives drawer close, so seeding alone
    // would merge stale values from a previously-opened credit note.
    form.resetFields();
    form.setFieldsValue({
      contact: creditNote?.contact ?? null,
      invoice: creditNote?.invoice ?? null,
      date: toPicker(creditNote?.date) ?? dayjs(),
      amount: creditNote?.amount != null ? Number(creditNote.amount) : null,
      reason: creditNote?.reason ?? "",
      notes: creditNote?.notes ?? "",
    });
  }, [open, creditNote, form]);

  const onFinish = async (values: FormValues) => {
    const body = {
      contact: values.contact,
      invoice: values.invoice ?? null,
      date: fromPicker(values.date),
      amount: values.amount,
      reason: values.reason ?? "",
      notes: values.notes ?? "",
    };
    setSaving(true);
    try {
      if (isEdit) await vs.update({ id: creditNote.id, body });
      else await vs.create({ body });
      message.success(i18n.t("sales.saved", { defaultValue: "已保存" }));
      onSaved();
      onClose();
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("sales.saveFailed", { defaultValue: "保存失败，请重试" }));
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
      styles={{
        wrapper: { width: "min(560px, 100vw)" },
        body: { padding: "5px 32px 24px" },
        footer: { padding: "12px 24px" },
      }}
      title={
        isEdit
          ? i18n.t("sales.editCreditNote", { defaultValue: "编辑贷项通知单" })
          : i18n.t("sales.newCreditNote", { defaultValue: "新建贷项通知单" })
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
          name="contact"
          label={i18n.t("sales.customer", { defaultValue: "客户" })}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <ContactSelect />
        </Form.Item>

        <Form.Item name="invoice" label={i18n.t("sales.linkedInvoice", { defaultValue: "关联发票" })}>
          <InvoiceSelect />
        </Form.Item>

        <Form.Item
          name="date"
          label={i18n.t("sales.date", { defaultValue: "日期" })}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="amount"
          label={i18n.t("sales.amount", { defaultValue: "金额" })}
          rules={[
            { required: true, message: i18n.t("common.required", { defaultValue: "必填" }) },
            {
              type: "number",
              min: 0.01,
              message: i18n.t("sales.amountPositive", { defaultValue: "金额必须大于 0" }),
            },
          ]}
        >
          <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} />
        </Form.Item>

        <Form.Item name="reason" label={i18n.t("sales.reason", { defaultValue: "原因" })}>
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item name="notes" label={i18n.t("sales.notes", { defaultValue: "备注" })}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
