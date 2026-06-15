import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Card, Col, Divider, Drawer, Form, Input, Popover, Row, Tag, Typography, theme } from "antd";
import type { FormInstance } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import { useDataService } from "@/hooks/core/useDataService";
import type { FieldSchema } from "@/hooks/core/useFieldMeta";
import AddressFields from "@/components/modules/contacts/form/AddressFields";
import { AddressCard } from "@/components/modules/contacts/detail/sections";
import { SectionLabel } from "@/components/modules/base/sections";
import {
  CONTACTS_URL,
  CONTACT_ADDRESSES_URL,
  formatAddress,
  isAddressEmpty,
  type ContactAddress,
  type ContactAddressRow,
  type ContactDetail,
} from "@/components/modules/contacts/shared";

type AddressKey = "billing_address" | "shipping_address";

const ADDRESS_KEYS: (keyof ContactAddress)[] = [
  "attention", "address_line1", "address_line2", "city", "state", "postal_code", "country", "phone",
];

/** Project an address-book row down to the snapshot shape (drop id/label/flags). */
function toSnapshot(row: ContactAddressRow): ContactAddress {
  const out: ContactAddress = {};
  for (const k of ADDRESS_KEYS) out[k] = row[k] ?? "";
  return out;
}

/** True when a snapshot equals an address row across the snapshot fields — used to
 *  tell whether the card's current snapshot was copied from the row being edited. */
function snapshotMatches(snap: ContactAddress | undefined, row: ContactAddressRow): boolean {
  return ADDRESS_KEYS.every((k) => (snap?.[k] ?? "") === (row[k] ?? ""));
}

/** One editable address card: a live summary of the document's snapshot, plus a
 *  popover that lists the customer's saved addresses to pick from. The "new
 *  address" action opens a right-side Drawer with an *empty* form that creates a
 *  new address on the customer (Zoho-style) and selects it into this card.
 *
 *  `preserve: true` on the watch is essential — billing_address / shipping_address
 *  have no registered Form.Item at the parent path, so a plain useWatch would read
 *  undefined after a prefill and the card would show "—" even though it's set. */
