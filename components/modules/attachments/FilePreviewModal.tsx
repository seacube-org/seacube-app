import { useCallback, useEffect, useState } from "react";
import { Modal, Button, Typography, Avatar, Spin, theme } from "antd";
import {
  CloseOutlined,
  DownloadOutlined,
  ExportOutlined,
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateRightOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { fetchFileBlob, AuthError } from "@/services/DataService";
import { useDataService } from "@/hooks/core/useDataService";
import i18n from "@/locale/i18n";
import { isImage, isPdf, fileTypeIcon } from "./shared";

export type PreviewFile = {
  fileName: string;
  url: string;
  mimeType: string;
  meta?: string;
  uploadedBy?: string;
};

type Props = { files: PreviewFile[]; openIndex: number | null; onClose: () => void };

/**
 * Full-screen attachment previewer: header with file info + actions, a dark
 * stage (images zoom/rotate, PDFs embed, others fall back to download),
 * prev/next navigation and a thumbnail strip to switch between files.
 *
 * Files are read via an authenticated fetch into a same-origin blob: URL —
 * the bytes live behind a permission-checked endpoint, so a plain <img>/<iframe>
 * src (which can't send the auth header) won't work.
 */
export default function FilePreviewModal({ files, openIndex, onClose }: Props) {
  const { token } = theme.useToken();
  const { handleError } = useDataService();
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobState, setBlobState] = useState<"loading" | "ready" | "error">("loading");

  const open = openIndex !== null;
  const file = open ? files[index] : null;

  // Sync internal index whenever the modal is (re)opened at a given file.
  useEffect(() => {
    if (openIndex !== null) setIndex(openIndex);
  }, [openIndex]);

  // Reset zoom/rotate when the shown file changes.
  useEffect(() => {
    setScale(1);
    setRotate(0);
  }, [index, openIndex]);

  // Fetch the current file as an authenticated blob and expose it as an object URL.
  useEffect(() => {
    if (!file) {
      setBlobUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    setBlobState("loading");
    setBlobUrl(null);
    fetchFileBlob(file.url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setBlobState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 after a failed refresh: route through the app error path so tokens
        // are cleared and the user is redirected to login, like other API calls.
        if (err instanceof AuthError) {
          handleError(err);
          return;
        }
        setBlobState("error");
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, handleError]);

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(files.length - 1, Math.max(0, i + delta))),
    [files.length],
  );

  // Arrow-key navigation while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const ready = blobState === "ready" && blobUrl !== null;

  const handleOpenExternal = () => {
    if (blobUrl) window.open(blobUrl, "_blank");
  };

  const handleDownload = () => {
    if (!blobUrl || !file) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const hasPrev = index > 0;
  const hasNext = index < files.length - 1;

  const renderStage = () => {
    if (!file) return null;
    if (blobState === "loading") return <Spin />;
    if (!ready) {
      return (
        <Typography.Text style={{ color: "rgba(255,255,255,0.65)" }}>{i18n.t("common.loadFailed")}</Typography.Text>
      );
    }
    if (isImage(file.mimeType)) {
      return (
        <img
          src={blobUrl!}
          alt={file.fileName}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            transform: `scale(${scale}) rotate(${rotate}deg)`,
            transition: "transform 0.2s ease",
            boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
          }}
        />
      );
    }
    if (isPdf(file.mimeType)) {
      return (
        <iframe
          src={blobUrl!}
          title={file.fileName}
          style={{ width: "100%", height: "100%", border: "none", background: "#fff", borderRadius: token.borderRadius }}
        />
      );
    }
    return (
      <Typography.Text style={{ color: "rgba(255,255,255,0.65)" }}>{i18n.t("attachment.noPreview")}</Typography.Text>
    );
  };

  const navBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
  };
  const toolBtnStyle: React.CSSProperties = { color: "#fff" };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width="100vw"
      style={{ top: 0, maxWidth: "100vw", paddingBottom: 0 }}
      styles={{
        container: {
          height: "100vh",
          padding: 0,
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        body: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 0 },
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          flexShrink: 0,
          borderBottom: `1px solid ${token.colorSplit}`,
        }}
      >
        <Avatar style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}>
          {(file?.uploadedBy?.trim()[0] || "?").toUpperCase()}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text strong ellipsis style={{ display: "block", fontSize: 15 }}>
            {file?.fileName}
          </Typography.Text>
          {file?.meta && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {file.meta}
            </Typography.Text>
          )}
        </div>
        <Button
          shape="circle"
          type="text"
          icon={<ExportOutlined />}
          onClick={handleOpenExternal}
          disabled={!ready}
          title={i18n.t("common.open")}
        />
        <Button
          shape="circle"
          type="text"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          disabled={!ready}
          title={i18n.t("attachment.download")}
        />
        <Button shape="circle" type="text" icon={<CloseOutlined />} onClick={onClose} title={i18n.t("common.close")} />
      </div>

      {/* Stage */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          background: "#2b2f33",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          overflow: "auto",
        }}
      >
        {renderStage()}

        {hasPrev && (
          <Button shape="circle" icon={<LeftOutlined />} onClick={() => go(-1)} style={{ ...navBtnStyle, left: 16 }} />
        )}
        {hasNext && (
          <Button shape="circle" icon={<RightOutlined />} onClick={() => go(1)} style={{ ...navBtnStyle, right: 16 }} />
        )}

        {file && isImage(file.mimeType) && ready && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <Button
              type="text"
              icon={<ZoomOutOutlined />}
              onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}
              style={toolBtnStyle}
            />
            <Button
              type="text"
              icon={<ZoomInOutlined />}
              onClick={() => setScale((s) => Math.min(4, s + 0.25))}
              style={toolBtnStyle}
            />
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.3)", margin: "0 4px" }} />
            <Button type="text" icon={<RotateRightOutlined />} onClick={() => setRotate((r) => r + 90)} style={toolBtnStyle} />
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => {
                setScale(1);
                setRotate(0);
              }}
              style={toolBtnStyle}
            />
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {files.length > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 16px",
            flexShrink: 0,
            overflowX: "auto",
            borderTop: `1px solid ${token.colorSplit}`,
          }}
        >
          {files.map((f, i) => {
            const Icon = fileTypeIcon(f.mimeType);
            const active = i === index;
            return (
              <div
                key={i}
                onClick={() => setIndex(i)}
                title={f.fileName}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: token.borderRadius,
                  cursor: "pointer",
                  flexShrink: 0,
                  border: `2px solid ${active ? token.colorPrimary : "transparent"}`,
                  background: token.colorFillQuaternary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon style={{ fontSize: 20, color: token.colorTextSecondary }} />
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
