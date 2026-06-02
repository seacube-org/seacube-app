import { Typography } from "antd";

type Props = {
  label: string;
  value?: string | null;
};

/** Label / value pair used inside the header drawers. */
export function InfoRow({ label, value }: Props) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 0" }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 14 }}>{value}</Typography.Text>
    </div>
  );
}
