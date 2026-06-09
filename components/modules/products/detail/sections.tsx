import { type ReactNode } from "react";
import { Typography } from "antd";

/** Bold section heading inside the detail panels (matches the contacts detail).
 *  `first` drops the top margin so a leading heading sits flush with its container. */
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
