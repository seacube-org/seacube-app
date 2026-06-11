import { useEffect, useState } from "react";
import { DatePicker, Form, Input, InputNumber, Modal, Select, Typography } from "antd";
import dayjs from "dayjs";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import i18n from "@/locale/i18n";
import { amount as fmtAmount } from "@/components/modules/sales/shared/format";
import { fromPicker } from "@/components/modules/sales/shared/dates";
import { PAYMENT_METHOD_OPTIONS } from "@/components/modules/sales/payment/shared";

/** The shape POSTed to the invoice `record-payment` action. */
export type RecordPaymentBody = {
  amount: number;
  bank_charge: number;
  date: string | null;
  payment_method: string;
  reference: string;
  notes: string;
};

type Props = {
  open: boolean;
  /** Currency code for the balance-due hint. */
  currency?: string;
  /** Outstanding balance, shown as a hint and prefilled as the amount. */
  balanceDue: string;
  /** Wired by the parent to vs.action({ id, action:"record-payment", body }). Throws on error. */
  onSubmit: (body: RecordPaymentBody) => Promise<void>;
  onClose: () => void;
};

/** Modal to record a payment against a SENT / PARTIALLY_PAID invoice. */
export default function RecordPaymentModal({ open, currency, balanceDue, onSubmit, onClose }: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      amount: Number(balanceDue) || undefined,
      payment_method: "BANK_TRANSFER",
      date: dayjs(),
      bank_charge: 0,
      reference: "",
      notes: "",
    });
  }, [open, balanceDue, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    const body: RecordPaymentBody = {
      amount: Number(values.amount),
      bank_charge: Number(values.bank_charge ?? 0),
      date: fromPicker(values.date as Parameters<typeof fromPicker>[0]),
      payment_method: String(values.payment_method),
      reference: String(values.reference ?? ""),
      notes: String(values.notes ?? ""),
    };
    setSaving(true);
    try {
      await onSubmit(body);
      onClose();
    } catch (err) {
      // Backend toast is owned by the parent's runAction; only field errors here.
      applyFieldErrors(form, err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={i18n.t("sales.recordPayment", { defaultValue: "记录收款" })}
      cancelText={i18n.t("common.cancel", { defaultValue: "取消" })}
      confirmLoading={saving}
      title={i18n.t("sales.recordPayment", { defaultValue: "记录收款" })}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {i18n.t("sales.balanceDue", { defaultValue: "应收余额" })}:{" "}
        <Typography.Text strong>
          {currency ? `${currency} ` : ""}
          {fmtAmount(balanceDue)}
        </Typography.Text>
      </Typography.Paragraph>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="amount"
          label={i18n.t("sales.amount", { defaultValue: "金额" })}
          rules={[
            { required: true, message: i18n.t("common.required", { defaultValue: "必填" }) },
            {
              validator: (_, value) =>
                Number(value) > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error(i18n.t("sales.amountPositive", { defaultValue: "金额必须大于 0" }))),
            },
          ]}
        >
          <InputNumber min={0} style={{ width: "100%" }} addonBefore={currency} />
        </Form.Item>

        <Form.Item
          name="payment_method"
          label={i18n.t("sales.paymentMethod", { defaultValue: "收款方式" })}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <Select options={PAYMENT_METHOD_OPTIONS} />
        </Form.Item>

        <Form.Item name="date" label={i18n.t("sales.paymentDate", { defaultValue: "收款日期" })}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="bank_charge" label={i18n.t("sales.bankCharge", { defaultValue: "银行手续费" })}>
          <InputNumber min={0} style={{ width: "100%" }} addonBefore={currency} />
        </Form.Item>

        <Form.Item name="reference" label={i18n.t("sales.reference", { defaultValue: "参考号" })}>
          <Input maxLength={100} />
        </Form.Item>

        <Form.Item name="notes" label={i18n.t("sales.notes", { defaultValue: "备注" })}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
