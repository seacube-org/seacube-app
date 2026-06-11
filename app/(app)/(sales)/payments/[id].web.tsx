import { type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Button, Empty, Spin, Tabs, theme } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useContentType } from "@/hooks/core/useContentType";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import { useCan } from "@/stores/authStore";
import CommentsTab from "@/components/modules/comments/CommentsTab";
import AttachmentPanel from "@/components/modules/attachments/AttachmentPanel";
import DocumentHeader from "@/components/modules/sales/shared/DocumentHeader";
import { useDocumentDetail } from "@/components/modules/sales/shared/useDocumentDetail";
import type { DocAction } from "@/components/modules/sales/shared/types";
import { PAYMENTS_URL, type PaymentDetail } from "@/components/modules/sales/payment/shared";
import PaymentInfoPanel from "@/components/modules/sales/payment/detail/PaymentInfoPanel";
import PaymentOverview from "@/components/modules/sales/payment/detail/PaymentOverview";
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

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const paymentId = id ? Number(id) : null;
  const router = useRouter();
  const { token } = theme.useToken();
  const schema = useFieldMeta(PAYMENTS_URL);
  const contentTypeId = useContentType("paymentreceived");
  // Void is a POST action gated on module `create`; payments are never editable
  // (no PUT), so canUpdate is left false and the Edit button never shows.
  const canVoid = useCan("sales_payments", "create");

  const { data: payment, loading, runAction } = useDocumentDetail<PaymentDetail>(PAYMENTS_URL, paymentId);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(sales)/payments" as Href);
  };

  if (loading) {
    return (
      <CenteredFill>
        <Spin />
      </CenteredFill>
    );
  }

  // Load failed (voided-away / forbidden / bad id) — offer a way back instead of
  // an indefinite spinner.
  if (!payment) {
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

  // Payments are create-only + void: no edit, no delete. Only a void action while
  // the payment is still NORMAL.
  const actions: DocAction[] =
    payment.status === "NORMAL"
      ? [
          {
            key: "void",
            label: i18n.t("sales.void", { defaultValue: "作废" }),
            action: "void",
            danger: true,
            confirm: i18n.t("sales.voidPaymentConfirm", { defaultValue: "确认作废该收款？将冲销凭证" }),
          },
        ]
      : [];

  const activityReady = contentTypeId != null && paymentId != null;
  const tabSpinner = <Spin style={{ display: "block", margin: "24px auto" }} />;
  const tabs = [
    {
      key: "overview",
      label: i18n.t("sales.tabOverview", { defaultValue: "概览" }),
      children: <PaymentOverview payment={payment} />,
    },
    {
      key: "timeline",
      label: i18n.t("sales.timeline", { defaultValue: "动态" }),
      children: activityReady ? <CommentsTab contentTypeId={contentTypeId} objectId={paymentId} /> : tabSpinner,
    },
    {
      key: "files",
      label: i18n.t("sales.files", { defaultValue: "文件" }),
      children: activityReady ? <AttachmentPanel contentTypeId={contentTypeId} objectId={paymentId} /> : tabSpinner,
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
        title={i18n.t("sales.payment", { defaultValue: "收款" })}
        number={payment.payment_number}
        status={payment.status}
        createdByName={payment.created_by_display?.display_name}
        documentType="payment_receipt"
        documentId={payment.id}
        actions={actions}
        onRunAction={async (a) => {
          await runAction(a);
        }}
        canAct={canVoid}
        canUpdate={false}
        canDelete={false}
        onBack={goBack}
      />

      {/* A single scroll on the whole body (not per-column) → one scrollbar. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflowY: "auto" }}>
        <PaymentInfoPanel payment={payment} schema={schema} />
        <div style={{ flex: 1, minWidth: 0, padding: "16px 24px 24px" }}>
          <Tabs defaultActiveKey="overview" items={tabs} />
        </div>
      </div>
    </div>
  );
}
