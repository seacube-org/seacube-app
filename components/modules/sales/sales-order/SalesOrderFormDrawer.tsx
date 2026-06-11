import { useEffect, useState } from "react";
import { App, Button, Col, Drawer, Form, Input, Row, Tabs } from "antd";
import { applyFieldErrors, nestedListError } from "@/components/modules/settings/formErrors";
import { useFieldMeta } from "@/hooks/core/useFieldMeta";
import SchemaField from "@/components/modules/base/SchemaField";
import ContactSelect from "@/components/modules/sales/shared/ContactSelect";
import LineItemsEditor from "@/components/modules/sales/shared/LineItemsEditor";
import TradeTermsFields from "@/components/modules/sales/shared/TradeTermsFields";
import { fromPicker, toPicker } from "@/components/modules/sales/shared/dates";
import i18n from "@/locale/i18n";
import { SO_ORDERS_URL, useSalesOrderViewSet, type SalesOrderDetail } from "./shared";

type Props = {
  open: boolean;
  order: SalesOrderDetail | null; // null = create
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Sales order create/edit drawer — Form + Tabs (basic / items / terms). Field
 * schema (labels, required, choices) comes from DRF OPTIONS via useFieldMeta.
 * Line items use the shared LineItemsEditor (Form.List name "items"); trade
 * terms use the shared schema-driven TradeTermsFields. Editing is only allowed
 * while the order is DRAFT (the backend rejects edits otherwise).
 */
export default function SalesOrderFormDrawer({ open, order, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const vs = useSalesOrderViewSet();
  // Edit reads the detail endpoint's OPTIONS (carries PUT), create reads the
  // collection's (POST) — so an update-only profile still gets a schema.
  const schema = useFieldMeta(order ? `${SO_ORDERS_URL}${order.id}/` : SO_ORDERS_URL);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basic");
  const isEdit = order != null;

  // Drive the line-item preview currency off the (terms-tab) currency field.
  const currency = (Form.useWatch("currency", form) as string | undefined) ?? order?.currency;

  useEffect(() => {
    if (!open) return;
    setTab("basic");
    // resetFields first: the form store survives drawer close, so seeding alone
    // would merge stale nested item/terms values from a previous order.
    form.resetFields();
    form.setFieldsValue({
      // order_number / status / totals are read-only (auto / computed).
      contact: order?.contact ?? null,
      date: toPicker(order?.date),
      expected_ship_date: toPicker(order?.expected_ship_date),
      reference: order?.reference ?? "",
      notes: order?.notes ?? "",
      terms: order?.terms ?? "",
      items: order?.items ?? [],
      // Trade-terms block.
      currency: order?.currency ?? "CNY",
      payment_terms: order?.payment_terms ?? "",
      incoterms: order?.incoterms ?? undefined,
      incoterms_location: order?.incoterms_location ?? "",
      shipment_type: order?.shipment_type ?? undefined,
      port_of_loading: order?.port_of_loading ?? "",
      port_of_destination: order?.port_of_destination ?? "",
    });
  }, [open, order, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    // Convert the dayjs DatePicker values back to "YYYY-MM-DD" for the API.
    const body = {
      ...values,
      date: fromPicker(values.date as Parameters<typeof fromPicker>[0]),
      expected_ship_date: fromPicker(values.expected_ship_date as Parameters<typeof fromPicker>[0]),
    };
    setSaving(true);
    try {
      if (isEdit) await vs.update({ id: order.id, body });
      else await vs.create({ body });
      message.success(i18n.t("sales.saved", { defaultValue: "已保存" }));
      onSaved();
      onClose();
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
      // Surface nested-tab validation errors by jumping back to the basic tab.
      setTab("basic");
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      key: "basic",
      label: i18n.t("sales.tabBasic", { defaultValue: "基本信息" }),
      forceRender: true,
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contact"
              label={schema.label("contact", i18n.t("sales.customer", { defaultValue: "客户" }))}
            >
              <ContactSelect />
            </Form.Item>
          </Col>
          <Col span={12}>
            <SchemaField
              schema={schema}
              name="date"
              config={{ required: true, label: i18n.t("sales.date", { defaultValue: "日期" }) }}
            />
          </Col>
          <Col span={12}>
            <SchemaField
              schema={schema}
              name="expected_ship_date"
              config={{ label: i18n.t("sales.expectedShipDate", { defaultValue: "预计发货日" }) }}
            />
          </Col>
          <Col span={12}>
            <SchemaField
              schema={schema}
              name="reference"
              config={{ label: i18n.t("sales.reference", { defaultValue: "参考号" }) }}
            />
          </Col>
          <Col span={24}>
            <SchemaField
              schema={schema}
              name="notes"
              config={{
                label: i18n.t("sales.notes", { defaultValue: "备注" }),
                control: <Input.TextArea rows={2} />,
              }}
            />
          </Col>
          <Col span={24}>
            <SchemaField
              schema={schema}
              name="terms"
              config={{
                label: i18n.t("sales.terms", { defaultValue: "条款" }),
                control: <Input.TextArea rows={2} />,
              }}
            />
          </Col>
        </Row>
      ),
    },
    {
      key: "items",
      label: i18n.t("sales.tabItems", { defaultValue: "行项目" }),
      forceRender: true,
      children: <LineItemsEditor currency={currency} enabled={open} />,
    },
    {
      key: "terms",
      label: i18n.t("sales.tabTerms", { defaultValue: "贸易条款" }),
      forceRender: true,
      children: <TradeTermsFields schema={schema} />,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{
        wrapper: { width: "min(1120px, 100vw)" },
        body: { padding: "5px 32px 24px" },
        footer: { padding: "12px 24px" },
      }}
      title={
        isEdit
          ? i18n.t("sales.editOrder", { defaultValue: "编辑销售订单" })
          : i18n.t("sales.newOrder", { defaultValue: "新建销售订单" })
      }
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>{i18n.t("common.cancel", { defaultValue: "取消" })}</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {i18n.t("common.save", { defaultValue: "保存" })}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Tabs activeKey={tab} onChange={setTab} items={items} />
      </Form>
    </Drawer>
  );
}
