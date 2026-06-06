import { Avatar, Button, Divider, Drawer, Typography } from "antd";
import { LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { colors } from "@/constants/theme";
import i18n from "@/locale/i18n";
import { InfoRow } from "./InfoRow";

type Props = {
  open: boolean;
  onClose: () => void;
  displayName: string;
  email: string;
  username?: string;
  onLogout: () => void;
  onSettings: () => void;
};

export function UserDrawer({ open, onClose, displayName, email, username, onLogout, onSettings }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      title={i18n.t("user.account", { defaultValue: "我的账户" })}
      styles={{ wrapper: { width: 340 }, body: { display: "flex", flexDirection: "column" } }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Avatar
          size={56}
          style={{ background: colors.primary, color: "#fff", fontWeight: 700, fontSize: 22, flexShrink: 0 }}
        >
          {displayName[0]?.toUpperCase() ?? "?"}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <Typography.Text strong style={{ display: "block", fontSize: 16 }}>
            {displayName}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13, wordBreak: "break-all" }}>
            {email}
          </Typography.Text>
        </div>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {username && <InfoRow label={i18n.t("user.username", { defaultValue: "用户名" })} value={username} />}
      <InfoRow label={i18n.t("user.email", { defaultValue: "邮箱" })} value={email} />

      <div style={{ flex: 1 }} />

      <Button block icon={<SettingOutlined />} onClick={onSettings} style={{ marginBottom: 10 }}>
        {i18n.t("nav.settings", { defaultValue: "设置" })}
      </Button>
      <Button block danger icon={<LogoutOutlined />} onClick={onLogout}>
        {i18n.t("auth.logout", { defaultValue: "退出" })}
      </Button>
    </Drawer>
  );
}
