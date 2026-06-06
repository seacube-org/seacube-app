import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Drawer, Form, Input, Select, Space, Switch, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import {
  useAccessViewSets,
  rows,
  roleTypeLabel,
  roleTypeColor,
  ROLE_TYPE_OPTIONS,
  FETCH_ALL,
  ACCESS_PAGINATION,
  type Role,
} from "./shared";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

function RoleDrawer({
  open,
  role,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  role: Role | null; // null = create
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const { rolesVS } = useAccessViewSets();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = role != null;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: role?.name ?? "",
      role_type: role?.role_type ?? "STAFF",
      parent: role?.parent ?? undefined,
      is_peer_visible: role?.is_peer_visible ?? false,
      description: role?.description ?? "",
    });
  }, [open, role, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) await rolesVS.update({ id: role.id, body: values });
      else await rolesVS.create({ body: values });
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

  // A role cannot be its own parent.
  const parentOptions = roles.filter((r) => r.id !== role?.id).map((r) => ({ value: r.id, label: r.name }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 480 } }}
      destroyOnHidden
      title={
        isEdit
          ? i18n.t("access.editRole", { defaultValue: "编辑角色" })
          : i18n.t("access.newRole", { defaultValue: "新建角色" })
      }
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {i18n.t("account.save", { defaultValue: "保存" })}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label={i18n.t("access.roleName", { defaultValue: "角色名称" })}
          rules={[{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="role_type" label={i18n.t("access.roleType", { defaultValue: "类型" })}>
          <Select options={ROLE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: roleTypeLabel(o.value) }))} />
        </Form.Item>
        <Form.Item
          name="parent"
          label={i18n.t("access.parentRole", { defaultValue: "上级角色" })}
          tooltip={i18n.t("access.parentRoleHint", { defaultValue: "下级角色的数据对上级可见" })}
        >
          <Select
            allowClear
            options={parentOptions}
            placeholder={i18n.t("access.noParent", { defaultValue: "无（顶级角色）" })}
          />
        </Form.Item>
        <Form.Item
          name="is_peer_visible"
          label={i18n.t("access.peerVisible", { defaultValue: "同级互相可见" })}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item name="description" label={i18n.t("access.description", { defaultValue: "描述" })}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

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
      <Table rowKey="id" loading={loading} columns={columns} dataSource={roles} pagination={ACCESS_PAGINATION} />
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
