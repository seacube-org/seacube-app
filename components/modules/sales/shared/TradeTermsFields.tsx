import { Col, Input, Row } from "antd";
import i18n from "@/locale/i18n";
import SchemaField from "@/components/modules/base/SchemaField";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";

/**
 * Trade-terms inputs shared by Quote / SalesOrder / Invoice forms. Controls and
 * labels come from the DRF OPTIONS schema; choice fields resolve from the core
 * reference tables (currency master + the incoterms / shipment_type OptionSets).
 */
export default function TradeTermsFields({ schema }: { schema: FieldSchema }) {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <SchemaField schema={schema} name="currency" config={{ ref: "currency" }} />
      </Col>
      <Col span={12}>
        <SchemaField
          schema={schema}
          name="payment_terms"
          config={{
            label: i18n.t("sales.paymentTerms", { defaultValue: "付款条款" }),
            control: <Input.TextArea rows={2} />,
          }}
        />
      </Col>
      <Col span={12}>
        <SchemaField schema={schema} name="incoterms" config={{ ref: "optionset:incoterms" }} />
      </Col>
      <Col span={12}>
        <SchemaField schema={schema} name="incoterms_location" />
      </Col>
      <Col span={12}>
        <SchemaField schema={schema} name="shipment_type" config={{ ref: "optionset:shipment_type" }} />
      </Col>
      <Col span={12}>
        <SchemaField schema={schema} name="port_of_loading" />
      </Col>
      <Col span={12}>
        <SchemaField schema={schema} name="port_of_destination" />
      </Col>
    </Row>
  );
}
