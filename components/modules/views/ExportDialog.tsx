import { useMemo, useState } from "react";
import { App, Modal, Radio, Space, Typography } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { AuthError, fetchFileBlob } from "@/services/DataService";
import { saveBlob } from "@/utils/download";
import i18n from "@/locale/i18n";

/** Export job returned by the export endpoint (sync → SUCCESS, large → PENDING). */
type ExportJob = { status: string; download_url: string | null; file_name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  /** ViewSet base URL, e.g. "/api/contacts/contacts/". */
  endpoint: string;
  /** Current-view query: columns (visible, ordered) + filter/search/ordering. */
  exportParams: Record<string, string>;
};

/** "导出当前视图" modal — Zoho-style: pick a format and download the current view. */
export default function ExportDialog({ open, onClose, endpoint, exportParams }: Props) {
  const { message } = App.useApp();
  const { getViewSet, handleError } = useDataService();
  const vs = useMemo(() => getViewSet(endpoint), [getViewSet, endpoint]);
  const [fmt, setFmt] = useState<"csv" | "xlsx">("csv");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      // POST (it records a job / may enqueue) with the view-state in the query
      // string. Returns the job: SUCCESS (small, ready now) or PENDING (large →
      // generated in the background; download from 导出历史).
      const job = (await vs.action({
        action: "export",
        method: "POST",
        params: { ...exportParams, fmt },
      })) as ExportJob;
      if (job.status === "SUCCESS" && job.download_url) {
        saveBlob(await fetchFileBlob(job.download_url), job.file_name);
      } else {
        message.info(
          i18n.t("export.queued", { defaultValue: "数据量较大，已在后台生成，完成后请到「导出历史」下载。" }),
        );
      }
      onClose();
    } catch (e) {
      // An expired session must clear/redirect like other API calls (the raw
      // fetchFileBlob download isn't wrapped by getViewSet's error handling).
      if (e instanceof AuthError) {
        void handleError(e).catch(() => {});
        return;
      }
      message.error(i18n.t("export.failed", { defaultValue: "导出失败，请重试" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={run}
      confirmLoading={busy}
      title={i18n.t("export.title", { defaultValue: "导出当前视图" })}
      okText={i18n.t("export.export", { defaultValue: "导出" })}
      cancelText={i18n.t("common.cancel", { defaultValue: "取消" })}
      width={420}
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
        {i18n.t("export.note", {
          defaultValue: "导出当前视图的可见列（含筛选与排序），最多 10,000 行。",
        })}
      </Typography.Paragraph>
      <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
        {i18n.t("export.format", { defaultValue: "导出文件格式" })}
      </Typography.Text>
      <Radio.Group value={fmt} onChange={(e) => setFmt(e.target.value)}>
        <Space orientation="vertical">
          <Radio value="csv">{i18n.t("export.csv", { defaultValue: "CSV（逗号分隔值）" })}</Radio>
          <Radio value="xlsx">{i18n.t("export.xlsx", { defaultValue: "XLSX（Microsoft Excel）" })}</Radio>
        </Space>
      </Radio.Group>
    </Modal>
  );
}
