import { type ReactNode } from "react";
import { Card, Typography, theme } from "antd";
import { EnvironmentOutlined, PhoneOutlined } from "@ant-design/icons";
import { formatAddress, type ContactAddress } from "@/components/modules/contacts/shared";

/** Bold section heading inside the detail panels. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography.Text strong style={{ display: "block", fontSize: 13, margin: "18px 0 8px" }}>
      {children}
    </Typography.Text>
  );
}

/** A labelled value (label above value) in the basic-info panel. */
export function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 2 }}>
        {label}
      </Typography.Text>
      {value ? <span style={{ fontSize: 14 }}>{value}</span> : <Typography.Text type="secondary">—</Typography.Text>}
    </div>
  );
}

/** Card summarizing one address (billing / shipping). */
export function AddressCard({ title, address }: { title: string; address: ContactAddress | undefined }) {
  const { token } = theme.useToken();
  const line = formatAddress(address);
  const isEmpty = !address?.attention && !line && !address?.phone;
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
