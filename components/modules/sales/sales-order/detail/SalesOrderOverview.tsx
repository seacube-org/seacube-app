import { Col, Row } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import LineItemsTable from "@/components/modules/sales/shared/LineItemsTable";
import DocumentTotals from "@/components/modules/sales/shared/DocumentTotals";
import { InfoRow, SectionLabel } from "@/components/modules/contacts/detail/sections";
import type { SalesOrderDetail } from "@/components/modules/sales/sales-order/shared";

/** Overview tab: line-item table + document totals + a trade-terms summary. */
export default function SalesOrderOverview({ order, schema }: { order: SalesOrderDetail; schema: FieldSchema }) {
  return (
    <div style={{ padding: "4px 0 24px", maxWidth: 960 }}>
      <SectionLabel>{i18n.t("sales.lineItems", { defaultValue: "行项目" })}</SectionLabel>
      <LineItemsTable items={order.items} />

      <DocumentTotals
        subtotal={order.subtotal}
        tax={order.tax_amount}
        total={order.total_amount}
        currency={order.currency}
      />

      <SectionLabel>{i18n.t("sales.tradeTerms", { defaultValue: "贸易条款" })}</SectionLabel>
      <Row gutter={[16, 0]}>
        <Col span={12}>
          <InfoRow
            label={schema.label("incoterms", i18n.t("sales.incoterms", { defaultValue: "贸易术语" }))}
            value={
              [order.incoterms, order.incoterms_location].filter((v) => v && String(v).trim()).join(" ") || undefined
            }
          />
        </Col>
        <Col span={12}>
          <InfoRow
            label={schema.label("shipment_type", i18n.t("sales.shipmentType", { defaultValue: "运输方式" }))}
            value={order.shipment_type || undefined}
          />
        </Col>
        <Col span={12}>
          <InfoRow
            label={schema.label("port_of_loading", i18n.t("sales.portOfLoading", { defaultValue: "起运港" }))}
            value={order.port_of_loading || undefined}
          />
        </Col>
        <Col span={12}>
          <InfoRow
            label={schema.label("port_of_destination", i18n.t("sales.portOfDestination", { defaultValue: "目的港" }))}
            value={order.port_of_destination || undefined}
          />
        </Col>
        <Col span={12}>
          <InfoRow
            label={schema.label("payment_terms", i18n.t("sales.paymentTerms", { defaultValue: "付款条款" }))}
            value={order.payment_terms || undefined}
          />
        </Col>
      </Row>
    </div>
  );
}
