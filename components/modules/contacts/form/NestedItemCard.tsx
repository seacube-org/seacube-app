import { type ReactNode } from "react";
import { Button, Typography } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";

/** Bordered card with a "<title>" header + remove button — one row of a Form.List. */
export default function NestedItemCard({
  title,
  onRemove,
  children,
}: {
  title: ReactNode;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Typography.Text type="secondary">{title}</Typography.Text>
        <Button type="text" size="small" danger icon={<MinusCircleOutlined />} onClick={onRemove} />
      </div>
      {children}
    </div>
  );
}
