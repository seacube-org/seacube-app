import { type ReactNode } from "react";
import { Card, Typography, theme } from "antd";
import { EnvironmentOutlined, PhoneOutlined } from "@ant-design/icons";
import { formatAddress, isAddressEmpty, type ContactAddress } from "@/components/modules/contacts/shared";

// SectionLabel / InfoRow moved to @/components/modules/base/sections — they are
// shared by every detail page, not just contacts.

/** Card summarizing one address (billing / shipping, or a labelled book entry). */
export function AddressCard({ title, address }: { title: ReactNode; address: ContactAddress | undefined }) {
  const { token } = theme.useToken();
  const line = formatAddress(address);
  const isEmpty = isAddressEmpty(address);
  return (
    <Card
      size="small"
      style={{ flex: 1, minWidth: 240, borderRadius: 10 }}
      styles={{
        header: { minHeight: 38, fontWeight: 600, background: token.colorFillQuaternary },
        body: { padding: "12px 16px" },
      }}
      title={
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: token.colorTextSecondary,
          }}
        >
          <EnvironmentOutlined style={{ color: token.colorPrimary, fontSize: 13 }} />
          {title}
        </span>
      }
    >
      {isEmpty ? (
        <Typography.Text type="secondary">—</Typography.Text>
      ) : (
        <div style={{ lineHeight: 1.7 }}>
          {address?.attention ? (
            <div style={{ fontWeight: 600, color: token.colorText }}>{address.attention}</div>
          ) : null}
          {line ? <div style={{ fontSize: 13, color: token.colorTextSecondary }}>{line}</div> : null}
          {address?.phone ? (
            <div
              style={{
                fontSize: 13,
                color: token.colorTextTertiary,
                marginTop: 2,
              }}
            >
              <PhoneOutlined style={{ marginInlineEnd: 6, fontSize: 12 }} />
              {address.phone}
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
