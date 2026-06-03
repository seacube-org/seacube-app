import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Popconfirm, Space, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import { useAccessViewSets, rows, fetchManifest, type Profile, type ManifestModule } from "./shared";
import ProfilePermissionEditor from "./ProfilePermissionEditor";

export default function ProfilesTab() {
  const locale = useLocaleStore((s) => s.locale);
  const { message } = App.useApp();
  const { profilesVS, manifestVS } = useAccessViewSets();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [manifest, setManifest] = useState<ManifestModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setProfiles(rows<Profile>(await profilesVS.list()));
    } catch {
      message.error(i18n.t("access.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [message, profilesVS]);

  useEffect(() => {
    reload();
    fetchManifest(manifestVS).then(setManifest).catch(() => message.error(i18n.t("access.loadFailed", { defaultValue: "加载失败" })));
  }, [reload, message, manifestVS]);

  // Mutations may touch the profile the current user is on, so refresh /me too.
  const afterMutation = useCallback(() => { reload(); fetchMe(); }, [reload, fetchMe]);

  const remove = useCallback(async (id: number) => {
    try {
      await profilesVS.delete({ id });
      message.success(i18n.t("access.deleted", { defaultValue: "已删除" }));
      afterMutation();
    } catch {
      message.error(i18n.t("access.deleteFailed", { defaultValue: "删除失败" }));
    }
  }, [message, afterMutation, profilesVS]);

  const columns = useMemo(
    () => [
      { title: i18n.t("access.profileName", { defaultValue: "方案名称" }), key: "name",
        render: (_: unknown, p: Profile) => (
          <Space>
            <Typography.Text strong>{p.name}</Typography.Text>
            {p.is_system && <Tag color="gold">{i18n.t("access.system", { defaultValue: "系统" })}</Tag>}
          </Space>
        ) },
      { title: i18n.t("access.description", { defaultValue: "描述" }), dataIndex: "description", key: "description",
        render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text> },
      { title: i18n.t("access.actions", { defaultValue: "操作" }), key: "actions", width: 160,
        render: (_: unknown, p: Profile) => (
          <Space size="small">
            <Button type="link" style={{ padding: 0 }} onClick={() => { setEditing(p); setEditorOpen(true); }}>
              {i18n.t("access.editPermissions", { defaultValue: "编辑权限" })}
            </Button>
            {!p.is_system && (
              <Popconfirm
                title={i18n.t("access.deleteProfileConfirm", { defaultValue: "确认删除此权限方案？" })}
                onConfirm={() => remove(p.id)}
                okText={i18n.t("common.confirm", { defaultValue: "确认" })}
                cancelText={i18n.t("common.cancel", { defaultValue: "取消" })}
              >
                <Button type="link" danger style={{ padding: 0 }}>{i18n.t("access.delete", { defaultValue: "删除" })}</Button>
              </Popconfirm>
            )}
          </Space>
        ) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, remove],
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setEditorOpen(true); }}>
          {i18n.t("access.newProfile", { defaultValue: "新建权限方案" })}
        </Button>
      </div>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={profiles} pagination={false} />
      <ProfilePermissionEditor
        open={editorOpen}
        profile={editing}
        manifest={manifest}
        onClose={() => setEditorOpen(false)}
        onSaved={afterMutation}
      />
    </>
  );
}
