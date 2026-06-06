import { useState, useEffect, useCallback, useMemo } from "react";
import { List, Upload, Button, Popconfirm, Typography, Space, theme } from "antd";
import { UploadOutlined, DeleteOutlined, FileOutlined, PaperClipOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { uploadFormData } from "@/services/DataService";
import { API_BASE_URL } from "@/constants/Constants";
import i18n from "@/locale/i18n";

type Attachment = {
  id: number;
  file: string;
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

export default function AttachmentPanel({ contentTypeId, objectId }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { getViewSet, handleError } = useDataService();
  const { token } = theme.useToken();

  const vs = useMemo(() => getViewSet("/api/attachments/"), [getViewSet]);

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
    <div style={{ padding: "16px 0" }}>
      <Space style={{ marginBottom: 12 }} align="center">
        <PaperClipOutlined style={{ color: token.colorPrimary }} />
        <Typography.Text strong>{i18n.t("attachment.title")}</Typography.Text>
      </Space>

      <Upload customRequest={handleUpload} showUploadList={false} multiple>
        <Button icon={<UploadOutlined />} loading={uploading} size="small">
          {i18n.t("attachment.upload")}
        </Button>
      </Upload>

      <List
        loading={loading}
        dataSource={attachments}
        locale={{ emptyText: i18n.t("attachment.noFiles") }}
        style={{ marginTop: 12 }}
        size="small"
        renderItem={(item) => (
          <List.Item
            actions={[
              <Popconfirm
                key="del"
                title={i18n.t("attachment.deleteConfirm")}
                onConfirm={() => handleDelete(item.id)}
                okType="danger"
              >
                <Button type="text" size="small" icon={<DeleteOutlined />} danger />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={<FileOutlined style={{ fontSize: 20, color: token.colorTextSecondary }} />}
              title={
                <Typography.Link
                  href={item.file.startsWith("http") ? item.file : `${API_BASE_URL}${item.file}`}
                  target="_blank"
                >
                  {item.file_name}
                </Typography.Link>
              }
              description={
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatBytes(item.file_size)} · {item.uploaded_by?.display_name || item.uploaded_by?.username}
                </Typography.Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
