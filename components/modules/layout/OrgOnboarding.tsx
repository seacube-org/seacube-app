import { Button, Divider, Typography } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { colors } from "@/constants/theme";
import i18n from "@/locale/i18n";
import { useAuthStore } from "@/stores/authStore";
import { OrgCreateForm } from "./OrgCreateForm";

type Props = {
  onCreated: (orgId: number) => void;
};

/**
 * Full-screen first-run onboarding shown when the signed-in user belongs to no
 * organization yet (à la Zoho Books' "Set up your organization"). The only way
 * forward is to create the first org, which makes the user its admin.
 */
export function OrgOnboarding({ onCreated }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 440,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          padding: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <Typography.Text strong style={{ fontSize: 18 }}>
            SeaCube ERP
          </Typography.Text>
        </div>

        <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
          {i18n.t("org.onboardingTitle", { defaultValue: "创建您的机构" })}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          {i18n.t("org.onboardingSubtitle", {
            defaultValue: "您还没有加入任何机构。先创建一个机构即可开始使用，您将成为该机构的管理员。",
          })}
        </Typography.Paragraph>

        <OrgCreateForm onCreated={onCreated} submitLabel={i18n.t("org.getStarted", { defaultValue: "开始使用" })} />

        {/* Escape hatch: a failed setup or wrong account shouldn't trap the user here. */}
        <Divider style={{ margin: "16px 0 8px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography.Text type="secondary" style={{ fontSize: 12, wordBreak: "break-all" }}>
            {user?.email || user?.username}
          </Typography.Text>
          <Button
            type="link"
            size="small"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{ paddingRight: 0 }}
          >
            {i18n.t("auth.logout", { defaultValue: "退出登录" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
