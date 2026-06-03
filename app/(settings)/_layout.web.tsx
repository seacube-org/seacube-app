import { useMemo } from "react";
import { Menu, Typography, theme } from "antd";
import { ArrowLeftOutlined, UserOutlined, SafetyOutlined, BankOutlined } from "@ant-design/icons";
import { Slot, useRouter, useSegments } from "expo-router";
import type { Href } from "expo-router";
import { useLocaleStore } from "@/stores/localeStore";
import { colors } from "@/constants/theme";
import { HEADER_HEIGHT, ITEM_ROUTES } from "@/components/modules/layout/constants";
import { hover } from "@/components/modules/layout/hover";
import i18n from "@/locale/i18n";

const NAV_WIDTH = 220;

// One entry per settings section (ERP-style left sub-nav).
const SECTIONS = [
  { key: "general", route: "/(settings)/general", icon: UserOutlined, label: () => i18n.t("settings.general", { defaultValue: "基础设置" }) },
  { key: "security", route: "/(settings)/security", icon: SafetyOutlined, label: () => i18n.t("settings.security", { defaultValue: "安全设置" }) },
  { key: "organizations", route: "/(settings)/organizations", icon: BankOutlined, label: () => i18n.t("settings.organizations", { defaultValue: "我的机构" }) },
];

export default function SettingsLayout() {
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const segments = useSegments();
  const { token } = theme.useToken();

  // The section is the segment after "(settings)" (e.g. .../(settings)/security).
  const selected = useMemo(() => {
    const segs = segments as string[];
    const i = segs.findIndex((s) => s.replace(/[()]/g, "") === "settings");
    return segs[i + 1] ?? "general";
  }, [segments]);

  const items = useMemo(
    () => SECTIONS.map((s) => ({ key: s.key, icon: <s.icon />, label: s.label() })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  // Settings is a full-screen takeover (sibling of the app shell), so it owns
  // its own top bar. Back returns to wherever the user came from, falling back
  // to the dashboard on a cold deep-link.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(ITEM_ROUTES.dashboard as Href);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: token.colorBgLayout }}>
      <div
        style={{
          height: HEADER_HEIGHT,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          background: colors.primary,
        }}
      >
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

        <div style={{ flex: 1, minWidth: 0, overflowX: "hidden", overflowY: "auto" }}>
          <Slot />
        </div>
      </div>
    </div>
  );
}
