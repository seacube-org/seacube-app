import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, App, Avatar, Button, Drawer, Form, Input, Select, Space, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import {
  useAccessViewSets, rows, roleTypeLabel,
  type Member, type Role, type Profile,
} from "./shared";

function MemberDrawer({
  open, member, roles, profiles, orgName, onClose, onSaved,
}: {
  open: boolean;
  member: Member | null; // null = create
  roles: Role[];
  profiles: Profile[];
  orgName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const { usersVS } = useAccessViewSets();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = member != null;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      username: member?.username ?? "",
      email: member?.email ?? "",
      first_name: member?.first_name ?? "",
      last_name: member?.last_name ?? "",
      phone: member?.phone ?? "",
      role_id: member?.role?.id ?? undefined,
      profile_id: member?.profile?.id ?? undefined,
      password: undefined,
    });
  }, [open, member, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (isEdit) {
        const { first_name, last_name, email, phone, role_id, profile_id } = values;
        await usersVS.update({ id: member.id, body: { first_name, last_name, email, phone, role_id, profile_id } });
      } else {
        await usersVS.create({ body: values });
      }
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

  const roleOptions = roles.map((r) => ({ value: r.id, label: `${r.name} · ${roleTypeLabel(r.role_type)}` }));
  const profileOptions = profiles.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 480 } }}
      destroyOnHidden
      title={isEdit
        ? i18n.t("access.editMember", { defaultValue: "编辑用户" })
        : i18n.t("access.newUser", { defaultValue: "新建用户" })}
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
        {!isEdit && orgName ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title={`${i18n.t("access.willJoin", { defaultValue: "将加入机构" })}：${orgName}`}
          />
        ) : null}
        <Form.Item
          name="username"
          label={i18n.t("account.username", { defaultValue: "用户名" })}
          rules={isEdit ? [] : [{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
        >
          <Input disabled={isEdit} autoComplete="off" />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            name="password"
            label={i18n.t("access.initialPassword", { defaultValue: "初始密码" })}
            rules={[{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        )}
        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item name="first_name" label={i18n.t("account.firstName", { defaultValue: "名" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label={i18n.t("account.lastName", { defaultValue: "姓" })} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label={i18n.t("account.email", { defaultValue: "邮箱" })}
          rules={[{ type: "email", message: i18n.t("account.emailInvalid", { defaultValue: "邮箱格式不正确" }) }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone" label={i18n.t("account.phone", { defaultValue: "电话" })}>
          <Input />
        </Form.Item>
        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item name="role_id" label={i18n.t("access.role", { defaultValue: "角色" })} style={{ flex: 1 }}>
            <Select allowClear options={roleOptions} placeholder={i18n.t("access.selectRole", { defaultValue: "选择角色" })} />
          </Form.Item>
          <Form.Item name="profile_id" label={i18n.t("access.profile", { defaultValue: "权限方案" })} style={{ flex: 1 }}>
            <Select allowClear options={profileOptions} placeholder={i18n.t("access.selectProfile", { defaultValue: "选择权限方案" })} />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}

export default function UsersTab({ orgName }: { orgName: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const { message } = App.useApp();
  const { usersVS, rolesVS, profilesVS } = useAccessViewSets();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r, p] = await Promise.all([usersVS.list(), rolesVS.list(), profilesVS.list()]);
      setMembers(rows<Member>(u));
      setRoles(rows<Role>(r));
      setProfiles(rows<Profile>(p));
    } catch {
      message.error(i18n.t("access.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [message, usersVS, rolesVS, profilesVS]);

  useEffect(() => { reload(); }, [reload]);

  // After a mutation, also refresh /me: editing a member's role/profile may change
  // the current user's own permissions, which drive the menu + admin gate.
  const afterMutation = useCallback(() => { reload(); fetchMe(); }, [reload, fetchMe]);

  const columns = useMemo(
    () => [
      {
        title: i18n.t("access.user", { defaultValue: "用户" }),
        key: "user",
        render: (_: unknown, m: Member) => {
          const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username;
          return (
            <Space>
              <Avatar style={{ background: "#1A73E8" }}>{name[0]?.toUpperCase() ?? "?"}</Avatar>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <Typography.Text strong>{name}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{m.email || m.username}</Typography.Text>
              </span>
            </Space>
          );
        },
      },
      {
        title: i18n.t("access.role", { defaultValue: "角色" }),
        key: "role",
        render: (_: unknown, m: Member) =>
          m.role ? <Tag color="blue">{m.role.name}</Tag> : <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: i18n.t("access.profile", { defaultValue: "权限方案" }),
        key: "profile",
        render: (_: unknown, m: Member) =>
          m.profile ? <Tag>{m.profile.name}</Tag> : <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: i18n.t("access.actions", { defaultValue: "操作" }),
        key: "actions",
        width: 100,
        render: (_: unknown, m: Member) => (
          <Button type="link" style={{ padding: 0 }} onClick={() => { setEditing(m); setModalOpen(true); }}>
            {i18n.t("common.edit", { defaultValue: "编辑" })}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          {i18n.t("access.newUser", { defaultValue: "新建用户" })}
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={members}
        pagination={false}
      />
      <MemberDrawer
        open={modalOpen}
        member={editing}
        roles={roles}
        profiles={profiles}
        orgName={orgName}
        onClose={() => setModalOpen(false)}
        onSaved={afterMutation}
      />
    </>
  );
}
