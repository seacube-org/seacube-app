import { useState, useEffect, useCallback, useMemo } from "react";
import { Upload, Button, Popconfirm, Typography, Spin, theme } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { uploadFormData } from "@/services/DataService";
import i18n from "@/locale/i18n";
import { SectionLabel, TAB_PANE_STYLE } from "@/components/modules/base/sections";
import FilePreviewModal, { type PreviewFile } from "./FilePreviewModal";
import { fileTypeIcon } from "./shared";

const { Dragger } = Upload;

type Attachment = {
  id: number;
  download_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: { username: string; display_name: string } | null;
  created_at: string;
};

type Props = { contentTypeId: number; objectId: number | string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AttachmentPanel({ contentTypeId, objectId }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const { getViewSet, handleError } = useDataService();
  const { token } = theme.useToken();

  const vs = useMemo(() => getViewSet("/api/attachments/"), [getViewSet]);

  const previewFiles: PreviewFile[] = useMemo(
    () =>
      attachments.map((a) => {
        const uploader = a.uploaded_by?.display_name || a.uploaded_by?.username;
        return {
          fileName: a.file_name,
          url: a.download_url,
          mimeType: a.mime_type,
          meta: [formatBytes(a.file_size), formatDate(a.created_at), uploader].filter(Boolean).join(" · "),
          uploadedBy: uploader,
        };
      }),
    [attachments],
  );

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vs.list({
        params: { content_type_id: contentTypeId, object_id: String(objectId), page_size: 1000 },
      });
      setAttachments((data as { results: Attachment[] }).results ?? (data as Attachment[]));
    } finally {
      setLoading(false);
    }
  }, [vs, contentTypeId, objectId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpload: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file as File);
      formData.append("content_type_id", String(contentTypeId));
      formData.append("object_id", String(objectId));
      await uploadFormData("/api/attachments/", formData);
      await fetchAttachments();
      onSuccess?.({});
    } catch (e) {
      void handleError(e).catch(() => {});
      onError?.(e as Error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await vs.delete({ id });
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      await fetchAttachments();
      void handleError(e).catch(() => {});
    }
  };

  return (
    <div style={TAB_PANE_STYLE}>
      <SectionLabel first>{i18n.t("attachment.title")}</SectionLabel>

      <Dragger
        customRequest={handleUpload}
        showUploadList={false}
        multiple
        style={{ background: token.colorFillQuaternary, borderRadius: token.borderRadiusLG }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "4px 12px" }}>
          {uploading ? (
            <Spin size="small" />
          ) : (
            <UploadOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />
          )}
          <Typography.Text type="secondary">
            {i18n.t("attachment.dropHint")}
            <Typography.Link>{i18n.t("attachment.browse")}</Typography.Link>
          </Typography.Text>
        </div>
      </Dragger>

      <div style={{ marginTop: 8 }}>
        {loading ? (
          <Spin style={{ display: "block", margin: "24px auto" }} />
        ) : attachments.length === 0 ? (
          <Typography.Text type="secondary" style={{ display: "block", textAlign: "center", padding: "16px 0" }}>
            {i18n.t("attachment.noFiles")}
          </Typography.Text>
        ) : (
          attachments.map((item, i) => {
            const Icon = fileTypeIcon(item.mime_type);
            const uploader = item.uploaded_by?.display_name || item.uploaded_by?.username;
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 4px",
                  borderBottom: `1px solid ${token.colorSplit}`,
                }}
              >
                <Icon style={{ fontSize: 26, color: token.colorTextSecondary, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Typography.Link strong ellipsis style={{ display: "block" }} onClick={() => setPreviewIndex(i)}>
                    {item.file_name}
                  </Typography.Link>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {formatBytes(item.file_size)}
                    {" · "}
                    {formatDate(item.created_at)}
                    {uploader ? ` · ${uploader}` : ""}
                  </Typography.Text>
                </div>
                <Popconfirm
                  title={i18n.t("attachment.deleteConfirm")}
                  onConfirm={() => handleDelete(item.id)}
                  okType="danger"
                  placement="topRight"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    aria-label={i18n.t("common.delete")}
                    style={{ flexShrink: 0 }}
                  />
                </Popconfirm>
              </div>
            );
          })
        )}
      </div>

      <FilePreviewModal files={previewFiles} openIndex={previewIndex} onClose={() => setPreviewIndex(null)} />
    </div>
  );
}
