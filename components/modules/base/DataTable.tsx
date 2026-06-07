import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { App, Empty, Pagination, Table, theme } from "antd";
import type { TableProps } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { useDataService } from "@/hooks/core/useDataService";
import { useResizableColumns } from "@/components/modules/base/resizableColumns";
import { tableSkinCss } from "@/components/modules/base/tableSkin";
import { rows } from "@/utils/pagination";
import i18n from "@/locale/i18n";

export type DataTableColumn = {
  key?: React.Key;
  width?: number;
  /** Set true to enable a server-side sortable header (uses `key` as the ordering field). */
  sorter?: boolean;
  [prop: string]: unknown;
};

type DataTableProps = {
  /** ViewSet base URL (e.g. "/api/contacts/contacts/"). */
  endpoint: string;
  columns: DataTableColumn[];
  rowKey?: string;
  /** Filter/search params merged into every request; changing them resets to page 1. */
  params?: Record<string, string | number | boolean | undefined>;
  /** DRF `ordering` value, e.g. "name" or "-created_at". Seeds the uncontrolled
   *  sort; when `onSortChange` is given, sorting is controlled by this value. */
  defaultOrdering?: string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (record: Record<string, unknown>) => void;
  /** Footer-left content; receives the server total count. */
  renderSummary?: (total: number) => ReactNode;
  /** Bump (e.g. `${activeOrgId}-${tick}`) to force a refetch — org switch, after save. */
  reloadKey?: string | number;
  emptyText?: ReactNode;
  selectable?: boolean;
  /** Persist per-device column widths under this key (localStorage); omit to disable. */
  widthStorageKey?: string;
  /** Enable header drag-to-reorder; called with the new key order. Order isn't
   *  owned here (it's a view concern), so the caller persists it. */
  onReorderColumns?: (orderedKeys: string[]) => void;
  /** Make sorting controlled (view-level): called with the new DRF ordering
   *  string. When set, `defaultOrdering` is read as the controlled value. */
  onSortChange?: (ordering: string) => void;
  /** Header-menu "Filter": open a filter for the column (caller-owned). */
  onFilterColumn?: (key: string) => void;
  /** Header-menu "Remove": hide the column (caller-owned). */
  onRemoveColumn?: (key: string) => void;
};

/** "ascend"/"descend" + field ⇆ DRF ordering string ("name" / "-name"). */
function parseOrdering(ordering: string | undefined): { field: string; order: "ascend" | "descend" } | null {
  if (!ordering) return null;
  return ordering.startsWith("-")
    ? { field: ordering.slice(1), order: "descend" }
    : { field: ordering, order: "ascend" };
}

/**
 * Server-side antd Table: owns pagination, sorting and fetching; the parent owns
 * filters (via `params`) and column defs. Columns are resizable; the empty state
 * fills the available height. Pagination + records-per-page sit bottom-right.
 */
