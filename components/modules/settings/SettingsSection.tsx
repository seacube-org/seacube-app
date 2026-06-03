import type { ReactNode } from "react";
import { Typography } from "antd";

type Props = {
  title: string;
  children: ReactNode;
};

/**
 * Page container for a settings section: large heading + a single column of
 * full-width cards. Cards span the content area; spacing comes from this
 * container's padding (side gutters) and each card's marginBottom (vertical
 * gaps). No explicit width/box-sizing — preflight is off, so width:100% + padding
 * would overflow and produce a horizontal scrollbar.
 */
export function SettingsSection({ title, children }: Props) {
  return (
    <div style={{ padding: "28px 40px 40px" }}>
      <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>
        {title}
      </Typography.Title>
      {children}
    </div>
  );
}
