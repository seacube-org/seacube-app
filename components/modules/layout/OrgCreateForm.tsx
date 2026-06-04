import { useMemo, useState } from "react";
import { Button, Form, Input, Select, App } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { useReferenceOptions } from "@/hooks/core/useReferenceOptions";
import { useAuthStore } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import { TIMEZONE_OPTIONS } from "./constants";
import type { Organization } from "./types";

type Props = {
  /** Called with the new org id after it's created and /me has been refreshed. */
  onCreated: (orgId: number) => void;
  submitLabel?: string;
};

/**
 * Organization-creation form (name + base currency + time zone), à la Zoho Books'
 * "Set up your organization". On success it refreshes the user's memberships so
 * the new org is immediately switchable.
 */
export function OrgCreateForm({ onCreated, submitLabel }: Props) {
  const { message } = App.useApp();
  const { getViewSet, endpoints } = useDataService();
  const orgViewSet = useMemo(() => getViewSet(endpoints.organizations), [getViewSet, endpoints]);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const currencyOptions = useReferenceOptions("currency");
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const org = (await orgViewSet.create({ body: values })) as Organization;
      await fetchMe(); // pull the new membership into the store
      message.success(i18n.t("org.created", { defaultValue: "机构创建成功" }));
      onCreated(org.id);
    } catch {
      message.error(i18n.t("org.createFailed", { defaultValue: "创建失败，请重试" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      layout="vertical"
      requiredMark={false}
      initialValues={{ currency: "CNY", timezone: "Asia/Shanghai" }}
      onFinish={handleFinish}
    >
      <Form.Item
        name="name"
        label={i18n.t("org.name", { defaultValue: "机构名称" })}
        rules={[{ required: true, message: i18n.t("org.nameRequired", { defaultValue: "请输入机构名称" }) }]}
      >
        <Input size="large" placeholder={i18n.t("org.namePlaceholder", { defaultValue: "例如：海立方贸易有限公司" })} autoFocus />
      </Form.Item>

      <Form.Item name="currency" label={i18n.t("org.currency", { defaultValue: "本位币" })}>
        <Select size="large" options={currencyOptions} showSearch optionFilterProp="label" />
      </Form.Item>

      <Form.Item name="timezone" label={i18n.t("org.timezone", { defaultValue: "时区" })}>
        <Select size="large" options={TIMEZONE_OPTIONS} showSearch optionFilterProp="label" />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
          {submitLabel ?? i18n.t("org.create", { defaultValue: "创建机构" })}
        </Button>
      </Form.Item>
    </Form>
  );
}
