import { useState, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { App, Button, Empty, Spin, Tabs, theme } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useContentType } from "@/hooks/core/useContentType";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import { useCan } from "@/stores/authStore";
import CommentsTab from "@/components/modules/comments/CommentsTab";
import AttachmentPanel from "@/components/modules/attachments/AttachmentPanel";
import ProductFormDrawer from "@/components/modules/products/ProductFormDrawer";
import { PRODUCTS_URL } from "@/components/modules/products/shared";
import ProductHeader from "@/components/modules/products/detail/ProductHeader";
import ProductInfoPanel from "@/components/modules/products/detail/ProductInfoPanel";
import ProductOverview from "@/components/modules/products/detail/ProductOverview";
import ProductGallery from "@/components/modules/products/detail/ProductGallery";
import { useProductDetail } from "@/components/modules/products/detail/useProductDetail";
import i18n from "@/locale/i18n";

/** Full-height centered container for the loading / load-failed states. */
function CenteredFill({ children }: { children: ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: token.colorBgContainer,
      }}
    >
      {children}
    </div>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = id ? Number(id) : null;
  const router = useRouter();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const canUpdate = useCan("inventory_products", "update");
  const canDelete = useCan("inventory_products", "delete");
  const schema = useFieldMeta(PRODUCTS_URL);
  const contentTypeId = useContentType("product");

  const { product, loading, reload, remove } = useProductDetail(productId);
  const [editOpen, setEditOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/products" as Href);
  };

  const confirmDelete = () => {
    modal.confirm({
      title: i18n.t("products.deleteConfirm", { defaultValue: "确认删除该产品？" }),
      okText: i18n.t("common.confirm", { defaultValue: "确认" }),
      cancelText: i18n.t("common.cancel", { defaultValue: "取消" }),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (await remove()) goBack();
      },
    });
  };

  if (loading) {
    return (
      <CenteredFill>
        <Spin />
      </CenteredFill>
    );
  }

  // Load failed (deleted / forbidden / bad id) — offer a way back instead of
  // an indefinite spinner.
  if (!product) {
    return (
      <CenteredFill>
        <Empty description={i18n.t("products.loadFailed", { defaultValue: "加载失败" })}>
          <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
            {i18n.t("common.back", { defaultValue: "返回" })}
          </Button>
        </Empty>
      </CenteredFill>
    );
  }

  const activityReady = contentTypeId != null && productId != null;
  const tabSpinner = <Spin style={{ display: "block", margin: "24px auto" }} />;
  const tabs = [
    {
      key: "overview",
      label: i18n.t("products.tabOverview", { defaultValue: "概览" }),
      children: <ProductOverview product={product} />,
    },
    {
      key: "gallery",
      label: i18n.t("products.gallery", { defaultValue: "产品图册" }),
      children: <ProductGallery productId={product.id} canEdit={canUpdate} />,
    },
    {
      key: "timeline",
      label: i18n.t("products.timeline", { defaultValue: "动态" }),
      children: activityReady ? <CommentsTab contentTypeId={contentTypeId} objectId={productId} /> : tabSpinner,
    },
    {
      key: "files",
      label: i18n.t("products.files", { defaultValue: "文件" }),
      children: activityReady ? <AttachmentPanel contentTypeId={contentTypeId} objectId={productId} /> : tabSpinner,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: token.colorBgContainer,
      }}
    >
      <ProductHeader
        product={product}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onBack={goBack}
        onEdit={() => setEditOpen(true)}
        onDelete={confirmDelete}
      />

      {/* A single scroll on the whole body (not per-column) → one scrollbar. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflowY: "auto" }}>
        <ProductInfoPanel product={product} schema={schema} />
        <div style={{ flex: 1, minWidth: 0, padding: "16px 24px 24px" }}>
          <Tabs defaultActiveKey="overview" items={tabs} />
        </div>
      </div>

      <ProductFormDrawer open={editOpen} product={product} onClose={() => setEditOpen(false)} onSaved={reload} />
    </div>
  );
}
