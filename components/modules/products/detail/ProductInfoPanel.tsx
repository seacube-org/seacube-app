import { Typography, theme } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import { taxRatePercent, unitLabel, type ProductDetail } from "@/components/modules/products/shared";
import { InfoRow, SectionLabel } from "@/components/modules/base/sections";

/** Left rail: schema-labelled basic info, description, last-modified. */
export default function ProductInfoPanel({ product, schema }: { product: ProductDetail; schema: FieldSchema }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        padding: "20px 24px",
        borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <SectionLabel>{i18n.t("products.basicInfo", { defaultValue: "基本信息" })}</SectionLabel>
      <InfoRow label={schema.label("code", i18n.t("products.code", { defaultValue: "代码" }))} value={product.code} />
      <InfoRow
        label={schema.label("category", i18n.t("products.category", { defaultValue: "分类" }))}
        value={product.category}
      />
      <InfoRow
        label={schema.label("base_unit", i18n.t("products.baseUnit", { defaultValue: "计量单位" }))}
        value={unitLabel(product.base_unit)}
      />
      <InfoRow
        label={i18n.t("products.defaultTaxRate", { defaultValue: "默认税率" })}
        value={taxRatePercent(product.default_tax_rate)}
      />

      {product.description ? (
        <>
          <SectionLabel>{i18n.t("products.description", { defaultValue: "描述" })}</SectionLabel>
          <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {product.description}
          </Typography.Paragraph>
        </>
      ) : null}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("products.lastModified", { defaultValue: "最后修改" })}:{" "}
          {new Date(product.updated_at).toLocaleString()}
        </Typography.Text>
      </div>
    </div>
  );
}
