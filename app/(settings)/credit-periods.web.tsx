import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Space, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDataService } from "@/hooks/core/useDataService";
import { invalidateReferenceOptions } from "@/hooks/core/useReferenceOptions";
import { useAuthStore, useIsActiveAdmin } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { API_ENDPOINTS } from "@/constants/Constants";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import { rows, ACCESS_PAGINATION, FETCH_ALL } from "@/components/modules/settings/access/shared";
import { ConfirmDeleteButton } from "@/components/modules/settings/access/ConfirmDeleteButton";
import { termTypeLabel, daysDisplay, type CreditPeriod } from "@/components/modules/settings/credit-period/shared";
import CreditPeriodDrawer from "@/components/modules/settings/credit-period/CreditPeriodDrawer";

export default function CreditPeriodsSettings() {
  const locale = useLocaleStore((s) => s.locale);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const isAdmin = useIsActiveAdmin();
  const { message } = App.useApp();
  const { getViewSet } = useDataService();
  const vs = useMemo(() => getViewSet(API_ENDPOINTS.creditPeriods), [getViewSet]);

  const [periods, setPeriods] = useState<CreditPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CreditPeriod | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setPeriods(rows<CreditPeriod>(await vs.list({ params: FETCH_ALL })));
    } catch {
      message.error(i18n.t("creditPeriod.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [message, vs]);

  // Refetch on org switch (per-org data) and on locale change (labels are
  // localized server-side).
  useEffect(() => {
    reload();
  }, [reload, activeOrgId, locale]);

  // After a create/edit/delete/set-default, also drop the contact form's cached
  // credit_period options so its selector reflects the change on next open.
  const afterMutation = useCallback(() => {
    invalidateReferenceOptions("credit_period");
    reload();
  }, [reload]);

  const remove = useCallback(
    async (id: number) => {
      try {
        await vs.delete({ id });
        message.success(i18n.t("creditPeriod.deleted", { defaultValue: "已删除" }));
        afterMutation();
      } catch {
        message.error(i18n.t("creditPeriod.deleteFailed", { defaultValue: "删除失败" }));
      }
    },
    [message, vs, afterMutation],
  );

  const setDefault = useCallback(
    async (id: number) => {
      try {
        await vs.action({ id, action: "set_default" });
        afterMutation();
      } catch {
        message.error(i18n.t("creditPeriod.setDefaultFailed", { defaultValue: "设置默认失败" }));
      }
    },
    [vs, message, afterMutation],
  );

  const columns = useMemo(
    () => [
      {
        title: i18n.t("creditPeriod.name", { defaultValue: "条款名称" }),
        key: "name",
        render: (_: unknown, r: CreditPeriod) => (
          <Space size={6}>
            <Typography.Text strong>{r.label}</Typography.Text>
            {r.is_default && <Tag color="blue">{i18n.t("creditPeriod.default", { defaultValue: "默认" })}</Tag>}
            {r.is_system && <Tag>{i18n.t("creditPeriod.system", { defaultValue: "系统" })}</Tag>}
          </Space>
        ),
      },
      {
        title: i18n.t("creditPeriod.termType", { defaultValue: "类型" }),
        key: "term_type",
        width: 160,
        render: (_: unknown, r: CreditPeriod) => termTypeLabel(r.term_type),
      },
      {
        title: i18n.t("creditPeriod.days", { defaultValue: "天数" }),
        key: "days",
        width: 100,
        align: "right" as const,
        render: (_: unknown, r: CreditPeriod) => daysDisplay(r),
      },
      ...(isAdmin
        ? [
            {
              title: i18n.t("access.actions", { defaultValue: "操作" }),
              key: "actions",
              width: 200,
              render: (_: unknown, r: CreditPeriod) =>
                r.is_system ? (
                  <Typography.Text type="secondary">—</Typography.Text>
                ) : (
                  <Space size="small">
                    {!r.is_default && (
                      <Button type="link" style={{ padding: 0 }} onClick={() => setDefault(r.id)}>
                        {i18n.t("creditPeriod.setDefault", { defaultValue: "设为默认" })}
                      </Button>
                    )}
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
                      title={i18n.t("creditPeriod.deleteConfirm", { defaultValue: "确认删除此账期？" })}
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
    [locale, isAdmin, remove, setDefault],
  );

  return (
    <SettingsSection title={i18n.t("settings.creditPeriods", { defaultValue: "账期设置" })}>
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
            {i18n.t("creditPeriod.new", { defaultValue: "新建账期" })}
          </Button>
        </div>
      )}
      <BasicTable rowKey="id" loading={loading} columns={columns} dataSource={periods} pagination={ACCESS_PAGINATION} />
      <CreditPeriodDrawer open={drawerOpen} period={editing} onClose={() => setDrawerOpen(false)} onSaved={afterMutation} />
    </SettingsSection>
  );
}
