import { Empty, Tag, Typography, theme } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import BasicTable from "@/components/modules/base/BasicTable";
import TagListCell from "@/components/modules/base/TagListCell";
import { SectionLabel, TAB_PANE_STYLE } from "@/components/modules/base/sections";
import { renderSpecTemplate } from "@/components/modules/sales/shared/specTemplate";
import {
  attributeTypeLabel,
  sampleSpecValue,
  type ProductAttributeAssignment,
  type ProductDetail,
} from "@/components/modules/products/shared";

const emptyTable = { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> };

/**
 * The spec→line-description template, shown raw (monospace) plus a render
 * against sample values (first choice / 10 / 10%, by attribute type) so viewers
 * can read it without parsing the @-syntax. Mirrors the form's TemplatePreview —
 * users without update permission have no other window onto this field.
 */
function TemplateSection({ product, schema }: { product: ProductDetail; schema: FieldSchema }) {
  const { token } = theme.useToken();
  const template = product.description_template;
  if (!template.trim()) return null;

  const sample: Record<string, unknown> = {};
  for (const { attribute } of product.attribute_assignments ?? []) sample[attribute.code] = sampleSpecValue(attribute);
  const rendered = renderSpecTemplate(template, sample, { unit: product.base_unit, entry_unit: "CTN" });

  return (
    <>
      <SectionLabel>
        {schema.label("description_template", i18n.t("products.descriptionTemplate", { defaultValue: "描述模板" }))}
      </SectionLabel>
      <div
        style={{
          padding: "8px 12px",
          background: token.colorFillQuaternary,
          borderRadius: token.borderRadius,
          fontFamily: "monospace",
          fontSize: 13,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {template}
      </div>
      <Typography.Text
        type="secondary"
        style={{ display: "block", fontSize: 12, marginTop: 6, whiteSpace: "pre-line" }}
      >
        {i18n.t("products.templatePreview", { defaultValue: "预览" })}:{" "}
        {rendered || i18n.t("products.templatePreviewEmpty", { defaultValue: "(空)" })}
      </Typography.Text>
    </>
  );
}

/** Overview tab: the product's bound spec attributes (name / type / required /
 *  choices) and its spec→description template. */
export default function ProductOverview({ product, schema }: { product: ProductDetail; schema: FieldSchema }) {
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
    <div style={TAB_PANE_STYLE}>
      <SectionLabel first>{i18n.t("products.tabAttributes", { defaultValue: "规格属性" })}</SectionLabel>
      <BasicTable<ProductAttributeAssignment>
        rowKey={(r) => String(r.id ?? r.attribute.id)}
        columns={columns}
        dataSource={data}
        locale={emptyTable}
      />
      <TemplateSection product={product} schema={schema} />
    </div>
  );
}