export default function DataTable({
  endpoint,
  columns,
  rowKey = "id",
  params,
  defaultOrdering = "",
  defaultPageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  renderSummary,
  reloadKey,
  emptyText,
  selectable = false,
  widthStorageKey,
  onReorderColumns,
  onSortChange,
  onFilterColumn,
  onRemoveColumn,
}: DataTableProps) {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const { getViewSet } = useDataService();
  const vs = useMemo(() => getViewSet(endpoint), [getViewSet, endpoint]);

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Sorting is controlled (view-level) when `onSortChange` is provided — the
  // parent owns `ordering` via `defaultOrdering`; otherwise we keep it local.
  const [internalOrdering, setInternalOrdering] = useState(defaultOrdering);
  const isControlledSort = onSortChange != null;
  const ordering = isControlledSort ? defaultOrdering : internalOrdering;
  const applyOrdering = useCallback(
    (o: string) => {
      if (onSortChange) onSortChange(o);
      else setInternalOrdering(o);
    },
    [onSortChange],
  );

  // DOM container — measured for the empty-state height and AutoFit.
  const areaRef = useRef<HTMLDivElement>(null);

  // Stable identity for the merged filter params so effects fire on value change.
  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);
  const requestSeq = useRef(0);

  const fetchPage = useCallback(
    async (p: number) => {
      const requestId = ++requestSeq.current;
      setLoading(true);
      try {
        const res = (await vs.list({
          params: {
            page: p,
            page_size: pageSize,
            ...(ordering ? { ordering } : {}),
            ...(params ?? {}),
          },
        })) as { count?: number } | Record<string, unknown>[];
        if (requestId !== requestSeq.current) return;
        setData(rows<Record<string, unknown>>(res));
        setTotal(Array.isArray(res) ? res.length : (res.count ?? 0));
        setSelectedRowKeys([]);
      } catch {
        if (requestId === requestSeq.current) {
          message.error(i18n.t("common.loadFailed", { defaultValue: "加载失败" }));
        }
      } finally {
        if (requestId === requestSeq.current) setLoading(false);
      }
      // params is captured via paramsKey in the effect below.
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vs, pageSize, ordering, paramsKey, message],
  );

  // Single fetch path: when filters/sort/pageSize/reloadKey change, reset to page
  // 1 (and let the page change re-trigger the fetch) so we never fetch twice.
  const depsRef = useRef("");
  useEffect(() => {
    const key = `${paramsKey}|${ordering}|${pageSize}|${reloadKey ?? ""}`;
    if (key !== depsRef.current) {
      depsRef.current = key;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchPage(page);
  }, [page, paramsKey, ordering, pageSize, reloadKey, fetchPage]);

  const sort = parseOrdering(ordering);
  // antd's own sorter icon is hidden (sort lives in the header menu); instead we
  // tuck a single arrow next to the title of the actively-sorted column, Bigin-style.
  const sortedColumns = useMemo(() => {
    const arrowStyle = { fontSize: 11, color: token.colorPrimary };
    return columns.map((col) => {
      if (!col.sorter) return col;
      const order = sort && String(col.key) === sort.field ? sort.order : null;
      return {
        ...col,
        sortOrder: order,
        title: order ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {col.title as ReactNode}
            {order === "ascend" ? <ArrowUpOutlined style={arrowStyle} /> : <ArrowDownOutlined style={arrowStyle} />}
          </span>
        ) : (
          col.title
        ),
      };
    });
  }, [columns, sort, token]);
  const { columns: resizableColumns, components } = useResizableColumns(sortedColumns, widthStorageKey, {
    onReorder: onReorderColumns,
    containerRef: areaRef,
    onSort: (key, dir) => applyOrdering(dir === "desc" ? `-${key}` : key),
    onFilterColumn,
    onRemoveColumn,
  });

  const handleChange: TableProps<Record<string, unknown>>["onChange"] = (_p, _f, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = s?.columnKey != null ? String(s.columnKey) : s?.field ? String(s.field) : "";
    if (s?.order && field) applyOrdering(s.order === "descend" ? `-${field}` : field);
    else applyOrdering(isControlledSort ? "" : defaultOrdering);
  };

  // Size the table body to the available area so the header stays fixed and the
  // empty/loading placeholder centers in the full height (antd centers the
  // placeholder within scroll.y). Measured rather than CSS-chained because
  // antd v6's Spin/Table internals don't expose a stable full-height class path.
  const [scrollY, setScrollY] = useState<number>();
  useEffect(() => {
    const el = areaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const header = el.querySelector(".ant-table-header") as HTMLElement | null;
      const headerH = header?.offsetHeight ?? 33;
      setScrollY(Math.max(120, el.clientHeight - headerH));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const centeredEmptyText = (
    <div
      style={{
        height: scrollY ?? 240,
        minHeight: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {emptyText ?? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
    </div>
  );

  return (
    <div className="seacube-data-table" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <style>{`
        .seacube-data-table {
          background: ${token.colorBgContainer};
          color: ${token.colorText};
        }
        .seacube-data-table .ant-table-wrapper,
        .seacube-data-table .ant-spin-nested-loading,
        .seacube-data-table .ant-spin-container,
        .seacube-data-table .ant-table {
          height: 100%;
        }
        .seacube-data-table .ant-table {
          background: ${token.colorBgContainer};
        }
        /* scroll.y only caps the body's max height, so with a few rows the body
           stays short and its horizontal scrollbar floats under the last row.
           Floor it to the measured height so the scrollbar pins to the bottom. */
        .seacube-data-table .ant-table-body {
          min-height: ${scrollY ?? 0}px;
        }
        /* Column header menu caret: revealed on header hover (or when open). */
        .seacube-data-table .ant-table-thead > tr > th .seacube-col-menu {
          opacity: 0;
          transition: opacity 0.12s;
        }
        .seacube-data-table .ant-table-thead > tr > th:hover .seacube-col-menu {
          opacity: 1;
        }
        .seacube-data-table .ant-table-container {
          border-top: 1px solid ${token.colorBorderSecondary};
        }
        ${tableSkinCss("seacube-data-table")}
        .seacube-data-table .ant-table-cell-scrollbar {
          border-inline-end: 0;
        }
        .seacube-data-table .ant-table-selection-column {
          width: 40px;
          min-width: 40px;
          padding-inline: 0 !important;
          text-align: center;
        }
        .seacube-data-table .ant-checkbox-inner {
          border-radius: 3px;
          border-color: #b8c2cc;
        }
        .seacube-data-table .ant-table-column-sorters {
          min-height: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          align-items: center;
        }
        .seacube-data-table .ant-table-column-title {
          line-height: 32px;
        }
        /* Sort lives in the column header menu now, so hide antd's arrow icon
           (sortability + click-to-sort stay enabled via the column's sorter). */
        .seacube-data-table .ant-table-column-sorter {
          display: none;
        }
        .seacube-data-table .ant-empty {
          margin: 0;
          color: ${token.colorTextTertiary};
        }
        .seacube-data-table .ant-pagination .ant-pagination-options {
          margin-inline-start: 10px;
        }
      `}</style>
      <div ref={areaRef} style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Table
          rowKey={rowKey}
          size="small"
          loading={loading}
          columns={resizableColumns}
          components={components}
          dataSource={data}
          tableLayout="fixed"
          pagination={false}
          scroll={{ y: scrollY }}
          locale={{ emptyText: centeredEmptyText }}
          rowSelection={
            selectable
              ? {
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                  columnWidth: 40,
                }
              : undefined
          }
          onChange={handleChange}
          onRow={(record) => ({
            onClick: (event) => {
              const target = event.target as HTMLElement;
              if (target.closest(".ant-checkbox-wrapper, .ant-checkbox, input")) return;
              onRowClick?.(record);
            },
            style: onRowClick ? { cursor: "pointer" } : undefined,
          })}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          minHeight: 38,
          padding: "0 24px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: "#fff",
          fontSize: 13,
          color: token.colorTextSecondary,
        }}
      >
        <div>{renderSummary?.(total)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Pagination
            size="small"
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={pageSizeOptions}
            showTotal={(t, range) =>
              i18n.t("common.pageRange", {
                defaultValue: "{{from}}-{{to}} of {{total}}",
                from: range[0],
                to: range[1],
                total: t,
              })
            }
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </div>
      </div>
    </div>
  );
}
