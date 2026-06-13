import { Empty, Space, Tag } from "antd";
import i18n from "@/locale/i18n";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import BasicTable from "@/components/modules/base/BasicTable";
import { type BankAccount, type ContactDetail, type ContactPerson } from "@/components/modules/contacts/shared";
import { SectionLabel, TAB_PANE_STYLE } from "@/components/modules/base/sections";
import { AddressCard } from "./sections";

const emptyTable = { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} /> };

/** Overview tab: address cards + the people / bank-account sub-tables. */
export default function ContactOverview({ contact, schema }: { contact: ContactDetail; schema: FieldSchema }) {
  const personsMeta = schema.nested("persons");
  const banksMeta = schema.nested("bank_accounts");

  const personColumns = [
    {
      title: personsMeta.label("name", "姓名"),
      dataIndex: "name",
      key: "name",
      render: (v: string, r: ContactPerson) => (
        <Space size={4}>
          <span>{v}</span>
          {r.is_primary ? (
            <Tag color="blue" style={{ fontSize: 11 }}>
              {i18n.t("contacts.primary", { defaultValue: "主要" })}
            </Tag>
          ) : null}
        </Space>
      ),
    },
    { title: personsMeta.label("title", "职位"), dataIndex: "title", key: "title", render: (v: string) => v || "—" },
    { title: personsMeta.label("email", "邮箱"), dataIndex: "email", key: "email", render: (v: string) => v || "—" },
    { title: personsMeta.label("phone", "电话"), dataIndex: "phone", key: "phone", render: (v: string) => v || "—" },
  ];

  const bankColumns = [
    {
      title: banksMeta.label("bank_name", "银行名称"),
      dataIndex: "bank_name",
      key: "bank_name",
      render: (v: string, r: BankAccount) => (
        <Space size={4}>
          <span>{v}</span>
          {r.is_default ? (
            <Tag color="green" style={{ fontSize: 11 }}>
              {i18n.t("contacts.default", { defaultValue: "默认" })}
            </Tag>
          ) : null}
        </Space>
      ),
    },
    {
      title: banksMeta.label("account_name", "账户名"),
      dataIndex: "account_name",
      key: "account_name",
      render: (v: string) => v || "—",
    },
    {
      title: banksMeta.label("account_number", "账号"),
      dataIndex: "account_number",
      key: "account_number",
      render: (v: string) => v || "—",
    },
    { title: banksMeta.label("currency", "币种"), dataIndex: "currency", key: "currency", width: 90 },
  ];

  return (
    <div style={TAB_PANE_STYLE}>
      <SectionLabel>{i18n.t("contacts.addresses", { defaultValue: "地址" })}</SectionLabel>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <AddressCard
          title={i18n.t("contacts.billingAddress", { defaultValue: "账单地址" })}
          address={contact.billing_address}
        />
        <AddressCard
          title={i18n.t("contacts.shippingAddress", { defaultValue: "收货地址" })}
          address={contact.shipping_address}
        />
      </div>

      <SectionLabel>{i18n.t("contacts.tabPersons", { defaultValue: "联系人" })}</SectionLabel>
      <BasicTable<ContactPerson>
        rowKey={(r) => String(r.id)}
        columns={personColumns}
        dataSource={contact.persons}
        locale={emptyTable}
      />

      <SectionLabel>{i18n.t("contacts.tabBanks", { defaultValue: "银行账户" })}</SectionLabel>
      <BasicTable<BankAccount>
        rowKey={(r) => String(r.id)}
        columns={bankColumns}
        dataSource={contact.bank_accounts}
        locale={emptyTable}
      />
    </div>
  );
}
