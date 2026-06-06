import { useState, useMemo } from "react";
import { Button, Modal, List, Tag, Spin, Typography, theme } from "antd";
import { FilePdfOutlined, CheckOutlined } from "@ant-design/icons";
import { useDataService } from "@/hooks/core/useDataService";
import { downloadBlob } from "@/services/DataService";
import i18n from "@/locale/i18n";

type Template = {
  id: number;
  name: string;
  is_default: boolean;
  is_system: boolean;
};

type Props = { documentType: string; documentId: number | string };

export default function ExportPdfButton({ documentType, documentId }: Props) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { token } = theme.useToken();
  const { getViewSet, handleError } = useDataService();
  const templateVs = useMemo(() => getViewSet("/api/document-templates/templates/"), [getViewSet]);

  const openModal = async () => {
    setOpen(true);
    setLoadingTemplates(true);
    try {
      const data = await templateVs.list({ params: { document_type: documentType, page_size: 1000 } });
      const list: Template[] = (data as { results?: Template[] }).results ?? (data as Template[]);
      setTemplates(list);
      const def = list.find((t) => t.is_default) ?? list[0] ?? null;
      setSelectedId(def?.id ?? null);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleDownload = async () => {
    if (selectedId === null) return;
    setDownloading(true);
    try {
      const blob = await downloadBlob(
        `/api/document-templates/templates/${selectedId}/render_pdf/?document_id=${documentId}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentType}_${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      setOpen(false);
    } catch (e) {
      void handleError(e).catch(() => {});
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Button icon={<FilePdfOutlined />} onClick={openModal} size="small">
        {i18n.t("template.exportPdf")}
      </Button>

      <Modal
        open={open}
        title={i18n.t("template.selectTemplate")}
        onCancel={() => {
          setOpen(false);
          setTemplates([]);
          setSelectedId(null);
        }}
        onOk={handleDownload}
        okText={i18n.t("template.download")}
        okButtonProps={{ disabled: selectedId === null, loading: downloading }}
        width={480}
      >
        {loadingTemplates ? (
          <Spin style={{ display: "block", margin: "24px auto" }} />
        ) : templates.length === 0 ? (
          <Typography.Text type="secondary">{i18n.t("template.noTemplates")}</Typography.Text>
        ) : (
          <List
            dataSource={templates}
            size="small"
            renderItem={(tpl) => {
              const active = tpl.id === selectedId;
              return (
                <List.Item
                  onClick={() => setSelectedId(tpl.id)}
                  style={{
                    cursor: "pointer",
                    borderRadius: token.borderRadius,
                    padding: "8px 12px",
                    background: active ? token.colorPrimaryBg : undefined,
                    border: active ? `1px solid ${token.colorPrimary}` : `1px solid transparent`,
                    marginBottom: 6,
                  }}
                  extra={active ? <CheckOutlined style={{ color: token.colorPrimary }} /> : null}
                >
                  <List.Item.Meta
                    title={<Typography.Text strong={active}>{tpl.name}</Typography.Text>}
                    description={
                      <span>
                        {tpl.is_default && (
                          <Tag color="blue" style={{ fontSize: 11 }}>
                            {i18n.t("template.default")}
                          </Tag>
                        )}
                        {tpl.is_system && (
                          <Tag color="default" style={{ fontSize: 11 }}>
                            {i18n.t("template.system")}
                          </Tag>
                        )}
                      </span>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Modal>
    </>
  );
}
