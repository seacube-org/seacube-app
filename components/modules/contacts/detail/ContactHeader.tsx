import { Avatar, Button, Dropdown, Space, Tag, Typography, theme } from "antd";
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import {
  avatarColor, initials, typeColor, typeLabel, type ContactDetail,
} from "@/components/modules/contacts/shared";

type Props = {
  contact: ContactDetail;
  canUpdate: boolean;
  canDelete: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** Detail-page header: back, avatar/name/type, creator, edit + overflow menu. */
export default function ContactHeader({ contact, canUpdate, canDelete, onBack, onEdit, onDelete }: Props) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "16px 24px", borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
        <Avatar size={40} style={{ background: avatarColor(contact.type, token.colorPrimary), flexShrink: 0 }}>
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
          <Button icon={<EditOutlined />} onClick={onEdit}>
            {i18n.t("common.edit", { defaultValue: "编辑" })}
          </Button>
        )}
        {canDelete && (
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: [{ key: "delete", danger: true, icon: <DeleteOutlined />, label: i18n.t("common.delete", { defaultValue: "删除" }) }],
              onClick: ({ key }) => { if (key === "delete") onDelete(); },
            }}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        )}
      </Space>
    </div>
  );
}
