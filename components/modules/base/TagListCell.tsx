import { type ReactNode } from "react";
import { Popover, Tag, Typography } from "antd";
import i18n from "@/locale/i18n";

type Props = {
  /** Full list of string values to render as tags. */
  items: string[];
  /** How many tags to show inline before collapsing the rest into a "+N" pill. */
  max?: number;
  /** Rendered when `items` is empty (defaults to a muted dash). */
  emptyContent?: ReactNode;
};

const tagStyle = { fontSize: 11, marginInlineEnd: 0 } as const;

/**
 * A wrapping list of tag values for table cells: shows the first `max` inline and
 * collapses the remainder into a hover "+N" pill whose Popover reveals the full
 * list (wrapped + scrollable). Used by the product-attribute catalog table and the
 * product detail's spec-attribute table. `lineHeight:normal` cancels the table
 * row's tall line-height so wrapped rows sit tight.
 */
export default function TagListCell({ items, max = 5, emptyContent }: Props) {
  if (!items.length) {
    return <>{emptyContent ?? <Typography.Text type="secondary">—</Typography.Text>}</>;
  }

  // Don't collapse a single overflow item — showing "+1" beside `max` tags wastes
  // a slot, so just render them all when there's only one extra.
  const visible = items.length <= max + 1 ? items : items.slice(0, max);
  const hidden = items.length - visible.length;

  return (
    <span
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
        lineHeight: "normal",
        padding: "6px 0",
      }}
    >
      {visible.map((c) => (
        <Tag key={c} style={tagStyle}>
          {c}
        </Tag>
      ))}
      {hidden > 0 && (
        <Popover
          trigger="hover"
          placement="topLeft"
          mouseEnterDelay={0.1}
          title={`${i18n.t("common.allOptions", { defaultValue: "全部选项" })} (${items.length})`}
          content={
            <div
              style={{
                maxWidth: 340,
                maxHeight: 240,
                overflow: "auto",
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {items.map((c) => (
                <Tag key={c} style={tagStyle}>
                  {c}
                </Tag>
              ))}
            </div>
          }
        >
          <Tag style={{ ...tagStyle, cursor: "pointer", borderStyle: "dashed", background: "transparent" }}>
            +{hidden}
          </Tag>
        </Popover>
      )}
    </span>
  );
}
