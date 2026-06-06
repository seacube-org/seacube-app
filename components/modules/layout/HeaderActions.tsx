import { Avatar, Typography } from "antd";
import { BankOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import { hover } from "./hover";

const DIVIDER = { width: 1, height: 20, background: "rgba(255,255,255,0.25)", margin: "0 4px" } as const;

type Props = {
  orgName: string;
  displayName: string;
  onOrgClick: () => void;
  onUserClick: () => void;
  /** When set, render the settings gear before the org badge (app shell only). */
  onSettings?: () => void;
};

/**
 * Right-side header cluster shared by the app shell ({@link AppHeader}) and the
 * settings header: an optional settings gear, the org badge, and the user
 * avatar. Lives on a primary-coloured bar, so all colours are white-on-primary.
 */
export function HeaderActions({ orgName, displayName, onOrgClick, onUserClick, onSettings }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 8 }}>
      {onSettings && (
        <>
          <div
            onClick={onSettings}
            title={i18n.t("nav.settings", { defaultValue: "设置" })}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: 6,
              color: "rgba(255,255,255,0.75)",
              fontSize: 16,
              transition: "background 0.15s, color 0.15s",
            }}
            {...hover(
              { background: "rgba(255,255,255,0.12)", color: "#fff" },
              { background: "transparent", color: "rgba(255,255,255,0.75)" },
            )}
          >
            <SettingOutlined />
          </div>
          <div style={DIVIDER} />
        </>
      )}

      {/* Org badge */}
      <div
        onClick={onOrgClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px",
          height: 30,
          borderRadius: 6,
          background: "transparent",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        {...hover({ background: "rgba(255,255,255,0.12)" }, { background: "transparent" })}
      >
        <BankOutlined style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }} />
        <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}>
          {orgName}
        </Typography.Text>
        <DownOutlined style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }} />
      </div>

      <div style={DIVIDER} />

      {/* Avatar */}
      <div
        onClick={onUserClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          padding: "0 8px",
          height: "100%",
          borderRadius: 6,
        }}
        {...hover({ background: "rgba(255,255,255,0.1)" }, { background: "transparent" })}
      >
        <Typography.Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{displayName}</Typography.Text>
        <Avatar size={28} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, fontSize: 12 }}>
          {displayName[0]?.toUpperCase() ?? "?"}
        </Avatar>
      </div>
    </div>
  );
}
