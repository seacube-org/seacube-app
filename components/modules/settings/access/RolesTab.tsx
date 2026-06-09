import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Space, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import {
  useAccessViewSets,
  rows,
  roleTypeLabel,
  roleTypeColor,
  FETCH_ALL,
  ACCESS_PAGINATION,
  type Role,
} from "./shared";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import RoleDrawer from "./RoleDrawer";

export default function RolesTab() {
  const locale = useLocaleStore((s) => s.locale);
  const { message } = App.useApp();
  const { rolesVS } = useAccessViewSets();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRoles(rows<Role>(await rolesVS.list({ params: FETCH_ALL })));
    } catch {
      message.error(i18n.t("access.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [message, rolesVS]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Mutations may touch the current user's own role, so refresh /me too (menu + admin gate).
  const afterMutation = useCallback(() => {
    reload();
    fetchMe();
  }, [reload, fetchMe]);

  const nameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);

  const remove = useCallback(
    async (id: number) => {
      try {
        await rolesVS.delete({ id });
        message.success(i18n.t("access.deleted", { defaultValue: "已删除" }));
        afterMutation();
      } catch {
        message.error(i18n.t("access.deleteFailed", { defaultValue: "删除失败" }));
      }
    },
    [message, afterMutation, rolesVS],
  );

  const columns = useMemo(
    () => [
      {
        title: i18n.t("access.roleName", { defaultValue: "角色名称" }),
        dataIndex: "name",
        key: "name",
        render: (v: string) => <Typography.Text strong>{v}</Typography.Text>,
      },
      {
        title: i18n.t("access.roleType", { defaultValue: "类型" }),
        key: "role_type",
        render: (_: unknown, r: Role) => <Tag color={roleTypeColor(r.role_type)}>{roleTypeLabel(r.role_type)}</Tag>,
      },
      {
        title: i18n.t("access.parentRole", { defaultValue: "上级角色" }),
        key: "parent",
        render: (_: unknown, r: Role) =>
          r.parent ? (nameById.get(r.parent) ?? `#${r.parent}`) : <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: i18n.t("access.peerVisible", { defaultValue: "同级互相可见" }),
        key: "peer",
        width: 120,
        render: (_: unknown, r: Role) =>
          r.is_peer_visible
            ? i18n.t("common.yes", { defaultValue: "是" })
            : i18n.t("common.no", { defaultValue: "否" }),
      },
      {
        title: i18n.t("access.description", { defaultValue: "描述" }),
        dataIndex: "description",
        key: "description",
        render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: i18n.t("access.actions", { defaultValue: "操作" }),
        key: "actions",
        width: 130,
        render: (_: unknown, r: Role) => (
          <Space size="small">
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => {
                setEditing(r);
                setModalOpen(true);
              }}
            >
              {i18n.t("common.edit", { defaultValue: "编辑" })}
            </Button>
            <ConfirmDeleteButton
              link
              title={i18n.t("access.deleteRoleConfirm", { defaultValue: "确认删除此角色？" })}
              onConfirm={() => remove(r.id)}
              label={i18n.t("access.delete", { defaultValue: "删除" })}
            />
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, nameById, remove],
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          {i18n.t("access.newRole", { defaultValue: "新建角色" })}
        </Button>
      </div>
      <BasicTable rowKey="id" loading={loading} columns={columns} dataSource={roles} pagination={ACCESS_PAGINATION} />
      <RoleDrawer
        open={modalOpen}
        role={editing}
        roles={roles}
        onClose={() => setModalOpen(false)}
        onSaved={afterMutation}
      />
    </>
  );
}
