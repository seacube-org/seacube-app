import { type ReactNode } from "react";
import { Button, Card, Space } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, MinusCircleOutlined } from "@ant-design/icons";

/**
 * A single row of a Form.List, rendered as a compact antd Card with a title and a
 * remove action. Pass `onMoveUp` / `onMoveDown` to also show reorder arrows
 * (omit a handler to disable that direction — e.g. the first/last row).
 */
export default function NestedItemCard({
  title,
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}: {
  title: ReactNode;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: ReactNode;
}) {
  const reorderable = onMoveUp !== undefined || onMoveDown !== undefined;
  return (
    <Card
      size="small"
      title={title}
      extra={
        <Space size={2}>
          {reorderable && (
            <>
              <Button
                type="text"
                size="small"
                icon={<ArrowUpOutlined />}
                disabled={!onMoveUp}
                onClick={onMoveUp}
                aria-label="move up"
              />
              <Button
                type="text"
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={!onMoveDown}
                onClick={onMoveDown}
                aria-label="move down"
              />
            </>
          )}
          <Button
            type="text"
            size="small"
            danger
            icon={<MinusCircleOutlined />}
            onClick={onRemove}
            aria-label="remove"
          />
        </Space>
      }
      style={{ marginBottom: 12 }}
    >
      {children}
    </Card>
  );
}
