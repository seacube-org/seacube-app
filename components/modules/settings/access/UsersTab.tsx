import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Avatar, Button, Segmented, Space, Switch, Tag, Tooltip, Typography } from "antd";
import { PlusOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import {
  useAccessViewSets,
  rows,
  roleTypeColor,
  FETCH_ALL,
  ACCESS_PAGINATION,
  type Member,
  type Role,
  type Profile,
} from "./shared";
import MemberDrawer from "./MemberDrawer";
import InviteDrawer from "./InviteDrawer";

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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const currentUserId = useAuthStore((s) => s.user?.id);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...FETCH_ALL, ...(statusFilter === "all" ? {} : { is_active: statusFilter === "active" }) };
      const [u, r, p] = await Promise.all([
        usersVS.list({ params }),
        rolesVS.list({ params: FETCH_ALL }),
        profilesVS.list({ params: FETCH_ALL }),
      ]);
      setMembers(rows<Member>(u));
      setRoles(rows<Role>(r));
      setProfiles(rows<Profile>(p));
    } catch {
      message.error(i18n.t("access.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [message, usersVS, rolesVS, profilesVS, statusFilter]);

  useEffect(() => {
    reload();
  }, [reload]);

  // After a mutation, also refresh /me: editing a member's role/profile may change
  // the current user's own permissions, which drive the menu + admin gate.
  const afterMutation = useCallback(() => {
    reload();
    fetchMe();
  }, [reload, fetchMe]);

  const toggleActive = useCallback(
    async (m: Member, checked: boolean) => {
      try {
        await usersVS.update({ id: m.id, body: { is_active: checked } });
        reload();
      } catch {
        message.error(i18n.t("access.toggleFailed", { defaultValue: "状态更新失败" }));
      }
    },
    [usersVS, reload, message],
  );

  const columns = useMemo(
    () => [
      {
        title: i18n.t("access.user", { defaultValue: "用户" }),
        key: "user",
        render: (_: unknown, m: Member) => {
          const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username;
          return (
            <Space size={10}>
              <Avatar size={36} style={{ background: "#1A73E8", flexShrink: 0 }}>
                {name[0]?.toUpperCase() ?? "?"}
              </Avatar>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
                <Typography.Text strong style={{ lineHeight: 1.35 }} ellipsis={{ tooltip: name }}>
                  {name}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, lineHeight: 1.35 }}
                  ellipsis={{ tooltip: m.email || m.username }}
                >
                  {m.email || m.username}
                </Typography.Text>
              </span>
            </Space>
          );
        },
      },
      {
        title: i18n.t("access.role", { defaultValue: "角色" }),
        key: "role",
        render: (_: unknown, m: Member) =>
          m.role ? (
            <Tag color={roleTypeColor(m.role.role_type)}>{m.role.name}</Tag>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      {
        title: i18n.t("access.profile", { defaultValue: "权限方案" }),
        key: "profile",
        render: (_: unknown, m: Member) =>
          m.profile ? <Tag>{m.profile.name}</Tag> : <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: i18n.t("access.status", { defaultValue: "状态" }),
        key: "is_active",
        width: 90,
        render: (_: unknown, m: Member) => (
          <Tooltip
            title={
              m.id === currentUserId ? i18n.t("access.cannotToggleSelf", { defaultValue: "不能停用自己的账户" }) : ""
            }
          >
            <Switch
              size="small"
              checked={m.is_active}
              disabled={m.id === currentUserId}
              onChange={(checked) => toggleActive(m, checked)}
            />
          </Tooltip>
        ),
      },
      {
        title: i18n.t("access.actions", { defaultValue: "操作" }),
        key: "actions",
        width: 80,
        render: (_: unknown, m: Member) => (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => {
              setEditing(m);
              setModalOpen(true);
            }}
          >
            {i18n.t("common.edit", { defaultValue: "编辑" })}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, toggleActive, currentUserId],
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        {/* Softer track + a blue active pill so the status filter echoes the
            toolbar/tab blue accent instead of the chunky default Segmented. */}
        <div className="seacube-status-seg">
          <style>{`
            .seacube-status-seg .ant-segmented {
              background: #eef2f6;
              padding: 3px;
              border-radius: 9px;
            }
            .seacube-status-seg .ant-segmented-item { border-radius: 7px; color: #5f6b7a; transition: color .15s; }
            .seacube-status-seg .ant-segmented-item:hover { color: #1A73E8; }
            .seacube-status-seg .ant-segmented-item-selected {
              color: #1A73E8;
              font-weight: 600;
              box-shadow: 0 1px 3px rgba(16, 30, 60, 0.12);
            }
            .seacube-status-seg .ant-segmented-item-label {
              box-sizing: border-box;
              min-width: 72px;
              text-align: center;
              padding: 1px 12px;
            }
          `}</style>
          <Segmented
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
            options={[
              { label: i18n.t("access.statusAll", { defaultValue: "全部" }), value: "all" },
              { label: i18n.t("access.statusActive", { defaultValue: "激活" }), value: "active" },
              { label: i18n.t("access.statusInactive", { defaultValue: "未激活" }), value: "inactive" },
            ]}
          />
        </div>
        <Space>
          <Button icon={<UsergroupAddOutlined />} onClick={() => setInviteOpen(true)}>
            {i18n.t("access.inviteExisting", { defaultValue: "邀请已有用户" })}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            {i18n.t("access.newUser", { defaultValue: "新建用户" })}
          </Button>
        </Space>
      </div>
      {/* Taller rows + normal line-height (override the shared skin's 38px) so the
          avatar + name/email identity cell fits without cramping or huge gaps. */}
      <div className="seacube-users-table">
        <style>{`
          .seacube-users-table .seacube-basic-table .ant-table-tbody > tr.ant-table-row,
          .seacube-users-table .seacube-basic-table .ant-table-tbody > tr.ant-table-row > td {
            height: 56px !important;
            line-height: 1.4 !important;
          }
        `}</style>
        <BasicTable
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={members}
          pagination={ACCESS_PAGINATION}
        />
      </div>
      <MemberDrawer
        open={modalOpen}
        member={editing}
        roles={roles}
        profiles={profiles}
        orgName={orgName}
        onClose={() => setModalOpen(false)}
        onSaved={afterMutation}
      />
      <InviteDrawer
        open={inviteOpen}
        roles={roles}
        profiles={profiles}
        orgName={orgName}
        onClose={() => setInviteOpen(false)}
        onSaved={afterMutation}
      />
    </>
  );
}
