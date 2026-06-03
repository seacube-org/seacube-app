import { Layout, Typography } from "antd";
import { colors } from "@/constants/theme";
import { HEADER_HEIGHT, SIDER_WIDTH, SIDER_COLLAPSED_WIDTH } from "./constants";
import { HeaderActions } from "./HeaderActions";

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
      <HeaderActions
        orgName={orgName}
        displayName={displayName}
        onOrgClick={onOrgClick}
        onUserClick={onUserClick}
        onSettings={onSettings}
      />
    </Layout.Header>
  );
}
