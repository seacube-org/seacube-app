import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Popconfirm, Spin, Typography, Upload, theme } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useDataService } from "@/hooks/core/useDataService";
import { uploadFormData } from "@/services/DataService";
import { rows } from "@/utils/pagination";
import i18n from "@/locale/i18n";
import AuthImage from "@/components/modules/base/AuthImage";
import FilePreviewModal, { type PreviewFile } from "@/components/modules/attachments/FilePreviewModal";
import { SectionLabel } from "./sections";

// Mirrors MAX_IMAGES_PER_PRODUCT on the backend (enforced server-side too).
const MAX_IMAGES = 15;
const TILE = 140;

type ProductImage = { id: number; download_url: string; sort_order: number; created_at: string };

/**
 * Product image gallery tab: grid of thumbnails (read via the permission-checked
 * download endpoint), drag/click upload and per-image delete. Mutations go to the
 * product-nested ProductImage viewset; clicking a tile opens the shared
 * full-screen previewer. `canEdit` gates upload/delete (inventory_products.update).
 */
export default function ProductGallery({ productId, canEdit }: { productId: number; canEdit: boolean }) {
  const { message } = App.useApp();
  const { getViewSet, handleError } = useDataService();
  const { token } = theme.useToken();
  const base = `/api/products/products/${productId}/images/`;
  const vs = useMemo(() => getViewSet(base), [getViewSet, base]);

  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setImages(rows<ProductImage>(await vs.list({ params: { page_size: 1000 } })));
    } catch {
      message.error(i18n.t("products.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [vs, message]);

  useEffect(() => {
    reload();
  }, [reload]);

  const previewFiles: PreviewFile[] = useMemo(
    () =>
      images.map((im, i) => ({
        fileName: `${i18n.t("products.gallery", { defaultValue: "产品图册" })} #${i + 1}`,
        url: im.download_url,
        mimeType: "image/*",
      })),
    [images],
  );

  const handleUpload: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
    if (images.length >= MAX_IMAGES) {
      message.warning(i18n.t("products.galleryMax", { defaultValue: "最多 {{n}} 张图片", n: MAX_IMAGES }));
      onError?.(new Error("max"));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file as File);
      // The create response is the new row — append it instead of refetching the
      // whole list (multi-file upload fires this once per file).
      const created = await uploadFormData<ProductImage>(base, fd);
      setImages((prev) => [...prev, created]);
      onSuccess?.({});
    } catch (e) {
      void handleError(e).catch(() => {});
      onError?.(e as Error);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await vs.delete({ id });
      setImages((prev) => prev.filter((im) => im.id !== id));
    } catch (e) {
      await reload();
      void handleError(e).catch(() => {});
    }
  };

  const tileBase: React.CSSProperties = {
    position: "relative",
    width: TILE,
    height: TILE,
    borderRadius: 10,
    overflow: "hidden",
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillQuaternary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={{ padding: "8px 0 24px", maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionLabel first>{i18n.t("products.gallery", { defaultValue: "产品图册" })}</SectionLabel>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {images.length}/{MAX_IMAGES}
        </Typography.Text>
      </div>

      {loading ? (
        <Spin style={{ display: "block", margin: "32px auto" }} />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {images.map((im, i) => (
            <div key={im.id} style={{ ...tileBase, cursor: "pointer" }} onClick={() => setPreviewIndex(i)}>
              <AuthImage url={im.download_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {canEdit && (
                // Stop propagation so deleting doesn't also open the previewer.
                <span style={{ position: "absolute", top: 4, insetInlineEnd: 4 }} onClick={(e) => e.stopPropagation()}>
                  <Popconfirm
                    title={i18n.t("products.galleryDeleteConfirm", { defaultValue: "删除这张图片？" })}
                    onConfirm={() => remove(im.id)}
                    okType="danger"
                    placement="topRight"
                  >
                    <Button
                      type="primary"
                      danger
                      size="small"
                      shape="circle"
                      icon={<DeleteOutlined />}
                      aria-label={i18n.t("common.delete", { defaultValue: "删除" })}
                    />
                  </Popconfirm>
                </span>
              )}
            </div>
          ))}

          {canEdit && images.length < MAX_IMAGES && (
            <Upload customRequest={handleUpload} showUploadList={false} accept="image/*" multiple>
              <div
                style={{
                  ...tileBase,
                  flexDirection: "column",
                  gap: 6,
                  cursor: "pointer",
                  border: `1px dashed ${token.colorBorder}`,
                  background: "transparent",
                  color: token.colorTextSecondary,
                }}
              >
                {uploading ? <Spin size="small" /> : <PlusOutlined style={{ fontSize: 22 }} />}
                <span style={{ fontSize: 12 }}>{i18n.t("products.galleryUpload", { defaultValue: "上传图片" })}</span>
              </div>
            </Upload>
          )}

          {!loading && images.length === 0 && !canEdit && (
            <Typography.Text type="secondary">
              {i18n.t("products.galleryEmpty", { defaultValue: "暂无图片" })}
            </Typography.Text>
          )}
        </div>
      )}

      <FilePreviewModal files={previewFiles} openIndex={previewIndex} onClose={() => setPreviewIndex(null)} />
    </div>
  );
}
