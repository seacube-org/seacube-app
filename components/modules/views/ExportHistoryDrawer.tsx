import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Drawer, Pagination, Tag, Tooltip, Typography } from "antd";
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined, ReloadOutlined } from "@ant-design/icons";
import { useDataService } from "@/hooks/core/useDataService";
import { AuthError, fetchFileBlob } from "@/services/DataService";
import BasicTable from "@/components/modules/base/BasicTable";
import { saveBlob } from "@/utils/download";
import { rows } from "@/utils/pagination";
import { API_ENDPOINTS } from "@/constants/Constants";
import i18n from "@/locale/i18n";

type Job = {
  id: number;
  status: string;
  format: string;
  row_count: number;
  file_name: string;
  download_url: string | null;
  created_at: string;
};

const STATUS_META: Record<string, { color: string; key: string; fallback: string }> = {
  SUCCESS: { color: "success", key: "export.statusSuccess", fallback: "成功" },
  FAILED: { color: "error", key: "export.statusFailed", fallback: "失败" },
  RUNNING: { color: "processing", key: "export.statusRunning", fallback: "处理中" },
  PENDING: { color: "default", key: "export.statusPending", fallback: "排队中" },
};

/** Compact, single-line local time "YYYY-MM-DD HH:mm" (avoids the cell wrapping). */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Drawer listing this entity's export records, each re-downloadable. */
export default function ExportHistoryDrawer({
  open,
  onClose,
  entity,
}: {
  open: boolean;
  onClose: () => void;
  entity: string;
}) {
  const { message } = App.useApp();
  const { getViewSet, handleError } = useDataService();
  const vs = useMemo(() => getViewSet(API_ENDPOINTS.dataTransferJobs), [getViewSet]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  // Measured so the table body fills the drawer height (rows area full-height,
  // horizontal scrollbar pinned to the bottom).
  const areaRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState<number>();

  const reload = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const data = (await vs.list({
          params: { entity, kind: "EXPORT", page: p, page_size: PAGE_SIZE, ordering: "-created_at" },
        })) as { count?: number };
        setJobs(rows<Job>(data));
        setTotal(data.count ?? 0);
      } catch {
        message.error(i18n.t("export.historyFailed", { defaultValue: "加载导出历史失败" }));
      } finally {
        setLoading(false);
      }
    },
    [vs, entity, message],
  );

  // Refetch fresh (page 1) each time the drawer opens.
  useEffect(() => {
    if (!open) return;
    setPage(1);
    reload(1);
  }, [open, reload]);

  const goPage = useCallback(
    (p: number) => {
      setPage(p);
      reload(p);
    },
    [reload],
  );

  const refresh = useCallback(() => reload(page), [reload, page]);

  useEffect(() => {
    const el = areaRef.current;
    if (!open || !el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const header = el.querySelector(".ant-table-header") as HTMLElement | null;
      setScrollY(Math.max(120, el.clientHeight - (header?.offsetHeight ?? 33)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [open]);

  const download = useCallback(
    async (job: Job) => {
      if (!job.download_url) return;
      try {
        saveBlob(await fetchFileBlob(job.download_url), job.file_name);
      } catch (e) {
        // Clear/redirect on an expired session like other API calls.
        if (e instanceof AuthError) {
          void handleError(e).catch(() => {});
          return;
        }
        message.error(i18n.t("export.downloadFailed", { defaultValue: "下载失败" }));
      }
    },
    [message, handleError],
  );

  const columns = useMemo(
    () => [
      {
        title: i18n.t("export.file", { defaultValue: "文件" }),
        dataIndex: "file_name",
        key: "file_name",
        width: 240,
        render: (v: string, r: Job) => (
          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {r.format === "xlsx" ? (
              <FileExcelOutlined style={{ color: "#1d7044", fontSize: 15, flexShrink: 0 }} />
            ) : (
              <FileTextOutlined style={{ color: "#6b7a90", fontSize: 15, flexShrink: 0 }} />
            )}
            <Typography.Text ellipsis={{ tooltip: v }} style={{ flex: 1, minWidth: 0 }}>
              {v}
            </Typography.Text>
          </span>
        ),
      },
      {
        title: i18n.t("export.rows", { defaultValue: "行数" }),
        dataIndex: "row_count",
        key: "row_count",
        width: 84,
        align: "right" as const,
        render: (v: number) => <span style={{ color: "#5f6b7a" }}>{(v ?? 0).toLocaleString()}</span>,
      },
      {
        title: i18n.t("export.status", { defaultValue: "状态" }),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (s: string) => {
          const m = STATUS_META[s] ?? { color: "default", key: "", fallback: s };
          return <Tag color={m.color}>{m.key ? i18n.t(m.key, { defaultValue: m.fallback }) : s}</Tag>;
        },
      },
      {
        title: i18n.t("export.time", { defaultValue: "时间" }),
        dataIndex: "created_at",
        key: "created_at",
        width: 160,
        render: (v: string) => (
          <span style={{ whiteSpace: "nowrap", color: "#5f6b7a", fontVariantNumeric: "tabular-nums" }}>
            {fmtTime(v)}
          </span>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 56,
        align: "center" as const,
        fixed: "right" as const,
        render: (_: unknown, r: Job) => (
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            disabled={!r.download_url}
            onClick={() => download(r)}
            title={i18n.t("export.download", { defaultValue: "下载" })}
          />
        ),
      },
    ],
    [download],
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={i18n.t("export.history", { defaultValue: "导出历史" })}
      styles={{
        wrapper: { width: "min(720px, 100vw)" },
        body: { padding: 16, background: "#f7f9fc", display: "flex", flexDirection: "column", height: "100%" },
      }}
      destroyOnHidden
      extra={
        <Tooltip title={i18n.t("common.refresh", { defaultValue: "刷新" })}>
          <Button type="text" icon={<ReloadOutlined />} loading={loading} onClick={refresh} />
        </Tooltip>
      }
    >
      {/* Table + pagination live in one bordered card (padded off the drawer
          edges); overflow:hidden clips the table flush to the card border. The
          table fills the card height (rows area full-height) with a fixed
          min-width (scroll.x) that only scrolls on narrow viewports. */}
      <div
        className="seacube-export-history"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          border: "1px solid #e6ebf1",
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
        }}
      >
        <style>{`
          .seacube-export-history,
          .seacube-export-history .seacube-basic-table,
          .seacube-export-history .ant-table-wrapper,
          .seacube-export-history .ant-spin-nested-loading,
          .seacube-export-history .ant-spin-container,
          .seacube-export-history .ant-table { height: 100%; }
          .seacube-export-history .ant-table-thead > tr > th { white-space: nowrap; }
          .seacube-export-history .ant-table-body { min-height: ${scrollY ?? 0}px; }
        `}</style>
        <div ref={areaRef} style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <BasicTable
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={jobs}
            scroll={{ x: 640, y: scrollY }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            minHeight: 44,
            padding: "0 16px",
            borderTop: "1px solid #eef1f5",
          }}
        >
          <Pagination
            size="small"
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            onChange={goPage}
            showTotal={(t, range) =>
              i18n.t("common.pageRange", {
                defaultValue: "{{from}}-{{to}} of {{total}}",
                from: range[0],
                to: range[1],
                total: t,
              })
            }
          />
        </div>
      </div>
    </Drawer>
  );
}
