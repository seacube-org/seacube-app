import { Button, Dropdown, Space, Typography, theme } from "antd";
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import StatusTag from "@/components/ui/StatusTag";
import ExportPdfButton from "@/components/modules/document-template/ExportPdfButton";
import StatusActionBar from "./StatusActionBar";
import type { DocAction } from "./types";

type Props = {
  /** Entity label, e.g. "报价单". */
  title: string;
  /** Document number, e.g. "Q-0001". */
  number: string;
  /** display_status from the serializer (EXPIRED/OVERDUE-aware). */
  status: string;
  createdByName?: string;
  /** document_templates document_type (quote / invoice / …). */
  documentType: string;
  documentId: number;
  /** Legal status transitions / conversions for the current status. */
  actions?: DocAction[];
  onRunAction?: (a: DocAction) => Promise<void>;
  /** May run the status actions. They are POST endpoints the backend gates on the
   *  module's `create` permission (not `update`), so pass useCan(key,"create"). */
  canAct?: boolean;
  canUpdate?: boolean;
  /** Whether the current status still permits editing (DRAFT, etc.). */
  editable?: boolean;
  onEdit?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
  onBack: () => void;
};

/** Shared detail-page header for sales documents. */
export default function DocumentHeader({
  title,
  number,
  status,
  createdByName,
  documentType,
  documentId,
  actions = [],
  onRunAction,
  canAct,
  canUpdate,
  editable,
  onEdit,
  canDelete,
  onDelete,
  onBack,
}: Props) {
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
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Typography.Title level={4} style={{ margin: 0 }} ellipsis>
              {number}
            </Typography.Title>
            <StatusTag status={status} />
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {title}
            {createdByName ? ` · ${i18n.t("sales.createdBy", { defaultValue: "创建人" })}: ${createdByName}` : ""}
          </Typography.Text>
        </div>
      </div>

      <Space wrap>
        {/* Status transitions are POST actions the backend gates on module `create`
            permission, so hide the action bar from users without it. */}
        {onRunAction && canAct && <StatusActionBar actions={actions} onRun={onRunAction} />}
        <ExportPdfButton documentType={documentType} documentId={documentId} />
        {canUpdate && editable && (
          <Button icon={<EditOutlined />} onClick={onEdit}>
            {i18n.t("common.edit", { defaultValue: "编辑" })}
          </Button>
        )}
        {canDelete && onDelete && (
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
