import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { App, Button, Col, DatePicker, Form, Input, Row, theme } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import SchemaField from "@/components/modules/base/SchemaField";
import { applyFieldErrors, nestedListError } from "@/components/modules/settings/formErrors";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import ContactSelect from "@/components/modules/sales/shared/ContactSelect";
import LineItemsEditor from "@/components/modules/sales/shared/LineItemsEditor";
import TradeTermsFields from "@/components/modules/sales/shared/TradeTermsFields";
import DocumentAddressSection, {
  documentAddressBody,
  documentAddressSeed,
  useContactAddressPrefill,
} from "@/components/modules/sales/shared/DocumentAddressSection";
import Section from "@/components/ui/Section";
import { fromPicker, toPicker } from "@/components/modules/sales/shared/dates";
import type { LineItemRow } from "@/components/modules/sales/shared/types";
import { QUOTES_URL, useQuoteViewSet, type QuoteDetail } from "./shared";

type Props = {
  quote: QuoteDetail | null; // null = create
};

// Trade-terms keys carried through verbatim from the form values to the body.
const TRADE_TERM_KEYS = [
  "currency",
  "payment_terms",
  "incoterms",
  "incoterms_location",
  "shipment_type",
  "port_of_loading",
  "port_of_destination",
] as const;

/**
 * Quote create/edit full page — Zoho-style single scrolling form grouped into
 * sections (基本信息 / 贸易条款 / 行项目). Field schema (controls, labels,
 * required/visibility) comes from DRF OPTIONS via useFieldMeta; line items render
 * as an editable table; notes/terms sit beside a live-computed totals panel.
 * Create navigates to the new quote's detail; edit goes back to where it came
 * from. Quotes are only editable while DRAFT (enforced server-side).
 */
