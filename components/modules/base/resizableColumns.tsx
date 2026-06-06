import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MutableRefObject,
  type RefObject,
} from "react";
import { Dropdown, type MenuProps, type TableProps } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ColumnWidthOutlined,
  DownOutlined,
  EyeInvisibleOutlined,
  FilterOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import i18n from "@/locale/i18n";
import { loadColumnWidths, saveColumnWidths } from "@/utils/tableWidths";

/**
 * Lightweight resizable + reorderable table columns for antd (web), plus a
 * per-column hover menu (sort / filter / autofit / remove) — all with no extra
 * dependency (react-resizable / dnd-kit et al). Each header cell:
 *  - has a drag handle on its right edge to resize (native pointer events),
 *  - is itself draggable (native HTML5 DnD) to reorder columns, and
 *  - reveals a caret on hover that opens a column actions menu.
 *
 * Resize persists per-device to localStorage; the menu's view-level actions
 * (sort / filter / remove) are delegated to the caller via `options`.
 *
 * Every column passed in must have a stable string `key`.
 */

type ColumnMenu = {
  onSortAsc?: () => void;
  onSortDesc?: () => void;
  onFilter?: () => void;
  onAutoFit: () => void;
  onRemove?: () => void;
};

type ReorderApi = {
  resizingRef: MutableRefObject<boolean>;
  onStart: (key: string) => void;
  onOver: (key: string, side: "left" | "right") => void;
  onDrop: (key: string) => void;
  onEnd: () => void;
};

type ResizableHeaderProps = HTMLAttributes<HTMLTableCellElement> & {
  width?: number;
  onResize?: (width: number) => void;
  columnKey?: string;
  reorder?: ReorderApi & { indicator: "left" | "right" | null; dragging: boolean };
  menu?: ColumnMenu;
};

function ColumnMenuTrigger({ menu }: { menu: ColumnMenu }) {
  const [open, setOpen] = useState(false);
  // Sort asc/desc nest as a submenu under "Sort".
  const sortChildren: MenuProps["items"] = [
    ...(menu.onSortAsc
      ? [{ key: "asc", icon: <ArrowUpOutlined />, label: i18n.t("views.sortAsc", { defaultValue: "升序" }) }]
      : []),
    ...(menu.onSortDesc
      ? [{ key: "desc", icon: <ArrowDownOutlined />, label: i18n.t("views.sortDesc", { defaultValue: "降序" }) }]
      : []),
  ];
  const items: MenuProps["items"] = [
    ...(sortChildren.length
      ? [
          {
            key: "sort",
            icon: <SwapOutlined rotate={90} />,
            label: i18n.t("views.sort", { defaultValue: "排序" }),
            children: sortChildren,
          },
        ]
      : []),
    ...(menu.onFilter
      ? [{ key: "filter", icon: <FilterOutlined />, label: i18n.t("common.filter", { defaultValue: "筛选" }) }]
      : []),
    { key: "autofit", icon: <ColumnWidthOutlined />, label: i18n.t("views.autoFit", { defaultValue: "自适应列宽" }) },
    ...(menu.onRemove
      ? [
          { type: "divider" as const },
          {
            key: "remove",
            icon: <EyeInvisibleOutlined />,
            label: i18n.t("views.removeColumn", { defaultValue: "移除该列" }),
          },
        ]
      : []),
  ];
  const onClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    const actions: Record<string, (() => void) | undefined> = {
      asc: menu.onSortAsc,
      desc: menu.onSortDesc,
      filter: menu.onFilter,
      autofit: menu.onAutoFit,
      remove: menu.onRemove,
    };
    actions[key]?.();
  };

  return (
    <Dropdown trigger={["click"]} menu={{ items, onClick }} open={open} onOpenChange={setOpen} placement="bottomRight">
      <span
        className="seacube-col-menu"
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
        style={{
          position: "absolute",
          insetInlineEnd: 9,
          top: "50%",
          transform: "translateY(-50%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          border: "1px solid #dfe7ef",
          color: "#5b6b7b",
          cursor: "pointer",
          zIndex: 4,
          ...(open ? { opacity: 1 } : null),
        }}
      >
        <DownOutlined style={{ fontSize: 9 }} />
      </span>
    </Dropdown>
  );
}

