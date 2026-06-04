import type { CSSProperties } from "react";

export const FIELD_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: 18,
};

export const FIELD_ITEM_STYLE: CSSProperties = {
  minWidth: 0,
};

export const FULL_WIDTH_ITEM_STYLE: CSSProperties = {
  gridColumn: "1 / -1",
};
