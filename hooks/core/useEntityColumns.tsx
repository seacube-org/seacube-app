/* eslint-disable react/display-name -- the by-type functions are antd column
   render callbacks (value → ReactNode), not React components. */
import { useMemo, type ReactNode } from "react";
import { Tag, Typography, theme } from "antd";
import type { DataTableColumn } from "@/components/modules/base/DataTable";
import type { FieldDef } from "@/components/modules/views/types";

/**
 * Per-field column override — the escape hatch from the by-type default renderer
 * (mirrors SchemaField's `config.control`). Provide a custom `render` for domain
 * cells (avatar name, colored status tag) or tweak width/title/align.
 */
export type ColumnOverride = {
  render?: (value: unknown, record: Record<string, unknown>) => ReactNode;
  width?: number;
  title?: string;
  align?: "left" | "right" | "center";
};

/** Fallback width per field type when the schema doesn't specify one. */
const TYPE_WIDTH: Record<string, number> = { text: 200, choice: 140, number: 120, date: 160, boolean: 100 };

/**
 * Build antd table columns from the backend field schema (label / type / sortable
 * / width) — so column headers, sortability and rendering aren't hardcoded. A
 * by-type default renderer covers text/choice/number/date/boolean; `overrides`
 * supplies custom cells. See docs/schema-driven-columns.md.
 */
export function useEntityColumns(
  fields: FieldDef[],
  overrides: Record<string, ColumnOverride> = {},
): DataTableColumn[] {
  const { token } = theme.useToken();
  return useMemo(() => {
    const dash = <Typography.Text type="secondary">—</Typography.Text>;
    const blank = (v: unknown) => v == null || v === "";

    const byType = (f: FieldDef): ((v: unknown) => ReactNode) => {
      const opts = new Map((f.choices ?? []).map((c) => [c.value, c]));
      switch (f.type) {
        case "choice":
          return (v) => {
            if (blank(v)) return dash;
            const o = opts.get(String(v));
            return <Tag color={o?.color}>{o?.label ?? String(v)}</Tag>;  // color from OptionSet meta, if any
          };
        case "date":
          return (v) => (v ? new Date(String(v)).toLocaleDateString() : dash);
        case "boolean":
          return (v) => (v ? <span style={{ color: token.colorSuccess }}>✓</span> : dash);
        case "number":
          return (v) => (blank(v) ? dash : String(v));
        default: // text
          // Truncate to the column width and surface the full value in a tooltip
          // — but only when it's actually ellipsized (antd measures internally).
          return (v) => {
            if (blank(v)) return dash;
            const text = String(v);
            return (
              <Typography.Text ellipsis={{ tooltip: text }} style={{ display: "block" }}>
                {text}
              </Typography.Text>
            );
          };
      }
    };

    return fields
      .filter((f) => f.listable !== false)
      .map((f): DataTableColumn => {
        const o = overrides[f.name] ?? {};
        return {
          title: o.title ?? f.label,
          dataIndex: f.name,
          key: f.name,
          width: o.width ?? f.width ?? TYPE_WIDTH[f.type] ?? 160,
          align: o.align ?? f.align ?? undefined,
          // showTitle:false suppresses the native browser title so it doesn't
          // double up with the Typography tooltip in the text renderer.
          ellipsis: f.type === "text" ? { showTitle: false } : false,
          sorter: f.sortable !== false,
          render: o.render ?? byType(f),
        };
      });
  }, [fields, overrides, token]);
}