function ResizableTitle({ width, onResize, columnKey, reorder, menu, children, style, ...rest }: ResizableHeaderProps) {
  const draggable = !!reorder && !!columnKey;

  const startResize = (e: React.PointerEvent) => {
    if (!onResize || width == null) return;
    e.preventDefault();
    e.stopPropagation(); // don't trigger the column's sorter
    if (reorder) reorder.resizingRef.current = true; // suppress the reorder drag
    const startX = e.clientX;
    const startWidth = width;
    const onMove = (ev: PointerEvent) => onResize(Math.max(60, startWidth + (ev.clientX - startX)));
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      if (reorder) reorder.resizingRef.current = false;
    };
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  return (
    <th
      {...rest}
      draggable={draggable || undefined}
      onDragStart={
        draggable
          ? (e) => {
              // Don't start a reorder when the gesture began on the resize handle or the menu caret.
              if (reorder!.resizingRef.current) {
                e.preventDefault();
                return;
              }
              if ((e.target as HTMLElement).closest(".seacube-col-menu")) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.effectAllowed = "move";
              try {
                e.dataTransfer.setData("text/plain", columnKey!);
              } catch {
                /* Safari */
              }
              reorder!.onStart(columnKey!);
            }
          : undefined
      }
      onDragOver={
        draggable
          ? (e) => {
              e.preventDefault(); // allow drop
              const rect = e.currentTarget.getBoundingClientRect();
              reorder!.onOver(columnKey!, e.clientX - rect.left < rect.width / 2 ? "left" : "right");
            }
          : undefined
      }
      onDrop={
        draggable
          ? (e) => {
              e.preventDefault();
              reorder!.onDrop(columnKey!);
            }
          : undefined
      }
      onDragEnd={draggable ? () => reorder!.onEnd() : undefined}
      style={{
        ...style,
        position: "relative",
        cursor: draggable ? "grab" : style?.cursor,
        opacity: reorder?.dragging ? 0.4 : style?.opacity,
      }}
    >
      {children}
      {/* Drop-position indicator (insert before/after this column). */}
      {reorder?.indicator && (
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 2,
            background: "#1A73E8",
            zIndex: 2,
            pointerEvents: "none",
            ...(reorder.indicator === "left" ? { insetInlineStart: 0 } : { insetInlineEnd: 0 }),
          }}
        />
      )}
      {menu && <ColumnMenuTrigger menu={menu} />}
      {width != null && onResize && (
        <span
          className="seacube-col-resize"
          onPointerDown={startResize}
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()} // never start an HTML5 drag from the handle
          draggable={false}
          style={{
            position: "absolute",
            top: 0,
            insetInlineEnd: -4,
            height: "100%",
            width: 8,
            cursor: "col-resize",
            zIndex: 3,
            touchAction: "none",
          }}
        />
      )}
    </th>
  );
}

type AnyColumns = NonNullable<TableProps<Record<string, unknown>>["columns"]>;

type ColumnBehaviorOptions = {
  /** Called with the new key order when the user drags a header to reorder. */
  onReorder?: (orderedKeys: string[]) => void;
  /** Table DOM container, used to measure content widths for AutoFit. */
  containerRef?: RefObject<HTMLElement | null>;
  /** Enables the menu's Sort items; called with the column key + direction. */
  onSort?: (key: string, dir: "asc" | "desc") => void;
  /** Enables the menu's Filter item; opens a filter for the column. */
  onFilterColumn?: (key: string) => void;
  /** Enables the menu's Remove item; hides the column. */
  onRemoveColumn?: (key: string) => void;
};

