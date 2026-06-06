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
import ContactFormDrawer from "@/components/modules/contacts/ContactFormDrawer";
import { CONTACTS_URL } from "@/components/modules/contacts/shared";
import ContactHeader from "@/components/modules/contacts/detail/ContactHeader";
import ContactInfoPanel from "@/components/modules/contacts/detail/ContactInfoPanel";
import ContactOverview from "@/components/modules/contacts/detail/ContactOverview";
import { useContactDetail } from "@/components/modules/contacts/detail/useContactDetail";
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

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contactId = id ? Number(id) : null;
  const router = useRouter();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const canUpdate = useCan("contacts", "update");
  const canDelete = useCan("contacts", "delete");
  const schema = useFieldMeta(CONTACTS_URL);
  const contentTypeId = useContentType("contact");

  const { contact, loading, reload, remove } = useContactDetail(contactId);
  const [editOpen, setEditOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(contacts)" as Href);
  };

  const confirmDelete = () => {
    modal.confirm({
      title: i18n.t("contacts.deleteConfirm", { defaultValue: "确认删除该联系人？" }),
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
  if (!contact) {
    return (
      <CenteredFill>
        <Empty description={i18n.t("contacts.loadFailed", { defaultValue: "加载失败" })}>
          <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
            {i18n.t("common.back", { defaultValue: "返回" })}
          </Button>
        </Empty>
      </CenteredFill>
    );
  }

  const activityReady = contentTypeId != null && contactId != null;
  const tabSpinner = <Spin style={{ display: "block", margin: "24px auto" }} />;
  const tabs = [
    {
      key: "overview",
      label: i18n.t("contacts.tabOverview", { defaultValue: "概览" }),
      children: <ContactOverview contact={contact} schema={schema} />,
    },
    {
      key: "timeline",
      label: i18n.t("contacts.timeline", { defaultValue: "动态" }),
      children: activityReady ? <CommentsTab contentTypeId={contentTypeId} objectId={contactId} /> : tabSpinner,
    },
    {
      key: "files",
      label: i18n.t("contacts.files", { defaultValue: "文件" }),
      children: activityReady ? <AttachmentPanel contentTypeId={contentTypeId} objectId={contactId} /> : tabSpinner,
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
      <ContactHeader
        contact={contact}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onBack={goBack}
        onEdit={() => setEditOpen(true)}
        onDelete={confirmDelete}
      />

      {/* A single scroll on the whole body (not per-column) → one scrollbar. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflowY: "auto" }}>
        <ContactInfoPanel contact={contact} schema={schema} />
        <div style={{ flex: 1, minWidth: 0, padding: "16px 24px 24px" }}>
          <Tabs defaultActiveKey="overview" items={tabs} />
        </div>
      </div>

      <ContactFormDrawer open={editOpen} contact={contact} onClose={() => setEditOpen(false)} onSaved={reload} />
    </div>
  );
}
