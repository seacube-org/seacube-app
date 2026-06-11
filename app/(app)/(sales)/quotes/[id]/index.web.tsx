import { useMemo, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { App, Button, Empty, Spin, Tabs, theme } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useContentType } from "@/hooks/core/useContentType";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import { useRefetchOnRefocus } from "@/hooks/core/useRefetchOnRefocus";
import { useCan } from "@/stores/authStore";
import CommentsTab from "@/components/modules/comments/CommentsTab";
import AttachmentPanel from "@/components/modules/attachments/AttachmentPanel";
import { useDocumentDetail } from "@/components/modules/sales/shared/useDocumentDetail";
import type { DocAction } from "@/components/modules/sales/shared/types";
import DocumentHeader from "@/components/modules/sales/shared/DocumentHeader";
import QuoteInfoPanel from "@/components/modules/sales/quote/detail/QuoteInfoPanel";
import QuoteOverview from "@/components/modules/sales/quote/detail/QuoteOverview";
import { QUOTES_URL, type QuoteDetail } from "@/components/modules/sales/quote/shared";
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

/** Legal status transitions / conversions for the quote's current status. */
function actionsForStatus(status: string): DocAction[] {
  switch (status) {
    case "DRAFT":
      return [
        { key: "send", label: i18n.t("sales.actionSend", { defaultValue: "发送" }), action: "send", primary: true },
        {
          key: "void",
          label: i18n.t("sales.actionVoid", { defaultValue: "作废" }),
          action: "void",
          danger: true,
          confirm: i18n.t("sales.confirmVoidQuote", { defaultValue: "确认作废该报价单？" }),
        },
      ];
    case "SENT":
      return [
        {
          key: "accept",
          label: i18n.t("sales.actionAccept", { defaultValue: "接受" }),
          action: "accept",
          primary: true,
        },
        { key: "decline", label: i18n.t("sales.actionDecline", { defaultValue: "拒绝" }), action: "decline" },
        {
          key: "void",
          label: i18n.t("sales.actionVoid", { defaultValue: "作废" }),
          action: "void",
          danger: true,
          confirm: i18n.t("sales.confirmVoid", { defaultValue: "确认作废？" }),
        },
      ];
    case "ACCEPTED":
      return [
        {
          key: "convert",
          label: i18n.t("sales.actionConvertToOrder", { defaultValue: "转销售订单" }),
          action: "convert-to-order",
          primary: true,
        },
      ];
    default:
      return [];
  }
}

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const quoteId = id ? Number(id) : null;
  const router = useRouter();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const canUpdate = useCan("sales_quotes", "update");
  const canDelete = useCan("sales_quotes", "delete");
  // Status transitions / conversions are POST actions → gated on `create` (not `update`).
  const canCreate = useCan("sales_quotes", "create");
  const schema = useFieldMeta(QUOTES_URL);
  const contentTypeId = useContentType("quote");

  const { data, loading, reload, remove, runAction } = useDocumentDetail<QuoteDetail>(QUOTES_URL, quoteId);
  // Refresh after returning from the full-page edit form.
  useRefetchOnRefocus(reload);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(sales)/quotes" as Href);
  };

  const confirmDelete = () => {
    modal.confirm({
      title: i18n.t("sales.deleteQuoteConfirm", { defaultValue: "确认删除该报价单？" }),
      okText: i18n.t("common.confirm", { defaultValue: "确认" }),
      cancelText: i18n.t("common.cancel", { defaultValue: "取消" }),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (await remove()) goBack();
      },
    });
  };

  const actions = useMemo<DocAction[]>(() => (data ? actionsForStatus(data.status) : []), [data]);

  const onRunAction = async (a: DocAction) => {
    const res = await runAction(a);
    // Converting an accepted quote returns the freshly created sales order — jump
    // straight to its detail page.
    if (a.action === "convert-to-order" && res && typeof res === "object" && "id" in res) {
      const newId = (res as { id: number }).id;
      router.push(`/(app)/(sales)/orders/${newId}` as Href);
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

  const activityReady = contentTypeId != null && quoteId != null;
  const tabSpinner = <Spin style={{ display: "block", margin: "24px auto" }} />;
  const tabs = [
    {
      key: "overview",
      label: i18n.t("sales.tabOverview", { defaultValue: "概览" }),
      children: <QuoteOverview quote={data} />,
    },
    {
      key: "timeline",
      label: i18n.t("sales.timeline", { defaultValue: "动态" }),
      children: activityReady ? <CommentsTab contentTypeId={contentTypeId} objectId={quoteId} /> : tabSpinner,
    },
    {
      key: "files",
      label: i18n.t("sales.files", { defaultValue: "文件" }),
      children: activityReady ? <AttachmentPanel contentTypeId={contentTypeId} objectId={quoteId} /> : tabSpinner,
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
        title={i18n.t("sales.quote", { defaultValue: "报价单" })}
        number={data.quote_number}
        status={data.display_status}
        createdByName={data.created_by_display?.display_name}
        documentType="quote"
        documentId={data.id}
        actions={actions}
        onRunAction={onRunAction}
        canAct={canCreate}
        canUpdate={canUpdate}
        editable={data.status === "DRAFT"}
        onEdit={() => router.push(`/(app)/(sales)/quotes/${data.id}/edit` as Href)}
        canDelete={canDelete}
        onDelete={confirmDelete}
        onBack={goBack}
      />

      {/* A single scroll on the whole body (not per-column) → one scrollbar. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflowY: "auto" }}>
        <QuoteInfoPanel quote={data} schema={schema} />
        <div style={{ flex: 1, minWidth: 0, padding: "16px 24px 24px" }}>
          <Tabs defaultActiveKey="overview" items={tabs} />
        </div>
      </div>
    </div>
  );
}
