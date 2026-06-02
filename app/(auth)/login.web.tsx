import { useEffect, useState } from "react";
import { Form, Input, Button, Checkbox, Alert, Typography, theme } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/services/DataService";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import { colors } from "@/constants/theme";
import { storageGet, storageSet, storageDel } from "@/utils/storage";

const REMEMBER_KEY = "seacube_remember";

type FormValues = { username: string; password: string; remember: boolean };

export default function LoginScreen() {
  useLocaleStore((s) => s.locale);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const { token } = theme.useToken();
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    storageGet(REMEMBER_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as { username: string };
        form.setFieldsValue({ username: saved.username, remember: true });
      } catch {
        /* ignore malformed */
      }
    });
  }, [form]);

  const handleLogin = async ({ username, password, remember }: FormValues) => {
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      if (remember) {
        await storageSet(REMEMBER_KEY, JSON.stringify({ username }));
      } else {
        await storageDel(REMEMBER_KEY);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401)
        setError(i18n.t("auth.loginError.invalid"));
      else setError(i18n.t("auth.loginError.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.background,
      }}
    >
      <div
        style={{
          width: 400,
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowSecondary,
          padding: "48px 40px 40px",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: colors.primary,
              marginBottom: 16,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <Typography.Title level={4} style={{ margin: 0, color: token.colorText }}>
            SeaCube ERP
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            {i18n.t("auth.signInPrompt")}
          </Typography.Text>
        </div>

        {error && (
          <Alert
            title={error}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: token.borderRadius }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="username"
            label={i18n.t("auth.username")}
            rules={[{ required: true, message: "" }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={
                <UserOutlined style={{ color: token.colorTextTertiary }} />
              }
              placeholder={i18n.t("auth.username")}
              autoComplete="username"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={i18n.t("auth.password")}
            rules={[{ required: true, message: "" }]}
            style={{ marginBottom: 16 }}
          >
            <Input.Password
              prefix={
                <LockOutlined style={{ color: token.colorTextTertiary }} />
              }
              placeholder={i18n.t("auth.password")}
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="remember"
            valuePropName="checked"
            style={{ marginBottom: 24 }}
          >
            <Checkbox>{i18n.t("auth.rememberMe")}</Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, fontSize: 15 }}
            >
              {i18n.t("auth.loginButton")}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
