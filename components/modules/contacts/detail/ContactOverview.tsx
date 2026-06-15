import { Empty, Tag, Typography } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import BasicTable from "@/components/modules/base/BasicTable";
import Section from "@/components/ui/Section";
import { type BankAccount, type ContactDetail, type ContactPerson } from "@/components/modules/contacts/shared";
import { TAB_PANE_STYLE } from "@/components/modules/base/sections";
import { AddressCard } from "./sections";

const emptyTable = { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> };

// Clamp a cell to at most two lines; antd Typography measures the overflow and
// shows a Tooltip with the full value only when it's actually truncated. The
// column can still be widened by dragging (which re-measures).
const cell = (v?: string) => (
  <Typography.Paragraph ellipsis={{ rows: 2, tooltip: v || undefined }} style={{ marginBottom: 0 }}>
    {v || "—"}
  </Typography.Paragraph>
);

/** Overview tab: collapsible address / people / bank-account sections. */
export default function ContactOverview({ contact, schema }: { contact: ContactDetail; schema: FieldSchema }) {
  const personsMeta = schema.nested("persons");
  const banksMeta = schema.nested("bank_accounts");

  // Every column carries a width so it gets a resize handle (BasicTable resizable);
  // the widths sum past the panel, so the table scrolls horizontally.
  const personColumns = [
    {
      title: personsMeta.label("name", "姓名"),
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (v: string, r: ContactPerson) => (
        // Name left, "primary" tag pushed to the cell's right edge (matches the
        // bank table's default-tag layout).
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ flex: 1, minWidth: 0 }}>{v}</span>
          {r.is_primary ? (
            <Tag color="blue" style={{ fontSize: 11, flexShrink: 0, marginInlineEnd: 0 }}>
              {i18n.t("contacts.primary", { defaultValue: "主要" })}
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: personsMeta.label("title", "职位"),
      dataIndex: "title",
      key: "title",
      width: 160,
      render: (v: string) => v || "—",
    },
    {
      title: personsMeta.label("email", "邮箱"),
      dataIndex: "email",
      key: "email",
      width: 240,
      render: (v: string) => v || "—",
    },
    {
      title: personsMeta.label("phone", "电话"),
      dataIndex: "phone",
      key: "phone",
      width: 160,
      render: (v: string) => v || "—",
    },
  ];

  // Every column carries a width so it gets a resize handle (BasicTable resizable);
  // the widths sum past the panel, so the table scrolls horizontally.
  const bankColumns = [
    {
      title: banksMeta.label("bank_name", "银行名称"),
      dataIndex: "bank_name",
      key: "bank_name",
      width: 180,
      render: (v: string, r: BankAccount) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
          <Typography.Paragraph
            ellipsis={{ rows: 2, tooltip: v || undefined }}
            style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
          >
            {v || "—"}
          </Typography.Paragraph>
          {r.is_default ? (
            <Tag color="green" style={{ fontSize: 11, flexShrink: 0, marginInlineEnd: 0 }}>
              {i18n.t("contacts.default", { defaultValue: "默认" })}
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: banksMeta.label("account_name", "账户名"),
      dataIndex: "account_name",
      key: "account_name",
      width: 160,
      render: cell,
    },
    {
      title: banksMeta.label("account_number", "账号"),
      dataIndex: "account_number",
      key: "account_number",
      width: 160,
      render: cell,
    },
    {
      title: banksMeta.label("swift_code", "SWIFT"),
      dataIndex: "swift_code",
      key: "swift_code",
      width: 130,
      render: cell,
    },
    {
      title: banksMeta.label("routing_number", "Routing"),
      dataIndex: "routing_number",
      key: "routing_number",
      width: 130,
      render: cell,
    },
    {
      title: banksMeta.label("bank_address", "开户行地址"),
      dataIndex: "bank_address",
      key: "bank_address",
      width: 220,
      render: cell,
    },
    { title: banksMeta.label("currency", "币种"), dataIndex: "currency", key: "currency", width: 90, render: cell },
  ];

  return (
    <div style={TAB_PANE_STYLE}>
      <Section collapsible first title={i18n.t("contacts.addresses", { defaultValue: "地址" })}>
        {/* Default billing & shipping always get their own labelled cards; any other
            book entries (neither default) follow so the full list is shown. A grid
            (not flex) keeps every card one column wide — a lone card on the last row
            no longer stretches to full width. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          <AddressCard
            title={i18n.t("contacts.billingAddress", { defaultValue: "账单地址" })}
            address={contact.billing_address}
          />
          <AddressCard
            title={i18n.t("contacts.shippingAddress", { defaultValue: "收货地址" })}
            address={contact.shipping_address}
          />
          {(contact.addresses ?? [])
            .filter((a) => !a.is_default_billing && !a.is_default_shipping)
            .map((a, i) => (
              <AddressCard
                key={a.id ?? `extra-${i}`}
                title={a.label || i18n.t("contacts.address", { defaultValue: "地址" })}
                address={a}
              />
            ))}
        </div>
      </Section>

      <Section collapsible title={i18n.t("contacts.tabPersons", { defaultValue: "联系人" })}>
        <BasicTable<ContactPerson>
          resizable
          scroll={{ x: 760 }}
          rowKey={(r) => String(r.id)}
          columns={personColumns}
          dataSource={contact.persons}
          locale={emptyTable}
        />
      </Section>

      <Section collapsible title={i18n.t("contacts.tabBanks", { defaultValue: "银行账户" })}>
        {/* autoRowHeight: rows grow to fit the clamped two-line cells. */}
        <BasicTable<BankAccount>
          resizable
          autoRowHeight
          scroll={{ x: 1070 }}
          rowKey={(r) => String(r.id)}
          columns={bankColumns}
          dataSource={contact.bank_accounts}
          locale={emptyTable}
        />
      </Section>
    </div>
  );
}