export default function QuoteFormPage({ quote }: Props) {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const router = useRouter();
  const vs = useQuoteViewSet();
  const prefillAddresses = useContactAddressPrefill();
  // Edit reads the detail endpoint's OPTIONS (carries `PUT`), create reads the
  // collection's (`POST`) — so an update-only profile still gets a schema.
  const schema = useFieldMeta(quote ? `${QUOTES_URL}${quote.id}/` : QUOTES_URL);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = quote != null;
  const currency = (Form.useWatch("currency", form) as string | undefined) || "USD";
  const watchedItems = Form.useWatch("items", form) as LineItemRow[] | undefined;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(sales)/quotes" as Href);
  };

  useEffect(() => {
    // resetFields first so switching between create/edit instances never merges
    // stale nested items / trade terms from a previously seeded form store.
    form.resetFields();
    form.setFieldsValue({
      contact: quote?.contact ?? undefined,
      quote_number: quote?.quote_number ?? "",
      // Create defaults the document date to today (Zoho behavior).
      date: quote ? toPicker(quote.date) : dayjs(),
      expiry_date: toPicker(quote?.expiry_date),
      reference: quote?.reference ?? "",
      notes: quote?.notes ?? "",
      terms: quote?.terms ?? "",
      items: quote?.items ?? [],
      // Address snapshots: seed from the quote (edit) — never reseed from the
      // contact here, so an edited snapshot survives. Prefill only on a user
      // contact change (onValuesChange below).
      ...documentAddressSeed(quote),
      // Trade terms — default currency to USD on create.
      currency: quote?.currency ?? "USD",
      payment_terms: quote?.payment_terms ?? "",
      // Optional OptionSet-backed selects: seed undefined (not "") so an untouched
      // select isn't submitted as a blank code (matches the invoice/order forms).
      incoterms: quote?.incoterms ?? undefined,
      incoterms_location: quote?.incoterms_location ?? "",
      shipment_type: quote?.shipment_type ?? undefined,
      port_of_loading: quote?.port_of_loading ?? "",
      port_of_destination: quote?.port_of_destination ?? "",
    });
  }, [quote, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    const tradeTerms: Record<string, unknown> = {};
    for (const k of TRADE_TERM_KEYS) tradeTerms[k] = values[k];

    const body: Record<string, unknown> = {
      contact: values.contact,
      date: fromPicker(values.date as Parameters<typeof fromPicker>[0]),
      expiry_date: fromPicker(values.expiry_date as Parameters<typeof fromPicker>[0]),
      reference: values.reference,
      notes: values.notes,
      terms: values.terms,
      items: (values.items as LineItemRow[]) ?? [],
      ...documentAddressBody(form),
      ...tradeTerms,
    };
    // quote_number is auto-generated when blank — only send a non-empty value
    // (and it's immutable after creation, so the backend ignores it on edit).
    const quoteNumber = values.quote_number;
    if (typeof quoteNumber === "string" && quoteNumber.trim()) body.quote_number = quoteNumber.trim();

    setSaving(true);
    try {
      if (isEdit) {
        await vs.update({ id: quote.id, body });
        message.success(i18n.t("sales.saved", { defaultValue: "已保存" }));
        goBack();
      } else {
        const created = (await vs.create({ body })) as QuoteDetail;
        message.success(i18n.t("sales.saved", { defaultValue: "已保存" }));
        router.replace(`/(app)/(sales)/quotes/${created.id}` as Href);
      }
    } catch (err) {
      const handled = applyFieldErrors(form, err);
      // Nested items errors land on the Form.List (no visible error slot) —
      // toast the first message so a failed save is never silent.
      const itemsError = nestedListError(err);
      if (itemsError) {
        message.error(itemsError);
      } else if (!handled) {
        message.error(i18n.t("sales.saveFailed", { defaultValue: "保存失败，请重试" }));
      }
    } finally {
      setSaving(false);
    }
  };

  const itemCount = watchedItems?.length ?? 0;
  const title = isEdit
    ? i18n.t("sales.editQuote", { defaultValue: "编辑报价单" })
    : i18n.t("sales.newQuote", { defaultValue: "新建报价单" });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: token.colorBgContainer,
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 24px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={goBack} aria-label="back" />
        <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
        {isEdit && <span style={{ color: token.colorTextTertiary }}>{quote.quote_number}</span>}
      </div>

      {/* Scrolling form body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "8px 24px 24px" }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            scrollToFirstError
            onValuesChange={(changed) => {
              // Prefill address snapshots from the newly picked customer. Fires
              // on user input only (not setFieldsValue), so editing an existing
              // quote keeps its snapshot.
              if ("contact" in changed) prefillAddresses(form, changed.contact as number | null);
            }}
          >
            <Section first size="md" title={i18n.t("sales.tabBasic", { defaultValue: "基本信息" })}>
              {/* One flowing row, responsive to the viewport: ≥xl three fields per
                  line (customer | number | reference, then dates | currency) so
                  inputs stay a readable width; md two per line with the customer
                  full width; xs stacked. */}
              <Row gutter={24}>
                <Col xs={24} md={24} xl={8}>
                  <Form.Item
                    name="contact"
                    label={schema.label("contact", i18n.t("sales.customer", { defaultValue: "客户" }))}
                    rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
                  >
                    <ContactSelect />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                  <Form.Item
                    name="quote_number"
                    label={schema.label("quote_number", i18n.t("sales.quoteNumber", { defaultValue: "报价单号" }))}
                    tooltip={i18n.t("sales.quoteNumberHint", { defaultValue: "留空将自动生成" })}
                  >
                    <Input maxLength={50} allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                  <Form.Item
                    name="reference"
                    label={schema.label("reference", i18n.t("sales.reference", { defaultValue: "参考号" }))}
                  >
                    <Input maxLength={255} allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                  <Form.Item
                    name="date"
                    label={schema.label("date", i18n.t("sales.date", { defaultValue: "日期" }))}
                    rules={[{ required: true, message: i18n.t("common.required", { defaultValue: "必填" }) }]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                  <Form.Item
                    name="expiry_date"
                    label={schema.label("expiry_date", i18n.t("sales.expiryDate", { defaultValue: "有效期至" }))}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                {/* Submitted with the trade terms (TRADE_TERM_KEYS) but surfaced
                    here — it drives every line amount, not just shipping terms. */}
                <Col xs={24} md={12} xl={8}>
                  <SchemaField schema={schema} name="currency" config={{ ref: "currency" }} />
                </Col>
              </Row>
            </Section>

            <Section size="md" title={i18n.t("sales.addresses", { defaultValue: "地址" })}>
              <DocumentAddressSection schema={schema} />
            </Section>

            <Section size="md" title={i18n.t("sales.tabTerms", { defaultValue: "贸易条款" })} collapsible>
              <TradeTermsFields schema={schema} responsive showCurrency={false} />
            </Section>

            <Section
              size="md"
              title={
                itemCount > 0
                  ? `${i18n.t("sales.tabItems", { defaultValue: "行项目" })} (${itemCount})`
                  : i18n.t("sales.tabItems", { defaultValue: "行项目" })
              }
            >
              <LineItemsEditor currency={currency} />

              <Row gutter={24} style={{ marginTop: 20 }}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="notes"
                    label={schema.label("notes", i18n.t("sales.notes", { defaultValue: "备注" }))}
                  >
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="terms"
                    label={schema.label("terms", i18n.t("sales.terms", { defaultValue: "条款" }))}
                  >
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
              </Row>
            </Section>
          </Form>
        </div>
      </div>

      {/* Action bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          padding: "12px 24px",
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
        }}
      >
        <Button onClick={goBack}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
        <Button type="primary" loading={saving} onClick={() => form.submit()}>
          {i18n.t("common.save", { defaultValue: "保存" })}
        </Button>
      </div>
    </div>
  );
}
