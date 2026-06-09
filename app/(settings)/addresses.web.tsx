import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Space, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDataService } from "@/hooks/core/useDataService";
import { useAuthStore, useIsActiveAdmin } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import { rows, ACCESS_PAGINATION, FETCH_ALL } from "@/components/modules/settings/access/shared";
import { ConfirmDeleteButton } from "@/components/modules/settings/access/ConfirmDeleteButton";
import {
  addressTypeColor,
  addressTypeLabel,
  formatAddressLine,
  type Address,
} from "@/components/modules/settings/address/shared";
import AddressDrawer from "@/components/modules/settings/address/AddressDrawer";

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
      <BasicTable rowKey="id" loading={loading} columns={columns} dataSource={addresses} pagination={ACCESS_PAGINATION} />
      <AddressDrawer open={drawerOpen} address={editing} onClose={() => setDrawerOpen(false)} onSaved={reload} />
    </SettingsSection>
  );
}
