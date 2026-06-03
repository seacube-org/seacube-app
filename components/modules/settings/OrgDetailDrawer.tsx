import { useEffect, useMemo, useState } from "react";
import { App, Button, Drawer, Form, Image, Input, Select, Skeleton, Typography, Upload } from "antd";
import { BankOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";
import { colors } from "@/constants/theme";
import { useDataService } from "@/hooks/core/useDataService";
import { useAuthStore, type Membership } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import { InfoRow } from "@/components/modules/layout/InfoRow";
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from "@/components/modules/layout/constants";
import type { Organization } from "@/components/modules/layout/types";
import { rows, FETCH_ALL } from "@/components/modules/settings/access/shared";
import { addressOptionLabel, formatAddressLine, type Address } from "@/components/modules/settings/address/shared";
import { applyFieldErrors } from "./formErrors";

const DASH = "—";

/** Map a stored choice value (e.g. "CNY") to its human label, falling back to the raw value. */
const optionLabel = (options: readonly { value: string; label: string }[], value?: string) =>
  options.find((o) => o.value === value)?.label ?? value;

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

type Props = {
  open: boolean;
  /** The membership whose organization is being viewed (null = drawer closed). */
  membership: Membership | null;
  /** Whether the current user may edit this org (admin of the active org). */
  canEdit: boolean;
  onClose: () => void;
};

/**
 * Slide-in panel showing an organization's full detail, with an inline edit mode
 * for admins of the active org (update is admin-only and scoped to the active org
 * on the backend). Mirrors the read-only OrgDrawer in the header but adds editing.
 */
export function OrgDetailDrawer({ open, membership, canEdit, onClose }: Props) {
  const { message } = App.useApp();
  const { getViewSet, endpoints } = useDataService();
  const orgViewSet = useMemo(() => getViewSet(endpoints.organizations), [getViewSet, endpoints]);
  const addressVS = useMemo(() => getViewSet(endpoints.addresses), [getViewSet, endpoints]);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [form] = Form.useForm();
  const [detail, setDetail] = useState<Organization | null>(null);
  const [orgAddresses, setOrgAddresses] = useState<Address[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const orgId = membership?.organization.id ?? null;

  // On drawer open: reset to view mode, fetch org detail, and (for admins) preload
  // the address-book options for the edit dropdown — once per open, not per edit toggle.
  useEffect(() => {
    if (!open || orgId == null) return;
    let active = true;
    setEditing(false);
    setLogoFile(null);
    setDetail(null);
    setOrgAddresses([]);
    setLoading(true);
    (async () => {
      try {
        const data = (await orgViewSet.retrieve({ id: orgId })) as Organization;
        if (active) setDetail(data);
      } catch {
        if (active) message.error(i18n.t("org.loadFailed", { defaultValue: "加载失败" }));
      } finally {
        if (active) setLoading(false);
      }
    })();
    if (canEdit) {
      (async () => {
        try {
          const data = rows<Address>(await addressVS.list({ params: FETCH_ALL }));
          if (active) setOrgAddresses(data);
        } catch {
          /* dropdown stays empty; the address field is optional */
        }
      })();
    }
    return () => { active = false; };
  }, [open, orgId, canEdit, orgViewSet, addressVS, message]);

  // Seed the form when entering edit mode (options are already loaded above).
  useEffect(() => {
    if (!editing || !detail) return;
    form.setFieldsValue({
      name: detail.name,
      legal_name: detail.legal_name,
      tax_number: detail.tax_number,
      contact_email: detail.contact_email,
      phone: detail.phone,
      website: detail.website,
      address: detail.address ?? undefined,
      currency: detail.currency,
      timezone: detail.timezone,
    });
  }, [editing, detail, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    if (orgId == null) return;
    setSaving(true);
    try {
      // allowClear yields undefined when the address is cleared → send null to unbind it.
      const body = { ...values, address: values.address ?? null };
      let updated = (await orgViewSet.update({ id: orgId, body })) as Organization;
      // A new logo is a file → a separate multipart PATCH, keeping the JSON body clean.
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        updated = (await orgViewSet.update({ id: orgId, body: fd })) as Organization;
      }
      setDetail(updated);
      setLogoFile(null);
      setEditing(false);
      await fetchMe(); // name/logo may have changed — refresh memberships / switcher
      message.success(i18n.t("account.saved", { defaultValue: "已保存" }));
    } catch (err) {
      if (!applyFieldErrors(form, err)) {
        message.error(i18n.t("account.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
    } finally {
      setSaving(false);
    }
  };

  const closeEdit = () => { setEditing(false); setLogoFile(null); };

  const footer = editing ? (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <Button onClick={closeEdit}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
      <Button type="primary" loading={saving} onClick={() => form.submit()}>
        {i18n.t("common.save", { defaultValue: "保存" })}
      </Button>
    </div>
  ) : canEdit ? (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Button type="primary" icon={<EditOutlined />} disabled={!detail} onClick={() => setEditing(true)}>
        {i18n.t("common.edit", { defaultValue: "编辑" })}
      </Button>
    </div>
  ) : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{
        wrapper: { width: 600 },
        header: { borderBottom: `1px solid ${colors.border}` },
      }}
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <BankOutlined style={{ color: colors.primary }} />
          {membership?.organization.name}
        </span>
      }
      footer={footer}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : editing ? (
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
          <Form.Item label={i18n.t("org.logo", { defaultValue: "Logo" })}>
            <Upload
              accept="image/*"
              maxCount={1}
              listType="picture"
              beforeUpload={(file) => { setLogoFile(file as File); return false; }}
              onRemove={() => setLogoFile(null)}
              fileList={logoFile ? [{ uid: "-1", name: logoFile.name, status: "done" as const }] : []}
            >
              <Button icon={<UploadOutlined />}>{i18n.t("org.uploadLogo", { defaultValue: "选择图片" })}</Button>
            </Upload>
            {detail?.logo && !logoFile && (
              <Image
                src={detail.logo}
                alt="logo"
                width={56}
                height={56}
                style={{ objectFit: "contain", borderRadius: 6, border: `1px solid ${colors.border}`, marginTop: 8 }}
              />
            )}
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16 }}>
            <Form.Item
              style={{ gridColumn: "1 / -1" }}
              name="name"
              label={i18n.t("org.name", { defaultValue: "机构名称" })}
              rules={[{ required: true, message: i18n.t("org.nameRequired", { defaultValue: "请输入机构名称" }) }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="legal_name" label={i18n.t("org.legalName", { defaultValue: "法定名称" })}>
              <Input />
            </Form.Item>
            <Form.Item name="tax_number" label={i18n.t("org.taxNumber", { defaultValue: "税号" })}>
              <Input />
            </Form.Item>
            <Form.Item
              name="contact_email"
              label={i18n.t("org.contactEmail", { defaultValue: "联系邮箱" })}
              rules={[{ type: "email", message: i18n.t("org.emailInvalid", { defaultValue: "邮箱格式不正确" }) }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="phone" label={i18n.t("org.phone", { defaultValue: "电话" })}>
              <Input />
            </Form.Item>
            <Form.Item style={{ gridColumn: "1 / -1" }} name="website" label={i18n.t("org.website", { defaultValue: "网站" })}>
              <Input />
            </Form.Item>
            <Form.Item
              style={{ gridColumn: "1 / -1" }}
              name="address"
              label={i18n.t("org.address", { defaultValue: "地址" })}
              tooltip={i18n.t("org.addressHint", { defaultValue: "从地址簿中选择主地址；在「地址簿」页管理" })}
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder={i18n.t("org.addressPlaceholder", { defaultValue: "选择主地址" })}
                options={orgAddresses.map((a) => ({ value: a.id, label: addressOptionLabel(a) }))}
                notFoundContent={i18n.t("org.noAddresses", { defaultValue: "地址簿为空，请先在「地址簿」新建" })}
              />
            </Form.Item>
            <Form.Item name="currency" label={i18n.t("org.currency", { defaultValue: "本位币" })}>
              <Select options={CURRENCY_OPTIONS} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="timezone" label={i18n.t("org.timezone", { defaultValue: "时区" })}>
              <Select options={TIMEZONE_OPTIONS} showSearch optionFilterProp="label" />
            </Form.Item>
          </div>
        </Form>
      ) : detail ? (
        <>
          {detail.logo && (
            <div style={{ padding: "8px 0" }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                {i18n.t("org.logo", { defaultValue: "Logo" })}
              </Typography.Text>
              <Image
                src={detail.logo}
                alt="logo"
                width={64}
                height={64}
                style={{ objectFit: "contain", borderRadius: 8, border: `1px solid ${colors.border}` }}
              />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <InfoRow label={i18n.t("org.name", { defaultValue: "机构名称" })} value={detail.name} placeholder={DASH} />
            </div>
            <InfoRow label={i18n.t("org.legalName", { defaultValue: "法定名称" })} value={detail.legal_name} placeholder={DASH} />
            <InfoRow label={i18n.t("org.slug", { defaultValue: "标识符" })} value={detail.slug} placeholder={DASH} />
            <InfoRow label={i18n.t("org.taxNumber", { defaultValue: "税号" })} value={detail.tax_number} placeholder={DASH} />
            <InfoRow label={i18n.t("org.contactEmail", { defaultValue: "联系邮箱" })} value={detail.contact_email} placeholder={DASH} />
            <InfoRow label={i18n.t("org.phone", { defaultValue: "电话" })} value={detail.phone} placeholder={DASH} />
            <InfoRow label={i18n.t("org.website", { defaultValue: "网站" })} value={detail.website} placeholder={DASH} />
            <div style={{ gridColumn: "1 / -1" }}>
              <InfoRow label={i18n.t("org.address", { defaultValue: "地址" })} value={formatAddressLine(detail.address_detail)} placeholder={DASH} />
            </div>
            <InfoRow label={i18n.t("org.currency", { defaultValue: "本位币" })} value={optionLabel(CURRENCY_OPTIONS, detail.currency)} placeholder={DASH} />
            <InfoRow label={i18n.t("org.timezone", { defaultValue: "时区" })} value={optionLabel(TIMEZONE_OPTIONS, detail.timezone)} placeholder={DASH} />
            <InfoRow label={i18n.t("org.createdAt", { defaultValue: "创建时间" })} value={formatDate(detail.created_at)} placeholder={DASH} />
            <InfoRow label={i18n.t("org.myRole", { defaultValue: "我的角色" })} value={membership?.role?.name} placeholder={DASH} />
          </div>
          {!canEdit && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 12 }}>
              {i18n.t("org.editHint", { defaultValue: "仅当前机构的管理员可编辑机构信息" })}
            </Typography.Text>
          )}
        </>
      ) : null}
    </Drawer>
  );
}
