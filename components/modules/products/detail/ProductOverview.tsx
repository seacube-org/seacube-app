import { Empty, Tag, Typography } from "antd";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import TagListCell from "@/components/modules/base/TagListCell";
import {
  attributeTypeLabel,
  type ProductAttributeAssignment,
  type ProductDetail,
} from "@/components/modules/products/shared";
import { SectionLabel } from "./sections";

const emptyTable = { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> };

/** Overview tab: the product's bound spec attributes (name / type / required / choices). */
export default function ProductOverview({ product }: { product: ProductDetail }) {
  const columns = [
    {
      title: i18n.t("products.attribute", { defaultValue: "规格属性" }),
      dataIndex: ["attribute", "name"],
      key: "name",
      width: 240,
      // Single-line flex so a long name (e.g. "Gross Weight / Carton") truncates
      // with a tooltip instead of wrapping and pushing the 必填 tag onto its own line.
      render: (_: unknown, r: ProductAttributeAssignment) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <Typography.Text ellipsis={{ tooltip: r.attribute.name }} style={{ minWidth: 0 }}>
            {r.attribute.name}
          </Typography.Text>
          {r.is_required ? (
            <Tag color="blue" style={{ fontSize: 11, flexShrink: 0, marginInlineEnd: 0 }}>
              {i18n.t("products.required", { defaultValue: "必填" })}
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: i18n.t("products.attributeCode", { defaultValue: "代码" }),
      dataIndex: ["attribute", "code"],
      key: "code",
      width: 180,
      // Codes are unbroken identifiers — ellipsis on one line (tooltip shows full)
      // instead of breaking mid-word in a narrow cell.
      render: (_: unknown, r: ProductAttributeAssignment) => (
        <Typography.Text
          type="secondary"
          ellipsis={{ tooltip: r.attribute.code }}
          style={{ display: "block", fontFamily: "monospace", fontSize: 12 }}
        >
          {r.attribute.code}
        </Typography.Text>
      ),
    },
    {
      title: i18n.t("products.attributeType", { defaultValue: "类型" }),
      dataIndex: ["attribute", "data_type"],
      key: "data_type",
      width: 140,
      render: (_: unknown, r: ProductAttributeAssignment) => <Tag>{attributeTypeLabel(r.attribute.data_type)}</Tag>,
    },
    {
      title: i18n.t("products.attributeChoices", { defaultValue: "选项" }),
      dataIndex: ["attribute", "choices"],
      key: "choices",
      // No choices → fall back to the unit hint (e.g. "%", "kg"); else the tag list
      // with a hover "+N" popover revealing every option.
      render: (_: unknown, r: ProductAttributeAssignment) => (
        <TagListCell
          items={r.attribute.choices ?? []}
          max={4}
          emptyContent={
            r.attribute.unit ? <Typography.Text type="secondary">{r.attribute.unit}</Typography.Text> : undefined
          }
        />
      ),
    },
  ];

  // Already ordered by sort_order from the backend (assignment Meta.ordering).
  const data = product.attribute_assignments ?? [];

  return (
    // 8px top matches the comments / files tabs so all three tab panes start level.
    <div style={{ padding: "8px 0 24px", maxWidth: 960 }}>
      <SectionLabel first>{i18n.t("products.tabAttributes", { defaultValue: "规格属性" })}</SectionLabel>
      <BasicTable<ProductAttributeAssignment>
        rowKey={(r) => String(r.id ?? r.attribute.id)}
        columns={columns}
        dataSource={data}
        locale={emptyTable}
      />
    </div>
  );
}
