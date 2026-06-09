import { useMemo, useState } from "react";
import { Menu, Modal, Typography, theme } from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  SafetyOutlined,
  BankOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { Slot, useRouter, useSegments } from "expo-router";
import type { Href } from "expo-router";
import { useAuthStore, useActiveMembership, useIsActiveAdmin } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { colors } from "@/constants/theme";
import { HEADER_HEIGHT, ITEM_ROUTES } from "@/components/modules/layout/constants";
import { hover } from "@/components/modules/layout/hover";
import { HeaderActions } from "@/components/modules/layout/HeaderActions";
import { OrgDrawer } from "@/components/modules/layout/OrgDrawer";
import { UserDrawer } from "@/components/modules/layout/UserDrawer";
import { OrgCreateForm } from "@/components/modules/layout/OrgCreateForm";
import i18n from "@/locale/i18n";

const NAV_WIDTH = 220;

// One entry per settings section (ERP-style left sub-nav). adminOnly entries are
// hidden from non-admin members (the backend gates the APIs the same way).
const SECTIONS = [
  {
    key: "general",
    route: "/(settings)/general",
    icon: UserOutlined,
    label: () => i18n.t("settings.general", { defaultValue: "基础设置" }),
  },
  {
    key: "security",
    route: "/(settings)/security",
    icon: SafetyOutlined,
    label: () => i18n.t("settings.security", { defaultValue: "安全设置" }),
  },
  {
    key: "organizations",
    route: "/(settings)/organizations",
    icon: BankOutlined,
    label: () => i18n.t("settings.organizations", { defaultValue: "我的机构" }),
  },
  {
    key: "addresses",
    route: "/(settings)/addresses",
    icon: EnvironmentOutlined,
    label: () => i18n.t("settings.addresses", { defaultValue: "地址簿" }),
  },
  {
    key: "credit-periods",
    route: "/(settings)/credit-periods",
    icon: FieldTimeOutlined,
    label: () => i18n.t("settings.creditPeriods", { defaultValue: "账期设置" }),
  },
  {
    key: "product-attributes",
    route: "/(settings)/product-attributes",
    icon: TagsOutlined,
    adminOnly: true,
    label: () => i18n.t("settings.productAttributes", { defaultValue: "规格属性" }),
  },
  {
    key: "access",
    route: "/(settings)/access",
    icon: TeamOutlined,
    adminOnly: true,
    label: () => i18n.t("settings.access", { defaultValue: "用户与权限" }),
  },
];

export default function SettingsLayout() {
  const locale = useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const setActiveOrg = useAuthStore((s) => s.setActiveOrg);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const segments = useSegments();
  const { token } = theme.useToken();

  const [orgDrawerOpen, setOrgDrawerOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const memberships = user?.memberships ?? [];
  const activeMembership = useActiveMembership();
  const isAdmin = useIsActiveAdmin();
  const orgName = activeMembership?.organization.name ?? "SeaCube";
  const displayName = user?.first_name
    ? [user.first_name, user.last_name].filter(Boolean).join(" ")
    : (user?.username ?? "");

  // The section is the segment after "(settings)" (e.g. .../(settings)/security).
  const selected = useMemo(() => {
    const segs = segments as string[];
    const i = segs.findIndex((s) => s.replace(/[()]/g, "") === "settings");
    return segs[i + 1] ?? "general";
  }, [segments]);

  const items = useMemo(
    () =>
      SECTIONS.filter((s) => !(s as { adminOnly?: boolean }).adminOnly || isAdmin).map((s) => ({
        key: s.key,
        icon: <s.icon />,
        label: s.label(),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, isAdmin],
  );

  // Settings is a full-screen takeover (sibling of the app shell), so it owns
  // its own top bar. Back returns to wherever the user came from, falling back
  // to the dashboard on a cold deep-link.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(ITEM_ROUTES.dashboard as Href);
  };

  // Switching org re-scopes the whole settings section; the content is keyed by
  // activeOrgId below so the active page (and its tabs) remount and refetch.
  const handleSwitchOrg = (id: number) => {
    setOrgDrawerOpen(false);
    setActiveOrg(id);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: token.colorBgLayout }}>
      <div
        style={{
          height: HEADER_HEIGHT,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px 0 16px",
          background: colors.primary,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            onClick={goBack}
            title={i18n.t("common.back", { defaultValue: "返回" })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 10px",
              borderRadius: 6,
              cursor: "pointer",
              color: "rgba(255,255,255,0.9)",
              fontSize: 14,
              transition: "background 0.15s",
            }}
            {...hover({ background: "rgba(255,255,255,0.12)" }, { background: "transparent" })}
          >
            <ArrowLeftOutlined />
            {i18n.t("common.back", { defaultValue: "返回" })}
          </div>
          <Typography.Text strong style={{ color: "#fff", fontSize: 16 }}>
            {i18n.t("nav.settings", { defaultValue: "设置" })}
          </Typography.Text>
        </div>

        <HeaderActions
          orgName={orgName}
          displayName={displayName}
          onOrgClick={() => setOrgDrawerOpen(true)}
          onUserClick={() => setUserDrawerOpen(true)}
        />
      </div>

      <div style={{ flex: 1, display: "flex", minWidth: 0, minHeight: 0 }}>
        <div
          style={{
            width: NAV_WIDTH,
            flexShrink: 0,
            background: token.colorBgContainer,
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
            overflowY: "auto",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selected]}
            items={items}
            style={{ borderInlineEnd: 0, paddingTop: 8 }}
            onSelect={({ key }) => {
              const section = SECTIONS.find((s) => s.key === key);
              if (section) router.replace(section.route as Href);
            }}
          />
        </div>

        {/* Keyed by org so switching reloads the active section for the new org. */}
        <div key={activeOrgId ?? "no-org"} style={{ flex: 1, minWidth: 0, overflowX: "hidden", overflowY: "auto" }}>
          <Slot />
        </div>
      </div>

      <OrgDrawer
        open={orgDrawerOpen}
        onClose={() => setOrgDrawerOpen(false)}
        memberships={memberships}
        activeOrgId={activeOrgId}
        onSwitch={handleSwitchOrg}
        onCreateOrg={() => {
          setOrgDrawerOpen(false);
          setCreateOrgOpen(true);
        }}
      />

      <UserDrawer
        open={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        displayName={displayName}
        email={user?.email ?? ""}
        username={user?.username}
        onLogout={() => {
          setUserDrawerOpen(false);
          logout();
        }}
        onSettings={() => {
          setUserDrawerOpen(false);
          router.replace("/(settings)/general" as Href);
        }}
      />

      <Modal
        open={createOrgOpen}
        onCancel={() => setCreateOrgOpen(false)}
        footer={null}
        destroyOnHidden
        title={i18n.t("org.new", { defaultValue: "新建机构" })}
      >
        <OrgCreateForm
          onCreated={(id) => {
            setCreateOrgOpen(false);
            setActiveOrg(id);
          }}
        />
      </Modal>
    </div>
  );
}