export function useResizableColumns<C extends { key?: React.Key; width?: number; sorter?: boolean }>(
  baseColumns: C[],
  storageKey?: string,
  options: ColumnBehaviorOptions = {},
) {
  const { onReorder, containerRef, onSort, onFilterColumn, onRemoveColumn } = options;

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

  // AutoFit: size a column to the widest of its header title and the currently
  // displayed cell data. Each cell is cloned off-layout with no width constraint
  // so it shrink-wraps to its natural content width — measuring scrollWidth in
  // place is unreliable, since the rendered cell is already clamped to the column
  // width and repeated autofits would just keep growing it. Header decorations
  // (the hidden sorter, menu caret and resize handle) are stripped from the clone.
  const autoFit = useCallback(
    (key: string) => {
      const root = containerRef?.current;
      if (!root || typeof document === "undefined") return;
      const cells = root.querySelectorAll<HTMLElement>(`[data-col-key="${CSS.escape(key)}"]`);
      if (!cells.length) return;

      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;font-size:13px;";
      document.body.appendChild(probe);
      let max = 0;
      cells.forEach((cell) => {
        const clone = cell.cloneNode(true) as HTMLElement;
        clone
          .querySelectorAll(".ant-table-column-sorter, .seacube-col-menu, .seacube-col-resize")
          .forEach((el) => el.remove());
        clone.style.display = "inline-block";
        clone.style.width = "auto";
        clone.style.maxWidth = "none";
        clone.style.minWidth = "0";
        probe.appendChild(clone);
        max = Math.max(max, clone.scrollWidth);
        probe.removeChild(clone);
      });
      document.body.removeChild(probe);

      // +24 ≈ the cell's horizontal padding (12px each side), which the scoped
      // table CSS doesn't apply to the off-DOM clone.
      if (max > 0) setWidths((prev) => ({ ...prev, [key]: Math.min(Math.max(Math.ceil(max) + 24, 60), 600) }));
    },
    [containerRef],
  );

  // Reorder drag state. resizingRef gates the resize/reorder gesture conflict.
  const resizingRef = useRef(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [over, setOver] = useState<{ key: string; side: "left" | "right" } | null>(null);

  const menuOn = !!(onSort || onFilterColumn || onRemoveColumn);

  const columns = useMemo(() => {
    const keys = baseColumns.map((c) => String(c.key));
    const reorderApi: ReorderApi | null = onReorder
      ? {
          resizingRef,
          onStart: (k) => setDragKey(k),
          onOver: (k, side) => setOver((p) => (p && p.key === k && p.side === side ? p : { key: k, side })),
          onEnd: () => {
            setDragKey(null);
            setOver(null);
          },
          onDrop: (toKey) => {
            setDragKey(null);
            setOver(null);
            if (!dragKey || dragKey === toKey) return;
            const side = over?.side ?? "left";
            const next = keys.filter((k) => k !== dragKey);
            const ti = next.indexOf(toKey);
            if (ti < 0) return;
            next.splice(side === "right" ? ti + 1 : ti, 0, dragKey);
            if (next.join("|") !== keys.join("|")) onReorder(next);
          },
        }
      : null;

    return baseColumns.map((col) => {
      const key = col.key != null ? String(col.key) : undefined;
      const width = key ? (widths[key] ?? col.width) : col.width;
      const menu: ColumnMenu | undefined =
        menuOn && key
          ? {
              ...(onSort && col.sorter
                ? { onSortAsc: () => onSort(key, "asc"), onSortDesc: () => onSort(key, "desc") }
                : {}),
              ...(onFilterColumn ? { onFilter: () => onFilterColumn(key) } : {}),
              onAutoFit: () => autoFit(key),
              ...(onRemoveColumn ? { onRemove: () => onRemoveColumn(key) } : {}),
            }
          : undefined;
      return {
        ...col,
        width,
        ...(key ? { onCell: () => ({ "data-col-key": key }) } : {}),
        onHeaderCell: () => ({
          ...(key ? { "data-col-key": key } : {}),
          ...(key && typeof width === "number"
            ? { width, onResize: (w: number) => setWidths((prev) => ({ ...prev, [key]: w })) }
            : {}),
          ...(reorderApi && key
            ? {
                columnKey: key,
                reorder: { ...reorderApi, indicator: over?.key === key ? over.side : null, dragging: dragKey === key },
              }
            : {}),
          ...(menu ? { menu } : {}),
        }),
      };
    });
  }, [
    baseColumns,
    widths,
    onReorder,
    onFilterColumn,
    onRemoveColumn,
    onSort,
    menuOn,
    autoFit,
    dragKey,
    over,
  ]) as AnyColumns;

  const components = { header: { cell: ResizableTitle } } as TableProps<Record<string, unknown>>["components"];

  return { columns, components };
}
