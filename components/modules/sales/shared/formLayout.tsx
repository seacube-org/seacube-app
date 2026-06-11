import { useState, type ReactNode } from "react";
import { theme } from "antd";
import { DownOutlined } from "@ant-design/icons";

/**
 * Form section with a Zoho-style underlined title. `collapsible` sections toggle
 * via the header; collapsed content stays mounted (display:none) so Form fields
 * remain registered.
 */
export function Section({
  title,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { token } = theme.useToken();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 0 8px",
          marginBottom: 16,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          cursor: collapsible ? "pointer" : undefined,
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        {collapsible && (
          <DownOutlined rotate={open ? 0 : -90} style={{ fontSize: 11, color: token.colorTextTertiary }} />
        )}
      </div>
      <div style={{ display: open ? undefined : "none" }}>{children}</div>
    </div>
  );
}
