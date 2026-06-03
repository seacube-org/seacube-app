import { useEffect, useMemo, useState } from "react";
import { App, Button, Drawer, Form, Input, Select, Space, Tag, Typography, theme } from "antd";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import { applyFieldErrors } from "@/components/modules/settings/formErrors";
import {
  useAccessViewSets, permLevelLabel, actionsToLevel, levelToActions, PERM_LEVELS,
  type Profile, type ManifestModule, type PermLevel,
} from "./shared";

type Section = { section: string; modules: ManifestModule[] };

/** Group manifest modules by section, preserving the manifest's order. */
function groupSections(manifest: ManifestModule[]): Section[] {
  const out: Section[] = [];
  const index = new Map<string, Section>();
  for (const m of manifest) {
    let s = index.get(m.section);
    if (!s) { s = { section: m.section, modules: [] }; index.set(m.section, s); out.push(s); }
    s.modules.push(m);
  }
  return out;
}

const levelOptions = () => PERM_LEVELS.map((l) => ({ value: l, label: permLevelLabel(l) }));

export default function ProfilePermissionEditor({
  open, profile, manifest, onClose, onSaved,
}: {
  open: boolean;
  profile: Profile | null; // null = create
  manifest: ManifestModule[];
  onClose: () => void;
  onSaved: () => void;
}) {
  useLocaleStore((s) => s.locale); // re-render when locale changes
  const { profilesVS } = useAccessViewSets();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [perms, setPerms] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = profile != null;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ name: profile?.name ?? "", description: profile?.description ?? "" });
    setPerms({ ...(profile?.module_permissions ?? {}) });
  }, [open, profile, form]);

  const sections = useMemo(() => groupSections(manifest), [manifest]);

  const setModuleLevel = (key: string, level: PermLevel) =>
    setPerms((prev) => ({ ...prev, [key]: levelToActions(level) }));

  const setSectionLevel = (section: Section, level: PermLevel) =>
    setPerms((prev) => {
      const next = { ...prev };
      for (const m of section.modules) next[m.key] = levelToActions(level);
      return next;
    });

  const save = async () => {
    let values: { name: string; description?: string };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const body = { ...values, module_permissions: perms };
      if (isEdit) await profilesVS.update({ id: profile.id, body });
      else await profilesVS.create({ body });
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

  const resetToDefault = async () => {
    if (!isEdit) return;
    try {
      const updated = (await profilesVS.action({ id: profile.id, action: "reset-permissions" })) as Profile;
      setPerms({ ...updated.module_permissions });
      message.success(i18n.t("access.resetDone", { defaultValue: "已重置为默认权限" }));
      onSaved(); // reset is a server-side mutation → refresh list + /me
    } catch {
      message.error(i18n.t("access.resetFailed", { defaultValue: "重置失败" }));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 560 } }}
      destroyOnHidden
      title={
        <Space>
          {isEdit
            ? i18n.t("access.editProfile", { defaultValue: "编辑权限方案" })
            : i18n.t("access.newProfile", { defaultValue: "新建权限方案" })}
          {profile?.is_system && <Tag color="gold">{i18n.t("access.system", { defaultValue: "系统" })}</Tag>}
        </Space>
      }
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Reset only applies to seeded system profiles; resetting a custom one would clobber it to Staff. */}
          {isEdit && profile?.is_system
            ? <Button onClick={resetToDefault}>{i18n.t("access.resetDefault", { defaultValue: "重置为默认" })}</Button>
            : <span />}
          <Space>
            <Button onClick={onClose}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
            <Button type="primary" loading={saving} onClick={save}>{i18n.t("account.save", { defaultValue: "保存" })}</Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={i18n.t("access.profileName", { defaultValue: "方案名称" })}
          rules={[{ required: true, message: i18n.t("account.required", { defaultValue: "必填" }) }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label={i18n.t("access.description", { defaultValue: "描述" })}>
          <Input />
        </Form.Item>
      </Form>

      <Typography.Title level={5} style={{ marginTop: 8 }}>
        {i18n.t("access.modulePermissions", { defaultValue: "模块权限" })}
      </Typography.Title>

      {sections.map((sec) => (
        <div key={sec.section} style={{ marginBottom: 8 }}>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 0", borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Typography.Text strong type="secondary" style={{ textTransform: "uppercase", fontSize: 12, letterSpacing: 0.5 }}>
              {sec.section}
            </Typography.Text>
            <Select
              size="small"
              style={{ width: 120 }}
              placeholder={i18n.t("access.setAll", { defaultValue: "全部设为" })}
              value={undefined}
              options={levelOptions()}
              onChange={(lvl: PermLevel) => setSectionLevel(sec, lvl)}
            />
          </div>
          {sec.modules.map((m) => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
              <Typography.Text>{m.label}</Typography.Text>
              <Select
                size="small"
                style={{ width: 150 }}
                value={actionsToLevel(perms[m.key])}
                options={levelOptions()}
                onChange={(lvl: PermLevel) => setModuleLevel(m.key, lvl)}
              />
            </div>
          ))}
        </div>
      ))}
    </Drawer>
  );
}
