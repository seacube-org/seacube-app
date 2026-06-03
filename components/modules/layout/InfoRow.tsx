import type { ReactNode } from "react";
import { Typography } from "antd";

type Props = {
  label: string;
  value?: ReactNode;
  /** When set, an empty value renders this placeholder instead of hiding the row. */
  placeholder?: string;
};

/** Label / value pair used inside the header and settings drawers. */
export function InfoRow({ label, value, placeholder }: Props) {
  const isEmpty = value == null || value === "";
  if (isEmpty && placeholder == null) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 0" }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 14 }} type={isEmpty ? "secondary" : undefined}>
        {isEmpty ? placeholder : value}
      </Typography.Text>
    </div>
  );
}
