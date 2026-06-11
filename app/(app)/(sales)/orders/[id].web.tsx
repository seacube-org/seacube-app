import { useMemo, useState, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { App, Button, Empty, Spin, Tabs, theme } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useContentType } from "@/hooks/core/useContentType";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import { useCan } from "@/stores/authStore";
import CommentsTab from "@/components/modules/comments/CommentsTab";
import AttachmentPanel from "@/components/modules/attachments/AttachmentPanel";
import DocumentHeader from "@/components/modules/sales/shared/DocumentHeader";
import { useDocumentDetail } from "@/components/modules/sales/shared/useDocumentDetail";
import type { DocAction } from "@/components/modules/sales/shared/types";
import SalesOrderFormDrawer from "@/components/modules/sales/sales-order/SalesOrderFormDrawer";
import SalesOrderInfoPanel from "@/components/modules/sales/sales-order/detail/SalesOrderInfoPanel";
import SalesOrderOverview from "@/components/modules/sales/sales-order/detail/SalesOrderOverview";
import { SO_ORDERS_URL, type SalesOrderDetail } from "@/components/modules/sales/sales-order/shared";
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

/** Legal status transitions / conversions for the current sales-order status. */
function buildActions(status: string, invoiceStatus?: string): DocAction[] {
  switch (status) {
    case "DRAFT":
      return [
        { key: "confirm", label: i18n.t("sales.confirm", { defaultValue: "确认" }), action: "confirm", primary: true },
        {
          key: "cancel",
          label: i18n.t("sales.cancel", { defaultValue: "取消" }),
          action: "cancel",
          danger: true,
          confirm: i18n.t("sales.cancelOrderConfirm", { defaultValue: "确认取消该销售订单？" }),
        },
      ];
    case "CONFIRMED":
      return [
        // Fully invoiced orders have nothing left to invoice — the backend
        // rejects the action, so don't offer it.
        ...(invoiceStatus === "FULLY_INVOICED"
          ? []
          : [
              {
                key: "invoice",
                label: i18n.t("sales.createInvoice", { defaultValue: "生成发票" }),
                action: "create-invoice",
                primary: true,
              },
            ]),
        {
          key: "cancel",
          label: i18n.t("sales.cancel", { defaultValue: "取消" }),
          action: "cancel",
          danger: true,
          confirm: i18n.t("sales.cancelConfirm", { defaultValue: "确认取消？" }),
        },
      ];
    default:
      return [];
  }
}

export default function SalesOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id ? Number(id) : null;
  const router = useRouter();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const canUpdate = useCan("sales_orders", "update");
  const canDelete = useCan("sales_orders", "delete");
  // Status transitions / conversions are POST actions → gated on `create` (not `update`).
  const canCreate = useCan("sales_orders", "create");
  const schema = useFieldMeta(SO_ORDERS_URL);
  const contentTypeId = useContentType("salesorder");

  const { data, loading, reload, remove, runAction } = useDocumentDetail<SalesOrderDetail>(SO_ORDERS_URL, orderId);
  const [editOpen, setEditOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(sales)/orders" as Href);
  };

  const confirmDelete = () => {
    modal.confirm({
      title: i18n.t("sales.deleteOrderConfirm", { defaultValue: "确认删除该销售订单？" }),
      okText: i18n.t("common.confirm", { defaultValue: "确认" }),
      cancelText: i18n.t("common.cancel", { defaultValue: "取消" }),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (await remove()) goBack();
      },
    });
  };

  // Built before the early returns so the hooks order stays stable.
  const actions = useMemo<DocAction[]>(() => (data ? buildActions(data.status, data.invoice_status) : []), [data]);

  const onRunAction = async (a: DocAction) => {
    const res = await runAction(a);
    // Converting to an invoice returns the new invoice — jump straight to it.
    if (a.action === "create-invoice" && res && typeof res === "object" && "id" in res) {
      const newId = (res as { id: number }).id;
      router.push(`/(app)/(sales)/invoices/${newId}` as Href);
    }
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
  if (!data) {
    return (
      <CenteredFill>
        <Empty description={i18n.t("sales.loadFailed", { defaultValue: "加载失败" })}>
          <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
            {i18n.t("common.back", { defaultValue: "返回" })}
          </Button>
        </Empty>
      </CenteredFill>
    );
  }

  const editable = data.status === "DRAFT";
  const activityReady = contentTypeId != null && orderId != null;
  const tabSpinner = <Spin style={{ display: "block", margin: "24px auto" }} />;
  const tabs = [
    {
      key: "overview",
      label: i18n.t("sales.tabOverview", { defaultValue: "概览" }),
      children: <SalesOrderOverview order={data} schema={schema} />,
    },
    {
      key: "timeline",
      label: i18n.t("sales.timeline", { defaultValue: "动态" }),
      children: activityReady ? <CommentsTab contentTypeId={contentTypeId} objectId={orderId} /> : tabSpinner,
    },
    {
      key: "files",
      label: i18n.t("sales.files", { defaultValue: "文件" }),
      children: activityReady ? <AttachmentPanel contentTypeId={contentTypeId} objectId={orderId} /> : tabSpinner,
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
      <DocumentHeader
        title={i18n.t("sales.salesOrder", { defaultValue: "销售订单" })}
        number={data.order_number}
        status={data.display_status ?? data.status}
        createdByName={data.created_by_display?.display_name}
        documentType="sales_order"
        documentId={data.id}
        actions={actions}
        onRunAction={onRunAction}
        canAct={canCreate}
        canUpdate={canUpdate}
        editable={editable}
        onEdit={() => setEditOpen(true)}
        canDelete={canDelete}
        onDelete={confirmDelete}
        onBack={goBack}
      />

      {/* A single scroll on the whole body (not per-column) → one scrollbar. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflowY: "auto" }}>
        <SalesOrderInfoPanel order={data} schema={schema} />
        <div style={{ flex: 1, minWidth: 0, padding: "16px 24px 24px" }}>
          <Tabs defaultActiveKey="overview" items={tabs} />
        </div>
      </div>

      <SalesOrderFormDrawer open={editOpen} order={data} onClose={() => setEditOpen(false)} onSaved={reload} />
    </div>
  );
}
