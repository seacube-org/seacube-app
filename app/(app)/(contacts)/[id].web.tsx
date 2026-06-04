import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import {
  App, Avatar, Button, Empty, Popconfirm, Space, Spin, Table, Tabs, Tag, Typography, theme,
} from "antd";
import {
  ArrowLeftOutlined, CalendarOutlined, DeleteOutlined, DollarOutlined, EditOutlined,
  EnvironmentOutlined, GlobalOutlined, IdcardOutlined, MailOutlined, PhoneOutlined,
} from "@ant-design/icons";
import { useContentType } from "@/hooks/core/useContentType";
import { useCan } from "@/stores/authStore";
import CommentsTab from "@/components/modules/comments/CommentsTab";
import AttachmentPanel from "@/components/modules/attachments/AttachmentPanel";
import ContactFormDrawer from "@/components/modules/contacts/ContactFormDrawer";
import {
  formatAddress, typeColor, typeLabel, useContactViewSet,
  type BankAccount, type ContactAddress, type ContactDetail, type ContactPerson,
} from "@/components/modules/contacts/shared";
import i18n from "@/locale/i18n";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function InfoRow({ icon, value }: { icon: ReactNode; value?: string }) {
  const { token } = theme.useToken();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 28 }}>
      <span style={{ color: token.colorTextTertiary, width: 16, textAlign: "center" }}>{icon}</span>
      {value ? <span>{value}</span> : <Typography.Text type="secondary">—</Typography.Text>}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography.Text strong style={{ display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, margin: "20px 0 10px" }}>
      {children}
    </Typography.Text>
  );
}

