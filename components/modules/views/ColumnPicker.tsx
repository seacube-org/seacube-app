import { Button, Checkbox, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";

export type ColumnOption = { key: string; label: string };

type Props = {
  allColumns: ColumnOption[];
  value: string[];               // ordered selected keys
  onChange: (keys: string[]) => void;
};

/**
 * Pick + order the visible columns. Selected columns are shown first in their
 * chosen order (up/down to reorder); unchecking moves a column back to available.
 */
export default function ColumnPicker({ allColumns, value, onChange }: Props) {
  const labelOf = (key: string) => allColumns.find((c) => c.key === key)?.label ?? key;
  const available = allColumns.filter((c) => !value.includes(c.key));

  const move = (idx: number, delta: number) => {
    const next = [...value];
    const j = idx + delta;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };
  const remove = (key: string) => onChange(value.filter((k) => k !== key));
  const add = (key: string) => onChange([...value, key]);

  return (
    <div>
      {value.map((key, idx) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 0" }}>
          <Checkbox checked onChange={() => remove(key)} />
          <span style={{ flex: 1, fontSize: 13 }}>{labelOf(key)}</span>
          <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={() => move(idx, -1)} />
          <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={idx === value.length - 1} onClick={() => move(idx, 1)} />
        </div>
      ))}
      {available.length > 0 && (
        <>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", margin: "8px 0 4px" }}>
            {i18n.t("views.availableColumns", { defaultValue: "可添加" })}
          </Typography.Text>
          {available.map((c) => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 0" }}>
              <Checkbox checked={false} onChange={() => add(c.key)} />
              <span style={{ flex: 1, fontSize: 13, color: "#888" }}>{c.label}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
