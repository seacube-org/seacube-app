import { useEffect, useState } from "react";
import { App, Button, Drawer, Form, Input } from "antd";
import dayjs from "dayjs";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import SchemaField from "@/components/modules/base/SchemaField";
import ContactSelect from "@/components/modules/sales/shared/ContactSelect";
import { fromPicker } from "@/components/modules/sales/shared/dates";
import i18n from "@/locale/i18n";
import { PAYMENT_METHOD_OPTIONS, PAYMENTS_URL, usePaymentViewSet } from "./shared";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Payment-received create drawer — CREATE-ONLY (the viewset allows GET/POST only;
 * payments are immutable after posting). Field schema (labels/required) comes from
 * DRF OPTIONS via useFieldMeta; mirrors ContactFormDrawer minus the edit branch.
 */
export default function PaymentFormDrawer({ open, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const vs = usePaymentViewSet();
  // Create-only: read the collection OPTIONS (carries `POST`).
  const schema = useFieldMeta(PAYMENTS_URL);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // resetFields first: the form store survives drawer close, so seeding alone
    // would merge stale values from a previous create.
    form.resetFields();
    form.setFieldsValue({
      contact: null,
      date: dayjs(), // default today
      amount: undefined,
      bank_charge: 0,
      payment_method: "BANK_TRANSFER",
      reference: "",
      notes: "",
    });
  }, [open, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    const body = {
      contact: values.contact,
      date: fromPicker(values.date as Parameters<typeof fromPicker>[0]),
      amount: values.amount,
      bank_charge: values.bank_charge ?? 0,
      payment_method: values.payment_method,
      reference: values.reference,
      notes: values.notes,
    };
    setSaving(true);
    try {
      await vs.create({ body });
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
      title={i18n.t("sales.newPayment", { defaultValue: "新建收款" })}
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
        <SchemaField
          schema={schema}
          name="contact"
          config={{
            label: i18n.t("sales.customer", { defaultValue: "客户" }),
            required: true,
            control: <ContactSelect />,
          }}
        />
        <SchemaField
          schema={schema}
          name="date"
          config={{ label: i18n.t("sales.paymentDate", { defaultValue: "收款日期" }), required: true }}
        />
        <SchemaField
          schema={schema}
          name="amount"
          config={{
            label: i18n.t("sales.amount", { defaultValue: "金额" }),
            required: true,
            inputProps: { min: 0.01, step: 0.01, style: { width: "100%" } },
          }}
        />
        <SchemaField
          schema={schema}
          name="bank_charge"
          config={{
            label: i18n.t("sales.bankCharge", { defaultValue: "银行手续费" }),
            inputProps: { min: 0, step: 0.01, style: { width: "100%" } },
          }}
        />
        <SchemaField
          schema={schema}
          name="payment_method"
          config={{
            label: i18n.t("sales.paymentMethod", { defaultValue: "收款方式" }),
            options: PAYMENT_METHOD_OPTIONS,
          }}
        />
        <SchemaField
          schema={schema}
          name="reference"
          config={{ label: i18n.t("sales.reference", { defaultValue: "参考号" }) }}
        />
        <SchemaField
          schema={schema}
          name="notes"
          config={{ label: i18n.t("sales.notes", { defaultValue: "备注" }), control: <Input.TextArea rows={3} /> }}
        />
      </Form>
    </Drawer>
  );
}
