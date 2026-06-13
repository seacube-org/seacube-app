import { Col, Form, Input, Row, Space } from "antd";
import i18n from "@/locale/i18n";
import SchemaField from "@/components/modules/base/SchemaField";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";

/**
 * Trade-terms inputs shared by Quote / SalesOrder / Invoice forms. Controls and
 * labels come from the DRF OPTIONS schema; choice fields resolve from the core
 * reference tables (currency master + the incoterms / shipment_type OptionSets).
 *
 * `responsive` switches to viewport-based spans (three per line ≥xl). antd
 * breakpoints track the viewport, not the container — only enable this on
 * full-page forms (quote); fixed-width drawers keep the two-column layout.
 * `showCurrency={false}` lets a form surface currency elsewhere (the quote
 * page puts it in 基本信息) while still submitting it as a trade-term key.
 */
export default function TradeTermsFields({
  schema,
  responsive = false,
  showCurrency = true,
}: {
  schema: FieldSchema;
  responsive?: boolean;
  showCurrency?: boolean;
}) {
  const col = responsive ? { xs: 24, md: 12, xl: 8 } : { span: 12 };
  return (
    <Row gutter={responsive ? 24 : 16}>
      {showCurrency && (
        <Col {...col}>
          <SchemaField schema={schema} name="currency" config={{ ref: "currency" }} />
        </Col>
      )}
      {/* Incoterms + location welded into one control ("FOB | Shenzhen"): the
          outer Form.Item carries the label, the inner fields go noStyle so
          Space.Compact can fuse them. Location's label becomes its placeholder.
          Gated on schema.has so a staff-hidden schema drops the whole control
          (the inner SchemaFields honour it, but the wrapper Form.Item would not). */}
      {(schema.has("incoterms") || schema.has("incoterms_location")) && (
        <Col {...col}>
          <Form.Item label={schema.label("incoterms", i18n.t("sales.incoterms", { defaultValue: "贸易术语" }))}>
            <Space.Compact style={{ width: "100%" }}>
              <SchemaField
                schema={schema}
                name="incoterms"
                config={{
                  ref: "optionset:incoterms",
                  itemProps: { noStyle: true },
                  inputProps: { style: { width: "45%" }, allowClear: true },
                }}
              />
              <SchemaField
                schema={schema}
                name="incoterms_location"
                config={{
                  itemProps: { noStyle: true },
                  inputProps: {
                    style: { width: "55%" },
                    placeholder: schema.label(
                      "incoterms_location",
                      i18n.t("sales.incotermsLocation", { defaultValue: "地点" }),
                    ),
                  },
                }}
              />
            </Space.Compact>
          </Form.Item>
        </Col>
      )}
      <Col {...col}>
        <SchemaField schema={schema} name="shipment_type" config={{ ref: "optionset:shipment_type" }} />
      </Col>
      <Col {...col}>
        <SchemaField schema={schema} name="port_of_loading" />
      </Col>
      <Col {...col}>
        <SchemaField schema={schema} name="port_of_destination" />
      </Col>
      <Col {...col}>
        {/* autoSize keeps this level with the single-line inputs (one row when
            empty/short) and only grows for actual multi-line terms. */}
        <SchemaField
          schema={schema}
          name="payment_terms"
          config={{
            label: i18n.t("sales.paymentTerms", { defaultValue: "付款条款" }),
            control: <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />,
          }}
        />
      </Col>
    </Row>
  );
}
