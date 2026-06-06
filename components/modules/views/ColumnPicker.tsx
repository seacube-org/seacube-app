import { useState } from "react";
import { Checkbox, Typography, theme } from "antd";
import { HolderOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";

export type ColumnOption = { key: string; label: string };

type Props = {
  allColumns: ColumnOption[];
  value: string[]; // ordered selected keys
  onChange: (keys: string[]) => void;
};

/**
 * Pick + order the visible columns. Selected columns are shown first in their
 * chosen order — drag by the handle to reorder; unchecking moves a column back
 * to the available list. Drag uses native HTML5 DnD (web-only filter drawer).
 */
export default function ColumnPicker({ allColumns, value, onChange }: Props) {
  const { token } = theme.useToken();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const labelOf = (key: string) => allColumns.find((c) => c.key === key)?.label ?? key;
  const available = allColumns.filter((c) => !value.includes(c.key));

  const remove = (key: string) => onChange(value.filter((k) => k !== key));
  const add = (key: string) => onChange([...value, key]);

  // Reorder: pull the dragged key out and splice it in at the drop position.
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const onDrop = () => {
    if (dragIdx !== null && overIdx !== null) reorder(dragIdx, overIdx);
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div>
      {value.map((key, idx) => {
        const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
        return (
          <div
            key={key}
            draggable
            onDragStart={(e) => {
              setDragIdx(idx);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(idx);
            }}
            onDrop={onDrop}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 6px",
              borderRadius: 6,
              background: dragIdx === idx ? token.controlItemBgActive : "transparent",
              boxShadow: isOver ? `inset 0 2px 0 ${token.colorPrimary}` : "none",
              opacity: dragIdx === idx ? 0.6 : 1,
              cursor: "grab",
            }}
          >
            <HolderOutlined style={{ color: token.colorTextTertiary, cursor: "grab", fontSize: 13 }} />
            <Checkbox checked onChange={() => remove(key)} />
            <span style={{ flex: 1, fontSize: 13 }}>{labelOf(key)}</span>
          </div>
        );
      })}
      {available.length > 0 && (
        <>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", margin: "8px 0 4px" }}>
            {i18n.t("views.availableColumns", { defaultValue: "可添加" })}
          </Typography.Text>
          {available.map((c) => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px" }}>
              <span style={{ width: 13, flexShrink: 0 }} />
              <Checkbox checked={false} onChange={() => add(c.key)} />
              <span style={{ flex: 1, fontSize: 13, color: token.colorTextTertiary }}>{c.label}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
