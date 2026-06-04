import { useEffect, useMemo, useState, type HTMLAttributes } from "react";
import type { TableProps } from "antd";
import { loadColumnWidths, saveColumnWidths } from "@/utils/tableWidths";

/**
 * Lightweight resizable + persistable table columns for antd (web), with no
 * extra dependency (react-resizable et al). A drag handle on each header's right
 * edge updates a width map via native pointer events.
 *
 * Usage:
 *   const { columns, components } = useResizableColumns(baseColumns);
 *   <Table columns={columns} components={components} ... />
 *
 * Every column passed in must have a stable string `key`.
 */

type ResizableHeaderProps = HTMLAttributes<HTMLTableCellElement> & {
  width?: number;
  onResize?: (width: number) => void;
};

function ResizableTitle({ width, onResize, children, style, ...rest }: ResizableHeaderProps) {
  // Last column (or one without an explicit width) isn't resizable.
  if (width == null || !onResize) {
    return <th {...rest} style={style}>{children}</th>;
  }

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation(); // don't trigger the column's sorter
    const startX = e.clientX;
    const startWidth = width;
    const onMove = (ev: PointerEvent) => onResize(Math.max(60, startWidth + (ev.clientX - startX)));
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  return (
    <th {...rest} style={{ ...style, position: "relative" }}>
      {children}
      <span
        onPointerDown={startDrag}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          insetInlineEnd: -4,
          height: "100%",
          width: 8,
          cursor: "col-resize",
          zIndex: 1,
          touchAction: "none",
        }}
      />
    </th>
  );
}

type AnyColumns = NonNullable<TableProps<Record<string, unknown>>["columns"]>;

export function useResizableColumns<C extends { key?: React.Key; width?: number }>(
  baseColumns: C[],
  storageKey?: string,
) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const c of baseColumns) {
      if (c.key != null && typeof c.width === "number") init[String(c.key)] = c.width;
    }
    // localStorage overrides per-device; this hook re-mounts (and re-hydrates)
    // when the key changes, since the table is keyed by org/view.
    return storageKey ? { ...init, ...loadColumnWidths(storageKey) } : init;
  });

  // Persist debounced — a resize drag fires many updates; only the settled value
  // is written (and only to localStorage, never the server).
  useEffect(() => {
    if (!storageKey) return;
    const t = setTimeout(() => saveColumnWidths(storageKey, widths), 500);
    return () => clearTimeout(t);
  }, [widths, storageKey]);

  const columns = useMemo(() => {
    return baseColumns.map((col) => {
      const key = col.key != null ? String(col.key) : undefined;
      const width = key ? widths[key] ?? col.width : col.width;
      return {
        ...col,
        width,
        onHeaderCell: () =>
          key && typeof width === "number"
            ? { width, onResize: (w: number) => setWidths((prev) => ({ ...prev, [key]: w })) }
            : {},
      };
    });
  }, [baseColumns, widths]) as AnyColumns;

  const components = { header: { cell: ResizableTitle } } as TableProps<Record<string, unknown>>["components"];

  return { columns, components };
}
