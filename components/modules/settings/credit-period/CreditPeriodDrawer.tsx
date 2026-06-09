import { useEffect, useMemo, useState } from "react";
import { App, Button, Drawer, Form, Input, InputNumber, Select } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { TERM_TYPE_OPTIONS, termTypeLabel, type CreditPeriod } from "./shared";

/** Create / edit a credit-period (payment term); `days` only applies to NET_DAYS. */
export default function CreditPeriodDrawer({
  open,
  period,
  onClose,
  onSaved,
}: {
  open: boolean;
  period: CreditPeriod | null; // null = create
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const { getViewSet } = useDataService();
  const vs = useMemo(() => getViewSet(API_ENDPOINTS.creditPeriods), [getViewSet]);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = period != null;
  const termType = Form.useWatch("term_type", form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: period?.name ?? "",
      term_type: period?.term_type ?? "NET_DAYS",
      days: period?.days ?? 30,
    });
  }, [open, period, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      // days only applies to NET_DAYS; the backend nulls it for other rules.
      if (isEdit) await vs.update({ id: period.id, body: values });
      else await vs.create({ body: values });
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
      styles={{ wrapper: { width: 420 } }}
      title={
        isEdit
          ? i18n.t("creditPeriod.edit", { defaultValue: "编辑账期" })
          : i18n.t("creditPeriod.new", { defaultValue: "新建账期" })
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
          label={i18n.t("creditPeriod.name", { defaultValue: "条款名称" })}
          rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
        >
          <Input placeholder={i18n.t("creditPeriod.namePlaceholder", { defaultValue: "例如：见票后 30 日付款" })} />
        </Form.Item>
        <Form.Item name="term_type" label={i18n.t("creditPeriod.termType", { defaultValue: "类型" })}>
          <Select options={TERM_TYPE_OPTIONS.map((o) => ({ value: o.value, label: termTypeLabel(o.value) }))} />
        </Form.Item>
        {termType === "NET_DAYS" && (
          <Form.Item
            name="days"
            label={i18n.t("creditPeriod.days", { defaultValue: "天数" })}
            rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