function AddressCardEditable({
  schema,
  prefix,
  title,
  contactId,
  bookAddresses,
  onSelect,
  onCreate,
  onUpdate,
  onOpenPopover,
}: {
  schema: FieldSchema;
  prefix: AddressKey;
  title: string;
  contactId: number | null | undefined;
  bookAddresses: ContactAddressRow[];
  onSelect: (prefix: AddressKey, row: ContactAddressRow) => void;
  onCreate: (values: ContactAddress) => Promise<ContactAddressRow>;
  onUpdate: (id: number, values: ContactAddressRow) => Promise<ContactAddressRow>;
  onOpenPopover: () => void;
}) {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const value = Form.useWatch(prefix, { preserve: true }) as ContactAddress | undefined;
  const line = formatAddress(value);
  const empty = isAddressEmpty(value);
  const [pickOpen, setPickOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The row being edited — null while adding a brand-new address.
  const [editing, setEditing] = useState<ContactAddressRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [addrForm] = Form.useForm();

  const fieldSchema = useMemo(() => schema.nested(prefix), [schema, prefix]);

  const openCreate = () => {
    setPickOpen(false);
    setEditing(null);
    addrForm.resetFields(); // start from an empty form — this is a brand-new address
    setDrawerOpen(true);
  };

  const openEdit = (row: ContactAddressRow) => {
    setPickOpen(false);
    setEditing(row);
    addrForm.resetFields();
    addrForm.setFieldsValue(row); // prefill with the existing address
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  // Create or update the address on the customer, then keep this card in sync.
  const submitDrawer = async () => {
    let values: ContactAddress;
    try {
      values = (await addrForm.validateFields()) as ContactAddress;
    } catch {
      return; // field-level errors are shown inline
    }
    if (isAddressEmpty(values)) {
      message.warning(i18n.t("sales.addressRequired", { defaultValue: "请填写地址" }));
      return;
    }
    setSaving(true);
    try {
      if (editing?.id != null) {
        // Merge so the row's label / default flags / sort_order survive the update.
        const wasSelected = snapshotMatches(value, editing);
        const updated = await onUpdate(editing.id, { ...editing, ...values });
        // Re-sync only if this card was showing the address that just changed.
        if (wasSelected) onSelect(prefix, updated);
      } else {
        const created = await onCreate(values);
        onSelect(prefix, created);
      }
      closeDrawer();
    } catch {
      message.error(i18n.t("sales.saveFailed", { defaultValue: "保存失败，请重试" }));
    } finally {
      setSaving(false);
    }
  };

  const picker = (
    <div style={{ width: 300 }}>
      {/* Row highlights on hover; the edit pencil only fades in on hover (opacity,
          not display, so the address text never reflows). */}
      <style>{`
        .seacube-addr-row .seacube-addr-edit { opacity: 0; transition: opacity ${token.motionDurationMid} ease; }
        .seacube-addr-row:hover { background: ${token.colorFillTertiary}; }
        .seacube-addr-row:hover .seacube-addr-edit { opacity: 1; }
      `}</style>
      {bookAddresses.length > 0 ? (
        <>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {i18n.t("sales.pickSavedAddress", { defaultValue: "选择已有地址" })}
          </Typography.Text>
          <div style={{ maxHeight: 220, overflowY: "auto", margin: "6px 0" }}>
            {bookAddresses.map((a, i) => (
              <div
                key={a.id ?? i}
                className="seacube-addr-row"
                style={{ display: "flex", alignItems: "flex-start", gap: 4, padding: "6px 8px", borderRadius: 6 }}
              >
                {/* Click the body to use this address; the pencil (hover-only) edits it. */}
                <div
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  onClick={() => {
                    onSelect(prefix, a);
                    setPickOpen(false);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 500 }}>
                      {a.label || i18n.t("contacts.address", { defaultValue: "地址" })}
                    </span>
                    {a.is_default_billing && (
                      <Tag color="blue" style={{ marginInlineEnd: 0, fontSize: 11 }}>
                        {i18n.t("contacts.defaultBilling", { defaultValue: "默认账单" })}
                      </Tag>
                    )}
                    {a.is_default_shipping && (
                      <Tag color="green" style={{ marginInlineEnd: 0, fontSize: 11 }}>
                        {i18n.t("contacts.defaultShipping", { defaultValue: "默认收货" })}
                      </Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextTertiary }}>{formatAddress(a) || "—"}</div>
                </div>
                {a.id != null && (
                  <Button
                    type="text"
                    size="small"
                    className="seacube-addr-edit"
                    icon={<EditOutlined />}
                    aria-label={i18n.t("common.edit", { defaultValue: "编辑" })}
                    onClick={() => openEdit(a)}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {i18n.t("sales.noSavedAddress", { defaultValue: "该客户暂无已保存地址" })}
        </Typography.Text>
      )}
      <Divider style={{ margin: "8px 0" }} />
      <Button
        type="link"
        size="small"
        icon={<PlusOutlined />}
        style={{ paddingInline: 0 }}
        disabled={contactId == null}
        onClick={openCreate}
      >
        {i18n.t("sales.addAddress", { defaultValue: "新加地址" })}
      </Button>
    </div>
  );

  return (
    <Card
      size="small"
      style={{ flex: 1, minWidth: 240, borderRadius: 10 }}
      styles={{
        header: { minHeight: 38, fontSize: 12, color: token.colorTextSecondary, background: token.colorFillQuaternary },
        body: { padding: "12px 16px" },
      }}
      title={title}
      extra={
        <Popover
          trigger="click"
          placement="bottomRight"
          title={title}
          open={pickOpen}
          onOpenChange={(open) => {
            setPickOpen(open);
            if (open) onOpenPopover();
          }}
          content={picker}
        >
          <Button type="text" size="small" icon={<EditOutlined />} aria-label={i18n.t("common.edit", { defaultValue: "编辑" })} />
        </Popover>
      }
    >
      {empty ? (
        <Typography.Text type="secondary">—</Typography.Text>
      ) : (
        <div style={{ lineHeight: 1.7, fontSize: 13 }}>
          {value?.attention ? <div style={{ fontWeight: 600, color: token.colorText }}>{value.attention}</div> : null}
          {line ? <div style={{ color: token.colorTextSecondary }}>{line}</div> : null}
          {value?.phone ? <div style={{ color: token.colorTextTertiary }}>{value.phone}</div> : null}
        </div>
      )}

      {/* Add / edit an address on the customer — an isolated form (its own Form
          instance) so a *new* address never inherits the current snapshot, while an
          *edit* is seeded from the chosen row. Saving creates (POST) or updates
          (PUT) via the API. Kept separate from the document form. */}
      <Drawer
        title={
          editing
            ? i18n.t("sales.editAddress", { defaultValue: "编辑地址" })
            : i18n.t("sales.addAddress", { defaultValue: "新加地址" })
        }
        placement="right"
        size={420}
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnHidden
        footer={
          <div style={{ textAlign: "right" }}>
            <Button onClick={closeDrawer} style={{ marginInlineEnd: 8 }}>
              {i18n.t("common.cancel", { defaultValue: "取消" })}
            </Button>
            <Button type="primary" loading={saving} onClick={submitDrawer}>
              {i18n.t("common.save", { defaultValue: "保存" })}
            </Button>
          </div>
        }
      >
        <Form form={addrForm} layout="vertical">
          {/* `label` is a contact-address attribute (not part of the document
              snapshot schema), so it's a plain input rather than a SchemaField. */}
          <Form.Item name="label" label={i18n.t("contacts.addressLabel", { defaultValue: "标签" })}>
            <Input
              maxLength={100}
              placeholder={i18n.t("contacts.addressLabelHint", { defaultValue: "如:上海仓 / 总部" })}
            />
          </Form.Item>
          <AddressFields schema={fieldSchema} namePrefix={[]} />
        </Form>
      </Drawer>
    </Card>
  );
}

/** Billing + shipping address cards for a sales-document form. Snapshots are
 *  prefilled from the customer's defaults (useContactAddressPrefill); each card's
 *  popover lets the user pick another saved address or create a new one on the
 *  customer. The snapshots live on the form at billing_address / shipping_address. */
export default function DocumentAddressSection({ schema }: { schema: FieldSchema }) {
  const form = Form.useFormInstance();
  const contactId = Form.useWatch("contact") as number | null | undefined;
  const { getViewSet } = useDataService();
  const contactVs = useMemo(() => getViewSet(CONTACTS_URL), [getViewSet]);
  const addressVs = useMemo(() => getViewSet(CONTACT_ADDRESSES_URL), [getViewSet]);
  const [book, setBook] = useState<ContactAddressRow[]>([]);
  const loadedFor = useRef<number | null>(null);
  const bookReq = useRef(0);

  // Customer changed → drop the previous customer's address book immediately so the
  // picker can never show (or let you select) the wrong customer's rows, and bump
  // the request id so any in-flight load below is discarded.
  useEffect(() => {
    setBook([]);
    loadedFor.current = null;
    bookReq.current += 1;
  }, [contactId]);

  // Lazily load the customer's address book the first time a card's popover opens
  // (re-fetched when the customer changes — keyed on contactId).
  const loadBook = useCallback(() => {
    if (contactId == null) {
      setBook([]);
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === contactId) return;
    const req = (bookReq.current += 1);
    contactVs.retrieve({ id: contactId })
      .then((c) => {
        if (req !== bookReq.current) return; // superseded by a newer load / customer change
        setBook((c as ContactDetail).addresses ?? []);
        loadedFor.current = contactId;
      })
      .catch(() => {});
  }, [contactVs, contactId]);

  // Copy a saved address into the document snapshot (billing/shipping).
  const onSelect = useCallback(
    (prefix: AddressKey, row: ContactAddressRow) => form.setFieldValue(prefix, toSnapshot(row)),
    [form],
  );

  // Create a new address on the selected customer (Zoho "add additional address")
  // and return it so the card can select it into its snapshot.
  const onCreate = useCallback(
    async (values: ContactAddress): Promise<ContactAddressRow> => {
      const created = (await addressVs.create({ body: { contact: contactId, ...values } })) as ContactAddressRow;
      setBook((b) => [...b, created]);
      return created;
    },
    [addressVs, contactId],
  );

  // Update an existing address on the customer and replace it in the local book.
  const onUpdate = useCallback(
    async (id: number, values: ContactAddressRow): Promise<ContactAddressRow> => {
      const updated = (await addressVs.update({ id, body: { ...values, contact: contactId } })) as ContactAddressRow;
      setBook((b) => b.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [addressVs, contactId],
  );

  return (
    // align="stretch" + display:flex on each Col makes the cards equal height —
    // the Card's flex:1 then fills the stretched column.
    <Row gutter={16} align="stretch">
      <Col xs={24} md={12} style={{ display: "flex" }}>
        <AddressCardEditable
          schema={schema}
          prefix="billing_address"
          title={i18n.t("sales.billingAddress", { defaultValue: "账单地址" })}
          contactId={contactId}
          bookAddresses={book}
          onSelect={onSelect}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onOpenPopover={loadBook}
        />
      </Col>
      <Col xs={24} md={12} style={{ display: "flex" }}>
        <AddressCardEditable
          schema={schema}
          prefix="shipping_address"
          title={i18n.t("sales.shippingAddress", { defaultValue: "收货地址" })}
          contactId={contactId}
          bookAddresses={book}
          onSelect={onSelect}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onOpenPopover={loadBook}
        />
      </Col>
    </Row>
  );
}

/** Seed a document form's address snapshots from a saved document (edit mode) —
 *  blank on create. Spread into the form's `setFieldsValue`. */
export function documentAddressSeed(doc?: { billing_address?: ContactAddress; shipping_address?: ContactAddress } | null) {
  return { billing_address: doc?.billing_address ?? {}, shipping_address: doc?.shipping_address ?? {} };
}

/** Read the address snapshots from the form store at submit time. Read from the
 *  store (not validateFields' values) because the snapshot Form.Items mount lazily
 *  in the editor drawer, so an unopened card omits them from `values`. */
export function documentAddressBody(form: FormInstance) {
  return {
    billing_address: form.getFieldValue("billing_address") ?? {},
    shipping_address: form.getFieldValue("shipping_address") ?? {},
  };
}

/** Read-only billing + shipping cards for a sales-document detail page. Renders
 *  nothing when both snapshots are empty (e.g. a document created without one). */
export function DocumentAddressDisplay({
  billing,
  shipping,
}: {
  billing?: ContactAddress;
  shipping?: ContactAddress;
}) {
  if (isAddressEmpty(billing) && isAddressEmpty(shipping)) return null;
  return (
    <>
      <SectionLabel>{i18n.t("sales.addresses", { defaultValue: "地址" })}</SectionLabel>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <AddressCard title={i18n.t("sales.billingAddress", { defaultValue: "账单地址" })} address={billing} />
        <AddressCard title={i18n.t("sales.shippingAddress", { defaultValue: "收货地址" })} address={shipping} />
      </div>
    </>
  );
}

/**
 * Returns a handler that fills a document form's billing/shipping snapshots from
 * a customer's default addresses. Wire it to the form's `onValuesChange` and call
 * it when `contact` changes — `onValuesChange` fires only on user input, never on
 * setFieldsValue, so seeding an existing document never overwrites its snapshot.
 * Clearing the customer blanks both addresses.
 */
export function useContactAddressPrefill(): (form: FormInstance, contactId: number | null | undefined) => void {
  const { getViewSet } = useDataService();
  const vs = useMemo(() => getViewSet(CONTACTS_URL), [getViewSet]);
  // The customer whose prefill is current — a slower response for a previously
  // picked customer must not overwrite the snapshots for the latest one.
  const latest = useRef<number | null>(null);
  return useCallback(
    (form, contactId) => {
      latest.current = contactId ?? null;
      // setFieldValue (not setFieldsValue) so each snapshot is *replaced* at its
      // path — setFieldsValue deep-merges, so {} wouldn't clear the old address.
      if (contactId == null) {
        form.setFieldValue("billing_address", {});
        form.setFieldValue("shipping_address", {});
        return;
      }
      vs.retrieve({ id: contactId })
        .then((c) => {
          if (latest.current !== contactId) return; // superseded by a newer selection
          const contact = c as ContactDetail;
          form.setFieldValue("billing_address", contact.billing_address ?? {});
          form.setFieldValue("shipping_address", contact.shipping_address ?? {});
        })
        .catch(() => {});
    },
    [vs],
  );
}
