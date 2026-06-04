import { Button, Typography, type FormInstance } from "antd";
import { ArrowDownOutlined } from "@ant-design/icons";
import { type FieldSchema } from "@/hooks/core/useFieldMeta";
import i18n from "@/locale/i18n";
import AddressFields from "./AddressFields";

/** Billing + shipping address sections, with a "copy billing → shipping" shortcut. */
export default function AddressTab({ schema, form }: { schema: FieldSchema; form: FormInstance }) {
  return (
    <>
      <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
        {i18n.t("contacts.billingAddress", { defaultValue: "账单地址" })}
      </Typography.Text>
      <AddressFields schema={schema} prefix="billing_address" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 12px" }}>
        <Typography.Text strong>
          {i18n.t("contacts.shippingAddress", { defaultValue: "收货地址" })}
        </Typography.Text>
        <Button
          type="link"
          size="small"
          icon={<ArrowDownOutlined />}
          style={{ padding: 0, height: "auto" }}
          onClick={() => form.setFieldValue("shipping_address", form.getFieldValue("billing_address") ?? {})}
        >
          {i18n.t("contacts.copyBilling", { defaultValue: "与账单地址相同" })}
        </Button>
      </div>
      <AddressFields schema={schema} prefix="shipping_address" />
    </>
  );
}
