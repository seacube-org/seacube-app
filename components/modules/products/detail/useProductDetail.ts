import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import i18n from "@/locale/i18n";
import { useProductViewSet, type ProductDetail } from "@/components/modules/products/shared";

/**
 * Loads one product and exposes `reload` + `remove` (both toast on failure).
 * `remove` returns true on success so the caller can navigate away.
 */
export function useProductDetail(productId: number | null) {
  const vs = useProductViewSet();
  const { message } = App.useApp();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (productId == null) return;
    setLoading(true);
    try {
      setProduct((await vs.retrieve({ id: productId })) as ProductDetail);
    } catch {
      // Clear any previously loaded product so a failed reload (e.g. navigating to
      // a deleted/forbidden record) shows the load-failed state, not stale data.
      setProduct(null);
      message.error(i18n.t("products.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [productId, vs, message]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = useCallback(async (): Promise<boolean> => {
    if (productId == null) return false;
    try {
      await vs.delete({ id: productId });
      message.success(i18n.t("products.deleted", { defaultValue: "已删除" }));
      return true;
    } catch {
      message.error(i18n.t("products.deleteFailed", { defaultValue: "删除失败" }));
      return false;
    }
  }, [productId, vs, message]);

  return { product, loading, reload, remove };
}
