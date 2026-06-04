import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { App, Empty, Pagination, Table, theme } from "antd";
import type { TableProps } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { useResizableColumns } from "@/components/modules/base/resizableColumns";
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
  /** DRF `ordering` value, e.g. "name" or "-created_at". */
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
  const [ordering, setOrdering] = useState(defaultOrdering);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Stable identity for the merged filter params so effects fire on value change.
  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);
  const requestSeq = useRef(0);

  const fetchPage = useCallback(async (p: number) => {
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
      setTotal(Array.isArray(res) ? res.length : res.count ?? 0);
      setSelectedRowKeys([]);
    } catch {
      if (requestId === requestSeq.current) {
        message.error(i18n.t("common.loadFailed", { defaultValue: "加载失败" }));
      }
    } finally {
      if (requestId === requestSeq.current) setLoading(false);
    }
    // params is captured via paramsKey in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vs, pageSize, ordering, paramsKey, message]);

  // Single fetch path: when filters/sort/pageSize/reloadKey change, reset to page
  // 1 (and let the page change re-trigger the fetch) so we never fetch twice.
  const depsRef = useRef("");
  useEffect(() => {
    const key = `${paramsKey}|${ordering}|${pageSize}|${reloadKey ?? ""}`;
    if (key !== depsRef.current) {
      depsRef.current = key;
      if (page !== 1) { setPage(1); return; }
    }
    fetchPage(page);
  }, [page, paramsKey, ordering, pageSize, reloadKey, fetchPage]);

  const sort = parseOrdering(ordering);
  const sortedColumns = useMemo(
    () => columns.map((col) =>
      col.sorter
        ? { ...col, sortOrder: sort && String(col.key) === sort.field ? sort.order : null }
        : col,
    ),
    [columns, sort],
  );
  const { columns: resizableColumns, components } = useResizableColumns(sortedColumns, widthStorageKey);

  const handleChange: TableProps<Record<string, unknown>>["onChange"] = (_p, _f, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = s?.columnKey != null ? String(s.columnKey) : s?.field ? String(s.field) : "";
    if (s?.order && field) setOrdering(s.order === "descend" ? `-${field}` : field);
    else setOrdering(defaultOrdering);
  };

  // Size the table body to the available area so the header stays fixed and the
  // empty/loading placeholder centers in the full height (antd centers the
  // placeholder within scroll.y). Measured rather than CSS-chained because
  // antd v6's Spin/Table internals don't expose a stable full-height class path.
  const areaRef = useRef<HTMLDivElement>(null);
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
          border-radius: 0;
          background: ${token.colorBgContainer};
        }
        .seacube-data-table .ant-table-container,
        .seacube-data-table .ant-table-container table,
        .seacube-data-table .ant-table-thead > tr > th:first-child,
        .seacube-data-table .ant-table-thead > tr > th:last-child {
          border-radius: 0 !important;
        }
        .seacube-data-table .ant-table-container {
          border-top: 1px solid ${token.colorBorderSecondary};
        }
        .seacube-data-table .ant-table-thead > tr {
          height: 32px !important;
        }
        .seacube-data-table .ant-table-thead > tr > th {
          height: 32px !important;
          padding: 0 12px !important;
          background: #fbfcfd;
          border-bottom: 1px solid #dfe7ef;
          border-inline-end: 1px solid #dfe7ef;
          color: #1f2937;
          font-size: 12.5px;
          font-weight: 600;
          line-height: 32px !important;
        }
        .seacube-data-table .ant-table-thead > tr > th::before {
          display: none;
        }
        .seacube-data-table .ant-table-tbody > tr {
          height: 32px !important;
        }
        .seacube-data-table .ant-table-tbody > tr > td {
          height: 32px !important;
          padding: 0 12px !important;
          border-bottom: 1px solid #edf1f5;
          border-inline-end: 1px solid #edf1f5;
          color: #2f3542;
          font-size: 13px;
          line-height: 32px !important;
          vertical-align: middle;
        }
        .seacube-data-table .ant-table-tbody > tr:hover > td {
          background: #f6fbff;
        }
        .seacube-data-table .ant-table-cell-scrollbar,
        .seacube-data-table .ant-table-thead > tr > th:last-child,
        .seacube-data-table .ant-table-tbody > tr > td:last-child {
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
        .seacube-data-table .ant-table-column-sorter {
          display: inline-flex;
          align-items: center;
          height: 32px;
          margin-inline-start: 6px;
        }
        .seacube-data-table .ant-table-column-sorter-inner {
          display: inline-flex !important;
          flex-direction: column;
          justify-content: center;
          height: 18px;
          line-height: 1;
        }
        .seacube-data-table .ant-table-column-sorter-up,
        .seacube-data-table .ant-table-column-sorter-down {
          line-height: 1;
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
          rowSelection={selectable ? {
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            columnWidth: 40,
          } : undefined}
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
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          minHeight: 38, padding: "0 24px", borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: "#fff", fontSize: 13, color: token.colorTextSecondary,
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
              i18n.t("common.pageRange", { defaultValue: "{{from}}-{{to}} of {{total}}", from: range[0], to: range[1], total: t })}
            onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
          />
        </div>
      </div>
    </div>
  );
}
