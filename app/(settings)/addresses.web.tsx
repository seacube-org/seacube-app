import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Drawer, Form, Input, Select, Space, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDataService } from "@/hooks/core/useDataService";
import { useAuthStore, useIsActiveAdmin } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import { rows, ACCESS_PAGINATION, FETCH_ALL } from "@/components/modules/settings/access/shared";
import { ConfirmDeleteButton } from "@/components/modules/settings/access/ConfirmDeleteButton";
import {
  ADDRESS_TYPE_OPTIONS,
  addressTypeColor,
  addressTypeLabel,
  formatAddressLine,
  type Address,
} from "@/components/modules/settings/address/shared";

function AddressDrawer({
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
          <Form.Item
            name="postal_code"
            label={i18n.t("address.postalCode", { defaultValue: "邮编" })}
            style={{ flex: 1 }}
          >
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

export default function AddressesSettings() {
  const locale = useLocaleStore((s) => s.locale);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const isAdmin = useIsActiveAdmin();
  const { message } = App.useApp();
  const { getViewSet, endpoints } = useDataService();
  const addressVS = useMemo(() => getViewSet(endpoints.addresses), [getViewSet, endpoints]);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setAddresses(rows<Address>(await addressVS.list({ params: FETCH_ALL })));
    } catch {
      message.error(i18n.t("address.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [message, addressVS]);

  // Reload when the active org changes (org-scoped data).
  useEffect(() => {
    reload();
  }, [reload, activeOrgId]);

  const remove = useCallback(
    async (id: number) => {
      try {
        await addressVS.delete({ id });
        message.success(i18n.t("address.deleted", { defaultValue: "已删除" }));
        reload();
      } catch {
        message.error(i18n.t("address.deleteFailed", { defaultValue: "删除失败" }));
      }
    },
    [message, addressVS, reload],
  );

  const columns = useMemo(
    () => [
      {
        title: i18n.t("address.label", { defaultValue: "名称" }),
        dataIndex: "label",
        key: "label",
        render: (v: string) =>
          v ? <Typography.Text strong>{v}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: i18n.t("address.type", { defaultValue: "类型" }),
        key: "address_type",
        width: 120,
        render: (_: unknown, r: Address) => (
          <Tag color={addressTypeColor(r.address_type)}>{addressTypeLabel(r.address_type)}</Tag>
        ),
      },
      {
        title: i18n.t("address.detail", { defaultValue: "地址" }),
        key: "detail",
        render: (_: unknown, r: Address) =>
          formatAddressLine(r) || <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: i18n.t("address.phone", { defaultValue: "电话" }),
        dataIndex: "phone",
        key: "phone",
        width: 140,
        render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text>,
      },
      ...(isAdmin
        ? [
            {
              title: i18n.t("access.actions", { defaultValue: "操作" }),
              key: "actions",
              width: 130,
              render: (_: unknown, r: Address) => (
                <Space size="small">
                  <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={() => {
                      setEditing(r);
                      setDrawerOpen(true);
                    }}
                  >
                    {i18n.t("common.edit", { defaultValue: "编辑" })}
                  </Button>
                  <ConfirmDeleteButton
                    link
                    title={i18n.t("address.deleteConfirm", { defaultValue: "确认删除此地址？" })}
                    onConfirm={() => remove(r.id)}
                    label={i18n.t("common.delete", { defaultValue: "删除" })}
                  />
                </Space>
              ),
            },
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, isAdmin, remove],
  );

  return (
    <SettingsSection title={i18n.t("settings.addresses", { defaultValue: "地址簿" })}>
      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            {i18n.t("address.new", { defaultValue: "新建地址" })}
          </Button>
        </div>
      )}
      <Table rowKey="id" loading={loading} columns={columns} dataSource={addresses} pagination={ACCESS_PAGINATION} />
      <AddressDrawer open={drawerOpen} address={editing} onClose={() => setDrawerOpen(false)} onSaved={reload} />
    </SettingsSection>
  );
}