function AddressCard({ title, address }: { title: string; address: ContactAddress | undefined }) {
  const { token } = theme.useToken();
  const line = formatAddress(address);
  return (
    <div style={{ flex: 1, minWidth: 220, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, padding: 14 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{title}</Typography.Text>
      <div style={{ marginTop: 6, lineHeight: 1.6 }}>
        {address?.attention ? <div>{address.attention}</div> : null}
        {line ? <div>{line}</div> : <Typography.Text type="secondary">—</Typography.Text>}
        {address?.phone ? <div>{address.phone}</div> : null}
      </div>
    </div>
  );
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contactId = id ? Number(id) : null;
  const router = useRouter();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const vs = useContactViewSet();
  const contentTypeId = useContentType("contact");
  const canUpdate = useCan("contacts", "update");
  const canDelete = useCan("contacts", "delete");

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const reload = useCallback(async () => {
    if (contactId == null) return;
    setLoading(true);
    try {
      setContact((await vs.retrieve({ id: contactId })) as ContactDetail);
    } catch {
      message.error(i18n.t("contacts.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [contactId, vs, message]);

  useEffect(() => { reload(); }, [reload]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(contacts)" as Href);
  };

  const remove = async () => {
    if (contactId == null) return;
    try {
      await vs.delete({ id: contactId });
      message.success(i18n.t("contacts.deleted", { defaultValue: "已删除" }));
      goBack();
    } catch {
      message.error(i18n.t("contacts.deleteFailed", { defaultValue: "删除失败" }));
    }
  };

  if (loading) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: token.colorBgContainer }}>
        <Spin />
      </div>
    );
  }

  // Load failed (deleted / forbidden / bad id) — offer a way back instead of
  // an indefinite spinner.
  if (!contact) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: token.colorBgContainer }}>
        <Empty description={i18n.t("contacts.loadFailed", { defaultValue: "加载失败" })}>
          <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
            {i18n.t("common.back", { defaultValue: "返回" })}
          </Button>
        </Empty>
      </div>
    );
  }

  const personColumns = [
    { title: i18n.t("contacts.personName", { defaultValue: "姓名" }), dataIndex: "name", key: "name",
      render: (v: string, r: ContactPerson) => (
        <Space size={4}>
          <span>{v}</span>
          {r.is_primary ? <Tag color="blue" style={{ fontSize: 11 }}>{i18n.t("contacts.primary", { defaultValue: "主要" })}</Tag> : null}
        </Space>
      ) },
    { title: i18n.t("contacts.personTitle", { defaultValue: "职位" }), dataIndex: "title", key: "title", render: (v: string) => v || "—" },
    { title: i18n.t("contacts.email", { defaultValue: "邮箱" }), dataIndex: "email", key: "email", render: (v: string) => v || "—" },
    { title: i18n.t("contacts.phone", { defaultValue: "电话" }), dataIndex: "phone", key: "phone", render: (v: string) => v || "—" },
  ];

  const bankColumns = [
    { title: i18n.t("contacts.bankName", { defaultValue: "银行名称" }), dataIndex: "bank_name", key: "bank_name",
      render: (v: string, r: BankAccount) => (
        <Space size={4}>
          <span>{v}</span>
          {r.is_default ? <Tag color="green" style={{ fontSize: 11 }}>{i18n.t("contacts.default", { defaultValue: "默认" })}</Tag> : null}
        </Space>
      ) },
    { title: i18n.t("contacts.accountName", { defaultValue: "账户名" }), dataIndex: "account_name", key: "account_name", render: (v: string) => v || "—" },
    { title: i18n.t("contacts.accountNumber", { defaultValue: "账号" }), dataIndex: "account_number", key: "account_number", render: (v: string) => v || "—" },
    { title: i18n.t("contacts.currency", { defaultValue: "币种" }), dataIndex: "currency", key: "currency", width: 90 },
  ];

  const emptyTable = { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> };

  const overviewTab = (
    <div style={{ padding: "4px 0 24px" }}>
      <SectionLabel>{i18n.t("contacts.addresses", { defaultValue: "地址" })}</SectionLabel>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <AddressCard title={i18n.t("contacts.billingAddress", { defaultValue: "账单地址" })} address={contact.billing_address} />
        <AddressCard title={i18n.t("contacts.shippingAddress", { defaultValue: "收货地址" })} address={contact.shipping_address} />
      </div>

      <SectionLabel>{i18n.t("contacts.tabPersons", { defaultValue: "联系人" })}</SectionLabel>
      <Table rowKey={(r) => String(r.id)} size="small" pagination={false} columns={personColumns} dataSource={contact.persons} locale={emptyTable} />

      <SectionLabel>{i18n.t("contacts.tabBanks", { defaultValue: "银行账户" })}</SectionLabel>
      <Table rowKey={(r) => String(r.id)} size="small" pagination={false} columns={bankColumns} dataSource={contact.bank_accounts} locale={emptyTable} />
    </div>
  );

  const activityReady = contentTypeId != null && contactId != null;
  const tabs = [
    { key: "overview", label: i18n.t("contacts.tabOverview", { defaultValue: "概览" }), children: overviewTab },
    {
      key: "timeline",
      label: i18n.t("contacts.timeline", { defaultValue: "动态" }),
      children: activityReady ? <CommentsTab contentTypeId={contentTypeId} objectId={contactId} /> : <Spin style={{ display: "block", margin: "24px auto" }} />,
    },
    {
      key: "files",
      label: i18n.t("contacts.files", { defaultValue: "文件" }),
      children: activityReady ? <AttachmentPanel contentTypeId={contentTypeId} objectId={contactId} /> : <Spin style={{ display: "block", margin: "24px auto" }} />,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: token.colorBgContainer }}>
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, padding: "12px 24px", borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={goBack} />
          <Avatar size={40} style={{ background: typeColor(contact.type) === "purple" ? "#722ed1" : token.colorPrimary, flexShrink: 0 }}>
            {initials(contact.name)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Typography.Title level={4} style={{ margin: 0 }} ellipsis>{contact.name}</Typography.Title>
              <Tag color={typeColor(contact.type)}>{typeLabel(contact.type)}</Tag>
            </div>
            {contact.created_by_display ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {i18n.t("contacts.createdBy", { defaultValue: "创建人" })}: {contact.created_by_display.display_name || contact.created_by_display.username}
              </Typography.Text>
            ) : null}
          </div>
        </div>
        <Space>
          {canUpdate && (
            <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
              {i18n.t("common.edit", { defaultValue: "编辑" })}
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title={i18n.t("contacts.deleteConfirm", { defaultValue: "确认删除该联系人？" })}
              onConfirm={remove}
              okText={i18n.t("common.confirm", { defaultValue: "确认" })}
              cancelText={i18n.t("common.cancel", { defaultValue: "取消" })}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>{i18n.t("common.delete", { defaultValue: "删除" })}</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Body: left info panel + right tabs */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div
          style={{
            width: 320, flexShrink: 0, overflowY: "auto", padding: "20px 24px",
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <SectionLabel>{i18n.t("contacts.basicInfo", { defaultValue: "基本信息" })}</SectionLabel>
          <InfoRow icon={<MailOutlined />} value={contact.email} />
          <InfoRow icon={<PhoneOutlined />} value={contact.phone} />
          <InfoRow icon={<GlobalOutlined />} value={contact.website} />
          <InfoRow icon={<IdcardOutlined />} value={contact.tax_id} />
          <InfoRow icon={<DollarOutlined />} value={contact.currency} />
          <InfoRow
            icon={<CalendarOutlined />}
            value={contact.payment_terms != null
              ? `${i18n.t("contacts.paymentTerms", { defaultValue: "付款账期（天）" })}: ${contact.payment_terms}`
              : undefined}
          />
          <InfoRow icon={<EnvironmentOutlined />} value={formatAddress(contact.billing_address) || undefined} />

          {contact.notes ? (
            <>
              <SectionLabel>{i18n.t("contacts.notes", { defaultValue: "备注" })}</SectionLabel>
              <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                {contact.notes}
              </Typography.Paragraph>
            </>
          ) : null}

          <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {i18n.t("contacts.lastModified", { defaultValue: "最后修改" })}: {new Date(contact.updated_at).toLocaleString()}
            </Typography.Text>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "8px 24px 0" }}>
          <Tabs defaultActiveKey="overview" items={tabs} />
        </div>
      </div>

      <ContactFormDrawer
        open={editOpen}
        contact={contact}
        onClose={() => setEditOpen(false)}
        onSaved={reload}
      />
    </div>
  );
}
