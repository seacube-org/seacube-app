import { Layout, Avatar, Typography } from "antd";
import { SettingOutlined, BankOutlined, DownOutlined } from "@ant-design/icons";
import { colors } from "@/constants/theme";
import i18n from "@/locale/i18n";
import { HEADER_HEIGHT, SIDER_WIDTH, SIDER_COLLAPSED_WIDTH } from "./constants";
import { hover } from "./hover";

type Props = {
  collapsed: boolean;
  displayName: string;
  orgName: string;
  onSettings: () => void;
  onUserClick: () => void;
  onOrgClick: () => void;
};

export function AppHeader({ collapsed, displayName, orgName, onSettings, onUserClick, onOrgClick }: Props) {
  return (
    <Layout.Header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 0,
        background: colors.primary,
        height: HEADER_HEIGHT,
        lineHeight: `${HEADER_HEIGHT}px`,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 20px",
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.2s",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {!collapsed && (
          <Typography.Text style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginLeft: 8, whiteSpace: "nowrap" }}>
            SeaCube ERP
          </Typography.Text>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 8 }}>
        {/* Settings */}
        <div
          onClick={onSettings}
          title={i18n.t("nav.settings", { defaultValue: "设置" })}
          style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", borderRadius: 6, color: "rgba(255,255,255,0.75)", fontSize: 16,
            transition: "background 0.15s, color 0.15s",
          }}
          {...hover(
            { background: "rgba(255,255,255,0.12)", color: "#fff" },
            { background: "transparent", color: "rgba(255,255,255,0.75)" },
          )}
        >
          <SettingOutlined />
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)", margin: "0 4px" }} />

        {/* Org badge */}
        <div
          onClick={onOrgClick}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 10px", height: 30, borderRadius: 6,
            background: "transparent", cursor: "pointer",
            transition: "background 0.15s",
          }}
          {...hover(
            { background: "rgba(255,255,255,0.12)" },
            { background: "transparent" },
          )}
        >
          <BankOutlined style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }} />
          <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}>
            {orgName}
          </Typography.Text>
          <DownOutlined style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }} />
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)", margin: "0 4px" }} />

        {/* Avatar */}
        <div
          onClick={onUserClick}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", padding: "0 8px", height: "100%", borderRadius: 6,
          }}
          {...hover(
            { background: "rgba(255,255,255,0.1)" },
            { background: "transparent" },
          )}
        >
          <Typography.Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
            {displayName}
          </Typography.Text>
          <Avatar
            size={28}
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, fontSize: 12 }}
          >
            {displayName[0]?.toUpperCase() ?? "?"}
          </Avatar>
        </div>
      </div>
    </Layout.Header>
  );
}
