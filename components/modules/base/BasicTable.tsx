import type { Key } from "react";
import { Table } from "antd";
import type { TableProps } from "antd";
import { tableSkinCss } from "./tableSkin";
import { useResizableColumns } from "./resizableColumns";

type Props<T extends object> = TableProps<T> & {
  /**
   * Enable drag-to-resize column widths (off by default). Only columns that carry
   * a numeric `width` get a resize handle — give every column a width for a fully
   * resizable table. Requires fixed layout, which is applied automatically.
   */
  resizable?: boolean;
  /**
   * Persist per-device column widths under this localStorage key (only meaningful
   * with `resizable`). Omit for in-memory widths that reset when the table remounts.
   */
  widthStorageKey?: string;
  /**
   * Let rows grow to fit multi-line cells instead of the fixed single-line row
   * height (e.g. tables with clamped two-line text). Off by default.
   */
  autoRowHeight?: boolean;
};

// Stable empty array so the resize hook does no work when `resizable` is off
// (hooks must run unconditionally, but we feed it nothing in that case).
const NO_COLUMNS: { key?: Key; width?: number; sorter?: boolean }[] = [];

/**
 * A simple client-side table sharing the list {@link DataTable}'s Bigin/CRM skin
 * (header tint, row height, thin grid borders, hover — see {@link tableSkinCss}).
 * For tables that don't need server fetch / pagination — pass `columns` +
 * `dataSource` like a plain antd Table (used in detail pages, drawers, etc.).
 *
 * Set `resizable` to opt into drag-to-resize columns (reuses the same
 * {@link useResizableColumns} engine as DataTable, without its reorder / header
 * menu); pass `widthStorageKey` to persist widths per device.
 */
export default function BasicTable<T extends object = Record<string, unknown>>({
  resizable = false,
  widthStorageKey,
  autoRowHeight = false,
  columns,
  components,
  tableLayout,
  ...props
}: Props<T>) {
  // Always call the hook (rules of hooks); feed it the real columns only when
  // resizing is on, otherwise a stable empty list so it's a no-op.
  const resized = useResizableColumns(
    resizable ? ((columns ?? []) as unknown as typeof NO_COLUMNS) : NO_COLUMNS,
    resizable ? widthStorageKey : undefined,
  );

  const finalColumns = resizable ? (resized.columns as TableProps<T>["columns"]) : columns;
  const finalComponents = resizable ? (resized.components as TableProps<T>["components"]) : components;
  // Resizing needs fixed layout so explicit widths are honoured.
  const finalLayout = tableLayout ?? (resizable ? "fixed" : undefined);

  return (
    <div className="seacube-basic-table">
      <style>{`
        .seacube-basic-table .ant-table { background: transparent; }
        ${tableSkinCss("seacube-basic-table", { autoRowHeight })}
      `}</style>
      <Table
        size="small"
        pagination={false}
        {...props}
        columns={finalColumns}
        components={finalComponents}
        tableLayout={finalLayout}
      />
    </div>
  );
}
