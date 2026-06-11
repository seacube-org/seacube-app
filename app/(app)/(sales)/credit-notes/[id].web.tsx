import { useMemo, useState, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { App, Button, Empty, Spin, Tabs, theme } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useContentType } from "@/hooks/core/useContentType";
import { useCan } from "@/stores/authStore";
import CommentsTab from "@/components/modules/comments/CommentsTab";
import AttachmentPanel from "@/components/modules/attachments/AttachmentPanel";
import DocumentHeader from "@/components/modules/sales/shared/DocumentHeader";
import { useDocumentDetail } from "@/components/modules/sales/shared/useDocumentDetail";
import type { DocAction } from "@/components/modules/sales/shared/types";
import CreditNoteFormDrawer from "@/components/modules/sales/credit-note/CreditNoteFormDrawer";
import { CREDIT_NOTES_URL, type CreditNoteDetail } from "@/components/modules/sales/credit-note/shared";
import CreditNoteInfoPanel from "@/components/modules/sales/credit-note/detail/CreditNoteInfoPanel";
import CreditNoteOverview from "@/components/modules/sales/credit-note/detail/CreditNoteOverview";
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

/** Legal status transitions for the current credit-note status (see CreditNoteViewSet). */
function actionsFor(note: CreditNoteDetail): DocAction[] {
  const status = note.status;
  switch (status) {
    case "DRAFT":
      return [
        {
          key: "approve",
          label: i18n.t("sales.cnApprove", { defaultValue: "生效" }),
          action: "approve",
          primary: true,
        },
        {
          key: "void",
          label: i18n.t("sales.cnVoid", { defaultValue: "作废" }),
          action: "void",
          danger: true,
          confirm: i18n.t("sales.cnVoidConfirm", { defaultValue: "确认作废？" }),
        },
      ];
    case "OPEN":
      return [
        // apply settles the linked invoice — the backend rejects it for
        // unlinked notes, so only offer it when an invoice is attached.
        ...(note.invoice != null
          ? [{ key: "apply", label: i18n.t("sales.cnApply", { defaultValue: "核销" }), action: "apply", primary: true }]
          : []),
        {
          key: "void",
          label: i18n.t("sales.cnVoid", { defaultValue: "作废" }),
          action: "void",
          danger: true,
          confirm: i18n.t("sales.cnVoidConfirmReverse", { defaultValue: "确认作废？将冲销凭证" }),
        },
      ];
    default:
      return [];
  }
}

export default function CreditNoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const creditNoteId = id ? Number(id) : null;
  const router = useRouter();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const canUpdate = useCan("sales_credit_notes", "update");
  const canDelete = useCan("sales_credit_notes", "delete");
  // approve / apply / void are POST actions → gated on `create` (not `update`).
  const canCreate = useCan("sales_credit_notes", "create");
  const contentTypeId = useContentType("creditnote");

  const { data, loading, reload, remove, runAction } = useDocumentDetail<CreditNoteDetail>(
    CREDIT_NOTES_URL,
    creditNoteId,
  );
  const [editOpen, setEditOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(sales)/credit-notes" as Href);
  };

  const confirmDelete = () => {
    modal.confirm({
      title: i18n.t("sales.cnDeleteConfirm", { defaultValue: "确认删除该贷项通知单？" }),
      okText: i18n.t("common.confirm", { defaultValue: "确认" }),
      cancelText: i18n.t("common.cancel", { defaultValue: "取消" }),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (await remove()) goBack();
      },
    });
  };

  const actions = useMemo<DocAction[]>(() => (data ? actionsFor(data) : []), [data]);

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
  const activityReady = contentTypeId != null && creditNoteId != null;
  const tabSpinner = <Spin style={{ display: "block", margin: "24px auto" }} />;
  const tabs = [
    {
      key: "overview",
      label: i18n.t("sales.tabOverview", { defaultValue: "概览" }),
      children: <CreditNoteOverview data={data} />,
    },
    {
      key: "timeline",
      label: i18n.t("sales.timeline", { defaultValue: "动态" }),
      children: activityReady ? <CommentsTab contentTypeId={contentTypeId} objectId={creditNoteId} /> : tabSpinner,
    },
    {
      key: "files",
      label: i18n.t("sales.files", { defaultValue: "文件" }),
      children: activityReady ? <AttachmentPanel contentTypeId={contentTypeId} objectId={creditNoteId} /> : tabSpinner,
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
        title={i18n.t("sales.creditNote", { defaultValue: "贷项通知单" })}
        number={data.credit_number}
        status={data.status}
        createdByName={data.created_by_display?.display_name}
        documentType="credit_note"
        documentId={data.id}
        actions={actions}
        onRunAction={async (a) => {
          await runAction(a);
        }}
        canAct={canCreate}
        canUpdate={canUpdate}
        editable={editable}
        onEdit={() => setEditOpen(true)}
        canDelete={canDelete && editable}
        onDelete={confirmDelete}
        onBack={goBack}
      />

      {/* A single scroll on the whole body (not per-column) → one scrollbar. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflowY: "auto" }}>
        <CreditNoteInfoPanel data={data} />
        <div style={{ flex: 1, minWidth: 0, padding: "16px 24px 24px" }}>
          <Tabs defaultActiveKey="overview" items={tabs} />
        </div>
      </div>

      <CreditNoteFormDrawer open={editOpen} creditNote={data} onClose={() => setEditOpen(false)} onSaved={reload} />
    </div>
  );
}
