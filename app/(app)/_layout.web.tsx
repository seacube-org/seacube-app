import { useMemo, useState } from "react";
import { Layout, Menu, Modal, theme } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Slot, useRouter, useSegments } from "expo-router";
import type { Href } from "expo-router";
import { useAuthStore, useActiveMembership, useIsActiveAdmin } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { AppHeader } from "@/components/modules/layout/AppHeader";
import { UserDrawer } from "@/components/modules/layout/UserDrawer";
import { OrgDrawer } from "@/components/modules/layout/OrgDrawer";
import { OrgOnboarding } from "@/components/modules/layout/OrgOnboarding";
import { OrgCreateForm } from "@/components/modules/layout/OrgCreateForm";
import { useMenuItems } from "@/components/modules/layout/useMenuItems";
import { SIDER_WIDTH, SIDER_COLLAPSED_WIDTH, ITEM_ROUTES, PAGE_TO_KEY } from "@/components/modules/layout/constants";
import i18n from "@/locale/i18n";

export default function WebAppLayout() {
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const segments = useSegments();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const setActiveOrg = useAuthStore((s) => s.setActiveOrg);
  const { token } = theme.useToken();

  const memberships = user?.memberships ?? [];
  const activeMembership = useActiveMembership();
  const activeOrgName = activeMembership?.organization.name ?? "SeaCube";
  // Permissions are per-organization: drive the menu from the active membership's profile.
  const perms = activeMembership?.profile?.module_permissions;
  // is_staff / superuser / active ADMIN role bypass profile checks on the backend,
  // so they get the full menu even when the membership profile is null.
  const elevated = useIsActiveAdmin();

  const [collapsed, setCollapsed] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [orgDrawerOpen, setOrgDrawerOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [userOpenKeys, setUserOpenKeys] = useState<string[]>([]);

  const activateOrg = (id: number) => {
    setActiveOrg(id);
    // All screens fetch imperatively; remounting via the Slot key (activeOrgId)
    // re-runs their effects so data reloads for the new org.
    router.replace(ITEM_ROUTES.dashboard as Href);
  };

  const handleSwitchOrg = (id: number) => {
    setOrgDrawerOpen(false);
    activateOrg(id);
  };

  const { selectedKeys, activeModule } = useMemo(() => {
    const segs = segments as string[];
    const mod = segs[1]?.replace(/[()]/g, "");
    const page = segs[2];
    if (!mod) return { selectedKeys: ["dashboard"], activeModule: null };
    // A dynamic detail segment (e.g. (contacts)/[id]) still belongs to its module,
    // so keep the parent menu item highlighted instead of de-selecting everything.
    if (!page || page.startsWith("[")) return { selectedKeys: [mod], activeModule: mod };
    return { selectedKeys: [PAGE_TO_KEY[page] ?? page], activeModule: mod };
  }, [segments]);

  const openKeys = useMemo(() => {
    const keys = new Set(userOpenKeys);
    if (activeModule) keys.add(activeModule);
    return [...keys];
  }, [userOpenKeys, activeModule]);

  const menuItems = useMenuItems(locale, perms, elevated);

  const displayName = user?.first_name
    ? [user.first_name, user.last_name].filter(Boolean).join(" ")
    : (user?.username ?? "");

  const handleSettings = () => {
    setUserDrawerOpen(false);
    router.push(ITEM_ROUTES.settings as Href);
  };

  // First-run: a signed-in user with no organization must create one first.
  if (user && memberships.length === 0) {
    return <OrgOnboarding onCreated={activateOrg} />;
  }

  return (
    <Layout style={{ height: "100vh" }}>
      <AppHeader
        collapsed={collapsed}
        displayName={displayName}
        orgName={activeOrgName}
        onSettings={handleSettings}
        onUserClick={() => setUserDrawerOpen(true)}
        onOrgClick={() => setOrgDrawerOpen(true)}
      />

      <UserDrawer
        open={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        displayName={displayName}
        email={user?.email ?? ""}
        username={user?.username}
        onLogout={() => { setUserDrawerOpen(false); logout(); }}
        onSettings={handleSettings}
      />

      <OrgDrawer
        open={orgDrawerOpen}
        onClose={() => setOrgDrawerOpen(false)}
        memberships={memberships}
        activeOrgId={activeOrgId}
        onSwitch={handleSwitchOrg}
        onCreateOrg={() => { setOrgDrawerOpen(false); setCreateOrgOpen(true); }}
      />

      <Modal
        open={createOrgOpen}
        onCancel={() => setCreateOrgOpen(false)}
        footer={null}
        destroyOnHidden
        title={i18n.t("org.new", { defaultValue: "新建机构" })}
      >
        <OrgCreateForm
          onCreated={(id) => { setCreateOrgOpen(false); activateOrg(id); }}
        />
      </Modal>

      <Layout hasSider style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}>
        <Layout.Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          width={SIDER_WIDTH}
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
          theme="light"
          trigger={null}
          style={{
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <Menu
                mode="inline"
                theme="light"
                selectedKeys={selectedKeys}
                openKeys={collapsed ? [] : openKeys}
                onOpenChange={(keys) => setUserOpenKeys(keys as string[])}
                onSelect={({ key }) => {
                  const route = ITEM_ROUTES[key];
                  if (route) router.push(route as Href);
                }}
                items={menuItems}
                style={{ borderInlineEnd: 0 }}
              />
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? i18n.t("common.expand", { defaultValue: "展开" }) : i18n.t("common.collapse", { defaultValue: "收起" })}
              style={{
                height: 38,
                width: "100%",
                flexShrink: 0,
                border: 0,
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgContainer,
                color: token.colorTextSecondary,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </div>
        </Layout.Sider>

        <Layout.Content
          key={activeOrgId ?? "no-org"}
          style={{
            display: "flex",
            minWidth: 0,
            minHeight: 0,
            background: token.colorBgLayout,
            overflowY: "auto",
          }}
        >
          <Slot />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
