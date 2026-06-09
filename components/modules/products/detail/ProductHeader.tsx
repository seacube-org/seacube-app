import { Avatar, Button, Dropdown, Space, Tag, Typography, theme } from "antd";
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import { initials, type ProductDetail } from "@/components/modules/products/shared";

type Props = {
  product: ProductDetail;
  canUpdate: boolean;
  canDelete: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** Detail-page header: back, thumbnail/name/code, active badge, edit + overflow menu. */
export default function ProductHeader({ product, canUpdate, canDelete, onBack, onEdit, onDelete }: Props) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 24px",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
        <Avatar size={40} shape="square" style={{ background: token.colorPrimary, flexShrink: 0, borderRadius: 10 }}>
          {initials(product.name)}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Typography.Title level={4} style={{ margin: 0 }} ellipsis>
              {product.name}
            </Typography.Title>
            {product.code ? <Tag>{product.code}</Tag> : null}
            <Tag color={product.is_active ? "green" : "default"}>
              {product.is_active
                ? i18n.t("products.active", { defaultValue: "启用" })
                : i18n.t("products.inactive", { defaultValue: "已停用" })}
            </Tag>
          </div>
          {product.category ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {product.category}
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
              items: [
                {
                  key: "delete",
                  danger: true,
                  icon: <DeleteOutlined />,
                  label: i18n.t("common.delete", { defaultValue: "删除" }),
                },
              ],
              onClick: ({ key }) => {
                if (key === "delete") onDelete();
              },
            }}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        )}
      </Space>
    </div>
  );
}
