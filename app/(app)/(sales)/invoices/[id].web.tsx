import { useMemo, useState, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { App, Button, Empty, Spin, Tabs, theme } from "antd";
import { ArrowLeftOutlined, DollarOutlined } from "@ant-design/icons";
import { useContentType } from "@/hooks/core/useContentType";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import { useCan } from "@/stores/authStore";
import CommentsTab from "@/components/modules/comments/CommentsTab";
import AttachmentPanel from "@/components/modules/attachments/AttachmentPanel";
import DocumentHeader from "@/components/modules/sales/shared/DocumentHeader";
import { useDocumentDetail } from "@/components/modules/sales/shared/useDocumentDetail";
import type { DocAction } from "@/components/modules/sales/shared/types";
import { INVOICES_URL, useInvoiceViewSet, type InvoiceDetail } from "@/components/modules/sales/invoice/shared";
import InvoiceFormDrawer from "@/components/modules/sales/invoice/InvoiceFormDrawer";
import InvoiceInfoPanel from "@/components/modules/sales/invoice/detail/InvoiceInfoPanel";
import InvoiceOverview from "@/components/modules/sales/invoice/detail/InvoiceOverview";
import RecordPaymentModal, { type RecordPaymentBody } from "@/components/modules/sales/invoice/RecordPaymentModal";
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

/** Legal status transitions for the current invoice status (see InvoiceViewSet). */
function actionsFor(status: string): DocAction[] {
  switch (status) {
    case "DRAFT":
      return [
        { key: "send", label: i18n.t("sales.send", { defaultValue: "发送" }), action: "send", primary: true },
        {
          key: "void",
          label: i18n.t("sales.void", { defaultValue: "作废" }),
          action: "void",
          danger: true,
          confirm: i18n.t("sales.voidDraftConfirm", { defaultValue: "确认作废该发票？" }),
        },
      ];
    case "SENT":
    case "PARTIALLY_PAID":
      return [
        {
          key: "void",
          label: i18n.t("sales.void", { defaultValue: "作废" }),
          action: "void",
          danger: true,
          confirm: i18n.t("sales.voidConfirm", { defaultValue: "确认作废？将冲销相关凭证" }),
        },
      ];
    case "PAID":
      return [
        {
          key: "void",
          label: i18n.t("sales.void", { defaultValue: "作废" }),
          action: "void",
          danger: true,
          confirm: i18n.t("sales.voidPaidConfirm", { defaultValue: "确认作废？将冲销已关联的收款" }),
        },
      ];
    default:
      return [];
  }
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = id ? Number(id) : null;
  const router = useRouter();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const canUpdate = useCan("sales_invoices", "update");
  const canDelete = useCan("sales_invoices", "delete");
  // send / void / record-payment are POST actions → gated on `create` (not `update`).
  const canCreate = useCan("sales_invoices", "create");
  const schema = useFieldMeta(INVOICES_URL);
  const contentTypeId = useContentType("invoice");
  const vs = useInvoiceViewSet();

  const { data, loading, reload, remove, runAction } = useDocumentDetail<InvoiceDetail>(INVOICES_URL, invoiceId);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(sales)/invoices" as Href);
  };

  const onRunAction = async (a: DocAction) => {
    await runAction(a);
  };

  const confirmDelete = () => {
    modal.confirm({
      title: i18n.t("sales.deleteInvoiceConfirm", { defaultValue: "确认删除该发票？" }),
      okText: i18n.t("common.confirm", { defaultValue: "确认" }),
      cancelText: i18n.t("common.cancel", { defaultValue: "取消" }),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (await remove()) goBack();
      },
    });
  };

  const onRecordPayment = async (body: RecordPaymentBody) => {
    if (invoiceId == null) return;
    try {
      await vs.action({ id: invoiceId, action: "record-payment", method: "POST", body });
      message.success(i18n.t("sales.paymentRecorded", { defaultValue: "收款已记录" }));
      await reload();
    } catch (err) {
      // applyFieldErrors in the modal handles field-level errors; surface the rest.
      message.error(i18n.t("sales.paymentFailed", { defaultValue: "记录收款失败" }));
      throw err;
    }
  };

  const actions = useMemo<DocAction[]>(() => (data ? actionsFor(data.status) : []), [data]);

  if (loading) {
    return (
      <CenteredFill>
        <Spin />
      </CenteredFill>
    );
  }

  // Load failed (deleted / forbidden / bad id) — offer a way back.
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
  const canRecordPayment = canCreate && (data.status === "SENT" || data.status === "PARTIALLY_PAID");

  const activityReady = contentTypeId != null && invoiceId != null;
  const tabSpinner = <Spin style={{ display: "block", margin: "24px auto" }} />;
  const tabs = [
    {
      key: "overview",
      label: i18n.t("sales.tabOverview", { defaultValue: "概览" }),
      children: <InvoiceOverview invoice={data} />,
    },
    {
      key: "timeline",
      label: i18n.t("sales.timeline", { defaultValue: "动态" }),
      children: activityReady ? <CommentsTab contentTypeId={contentTypeId} objectId={invoiceId} /> : tabSpinner,
    },
    {
      key: "files",
      label: i18n.t("sales.files", { defaultValue: "文件" }),
      children: activityReady ? <AttachmentPanel contentTypeId={contentTypeId} objectId={invoiceId} /> : tabSpinner,
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
        title={i18n.t("sales.invoice", { defaultValue: "发票" })}
        number={data.invoice_number}
        status={data.display_status}
        createdByName={data.created_by_display?.display_name || data.created_by_display?.username}
        documentType="invoice"
        documentId={data.id}
        actions={actions}
        onRunAction={onRunAction}
        canAct={canCreate}
        canUpdate={canUpdate}
        editable={editable}
        onEdit={() => setEditOpen(true)}
        canDelete={canDelete && editable}
        onDelete={confirmDelete}
        onBack={goBack}
      />

      {/* Record-payment lives next to the header for SENT / PARTIALLY_PAID. */}
      {canRecordPayment && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px 24px 0",
          }}
        >
          <Button type="primary" icon={<DollarOutlined />} onClick={() => setPayOpen(true)}>
            {i18n.t("sales.recordPayment", { defaultValue: "记录收款" })}
          </Button>
        </div>
      )}

      {/* A single scroll on the whole body (not per-column) → one scrollbar. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflowY: "auto" }}>
        <InvoiceInfoPanel invoice={data} schema={schema} />
        <div style={{ flex: 1, minWidth: 0, padding: "16px 24px 24px" }}>
          <Tabs defaultActiveKey="overview" items={tabs} />
        </div>
      </div>

      <InvoiceFormDrawer open={editOpen} invoice={data} onClose={() => setEditOpen(false)} onSaved={reload} />

      <RecordPaymentModal
        open={payOpen}
        currency={data.currency}
        balanceDue={data.balance_due}
        onSubmit={onRecordPayment}
        onClose={() => setPayOpen(false)}
      />
    </div>
  );
}
