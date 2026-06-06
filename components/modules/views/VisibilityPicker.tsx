import type { ReactNode } from "react";
import { Tooltip, theme } from "antd";
import { CheckCircleFilled, GlobalOutlined, LockOutlined, TeamOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import type { Visibility } from "./types";

type Props = {
  value: Visibility;
  /** Only admins may share a view with the org. */
  canShare: boolean;
  onChange: (v: Visibility) => void;
};

// Card key — "users" mirrors Zoho's "selected users & roles" tier, which the
// backend doesn't model yet (SavedView.Visibility note), so it's shown disabled.
type CardKey = Visibility | "users";

type Card = {
  key: CardKey;
  icon: ReactNode;
  label: string;
  hint: string;
};

/**
 * Zoho-style "who can see this view" picker. Three tiers stacked vertically to
 * fit the narrow filter drawer. `private`/`shared` map to the backend Visibility;
 * the middle "selected users & roles" tier is a disabled placeholder for now.
 */
export default function VisibilityPicker({ value, canShare, onChange }: Props) {
  const { token } = theme.useToken();

  const cards: Card[] = [
    {
      key: "private",
      icon: <LockOutlined />,
      label: i18n.t("views.visOnlyMe", { defaultValue: "仅限我" }),
      hint: i18n.t("views.visOnlyMeHint", { defaultValue: "只有你能看到此视图" }),
    },
    {
      key: "users",
      icon: <TeamOutlined />,
      label: i18n.t("views.visSelected", { defaultValue: "只有选定的用户及角色" }),
      hint: i18n.t("views.comingSoon", { defaultValue: "即将推出" }),
    },
    {
      key: "shared",
      icon: <GlobalOutlined />,
      label: i18n.t("views.visEveryone", { defaultValue: "每个人" }),
      hint: i18n.t("views.visEveryoneHint", { defaultValue: "机构所有成员都能看到此视图" }),
    },
  ];

  const isDisabled = (key: CardKey) => key === "users" || (key === "shared" && !canShare);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {cards.map((c) => {
        const disabled = isDisabled(c.key);
        const selected = c.key === value;
        const card = (
          <div
            key={c.key}
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            onClick={() => {
              if (!disabled && c.key !== "users") onChange(c.key as Visibility);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              border: `1.5px solid ${selected ? token.colorPrimary : token.colorBorderSecondary}`,
              background: selected ? token.controlItemBgActive : token.colorBgContainer,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.55 : 1,
              transition: "border-color .12s, background .12s",
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 7,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: selected ? token.colorPrimary : token.colorFillTertiary,
                color: selected ? "#fff" : token.colorTextSecondary,
                fontSize: 15,
              }}
            >
              {c.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: token.colorText, lineHeight: 1.3 }}>{c.label}</div>
              <div style={{ fontSize: 11.5, color: token.colorTextTertiary, lineHeight: 1.3 }}>{c.hint}</div>
            </div>
            {selected && <CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 16, flexShrink: 0 }} />}
          </div>
        );

        // Explain why sharing is locked for non-admins.
        if (c.key === "shared" && !canShare) {
          return (
            <Tooltip key={c.key} title={i18n.t("views.shareAdminOnly", { defaultValue: "仅管理员可共享视图" })}>
              {card}
            </Tooltip>
          );
        }
        return card;
      })}
    </div>
  );
}
