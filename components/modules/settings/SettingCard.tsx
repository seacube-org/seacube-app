import type { ReactNode } from "react";
import { Card, Typography } from "antd";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned action/control (button, switch, select…). */
  extra?: ReactNode;
  /** Optional body rendered below the title/description row. */
  children?: ReactNode;
  /** When set, the whole card becomes clickable (hover affordance + handler). */
  onClick?: () => void;
};

/**
 * Full-width settings row card (Zoho/Stripe-style): title + description on the
 * left, an action on the right, with an optional body underneath. Pages stack
 * these in a single column.
 */
export function SettingCard({ title, description, extra, children, onClick }: Props) {
  return (
    <Card
      hoverable={onClick != null}
      onClick={onClick}
      style={{
        marginBottom: 16,
        borderRadius: 10,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
      }}
      styles={{ body: { padding: "22px 28px" } }}
    >
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {description != null && (
            <Typography.Paragraph type="secondary" style={{ margin: "6px 0 0", maxWidth: 680 }}>
              {description}
            </Typography.Paragraph>
          )}
        </div>
        {extra != null && <div style={{ flexShrink: 0 }}>{extra}</div>}
      </div>
      {children != null && <div style={{ marginTop: 20 }}>{children}</div>}
    </Card>
  );
}
