import { type ReactNode } from "react";
import { Typography } from "antd";

/** Container for a detail-page tab pane: 4px top so every pane starts level
 *  when switching tabs (across all modules), 24px bottom breathing room, and a
 *  960px reading-width cap. Spread and override for intentionally narrower
 *  panes (e.g. payments uses maxWidth 720). */
export const TAB_PANE_STYLE = { padding: "4px 0 24px", maxWidth: 960 } as const;

/** Bold section heading shared by every detail page (info panels and tab panes),
 *  so all sections title at the same 13px weight. `first` drops the top margin
 *  so a leading heading sits flush with its container. */
export function SectionLabel({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <Typography.Text strong style={{ display: "block", fontSize: 13, margin: first ? "0 0 8px" : "18px 0 8px" }}>
      {children}
    </Typography.Text>
  );
}

/** A labelled value (label above value) in the basic-info panel. */
export function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  const isEmpty = value == null || value === "";
  return (
    <div style={{ marginBottom: 14 }}>
      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 2 }}>
        {label}
      </Typography.Text>
      {isEmpty ? <Typography.Text type="secondary">—</Typography.Text> : <span style={{ fontSize: 14 }}>{value}</span>}
    </div>
  );
}
