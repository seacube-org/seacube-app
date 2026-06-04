import { type ReactNode } from "react";
import { Button, Card } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";

/** A single row of a Form.List, rendered as a compact antd Card with a title and remove action. */
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
    <Card
      size="small"
      title={title}
      extra={<Button type="text" size="small" danger icon={<MinusCircleOutlined />} onClick={onRemove} />}
      style={{ marginBottom: 12 }}
    >
      {children}
    </Card>
  );
}
