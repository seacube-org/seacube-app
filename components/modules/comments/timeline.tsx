import { type ReactNode } from "react";
import { Avatar, Tag, Typography, theme } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import i18n from "@/locale/i18n";
import {
  authorName,
  colorFromName,
  formatTime,
  initial,
  summarizeChanges,
  type AuditEntry,
  type CommentEntry,
} from "./shared";

const { Text } = Typography;

// Theme token is resolved once in the parent and threaded down: a long timeline
// renders many rows, so calling theme.useToken() per row would add a context
// subscription for each one.
type ThemeToken = ReturnType<typeof theme.useToken>["token"];

// Audit rows are a single line of text + a small icon node. The node box and
// the text share this line height so the icon sits centred on the text rather
// than dropped low (which a taller node box would cause).
const AUDIT_LINE_HEIGHT = 22;

// One timeline row: a left rail (node + connector line) and the content. The
// connector is a flex-grow line under the node, so it stretches to meet the
// next node regardless of content height; it is omitted on the last row.
export function TimelineRow({
  node,
  isLast,
  token,
  children,
}: {
  node: ReactNode;
  isLast: boolean;
  token: ThemeToken;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
        {node}
        {!isLast && (
          <div
            style={{ flex: 1, width: 2, marginTop: 4, borderRadius: 1, background: token.colorSplit, minHeight: 8 }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 20 }}>{children}</div>
    </div>
  );
}

export function CommentRow({ entry, isLast, token }: { entry: CommentEntry; isLast: boolean; token: ThemeToken }) {
  const name = authorName(entry.author_display);
  return (
    <TimelineRow
      isLast={isLast}
      token={token}
      node={
        <Avatar size={32} style={{ backgroundColor: colorFromName(name), fontSize: 14, flexShrink: 0 }}>
          {initial(name)}
        </Avatar>
      }
    >
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <Text strong style={{ fontSize: 13 }}>
          {name}
        </Text>
        {entry.visibility === "external" && (
          <Tag color="blue" style={{ fontSize: 11, margin: 0, lineHeight: "18px", border: "none" }}>
            {i18n.t("comment.external")}
          </Tag>
        )}
        {entry.is_edited && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({i18n.t("comment.edited")})
          </Text>
        )}
        <Text type="secondary" style={{ fontSize: 11, marginLeft: "auto" }}>
          {formatTime(entry.created_at)}
        </Text>
      </div>
      <div
        style={{
          marginTop: 6,
          padding: "8px 12px",
          background: token.colorFillQuaternary,
          borderRadius: token.borderRadius,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Text style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{entry.body}</Text>
      </div>
    </TimelineRow>
  );
}

export function AuditRow({ entry, isLast, token }: { entry: AuditEntry; isLast: boolean; token: ThemeToken }) {
  const name = authorName(entry.user_display);
  const hasChanges = Object.keys(entry.changes).length > 0;
  return (
    <TimelineRow
      isLast={isLast}
      token={token}
      node={
        <div
          style={{
            width: 32,
            height: AUDIT_LINE_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <InfoCircleOutlined style={{ color: token.colorTextQuaternary, fontSize: 16 }} />
        </div>
      }
    >
      <Text type="secondary" style={{ fontSize: 12, lineHeight: `${AUDIT_LINE_HEIGHT}px` }}>
        <Text strong style={{ fontSize: 12 }}>
          {name}
        </Text>{" "}
        {entry.action}
        {hasChanges && ` — ${summarizeChanges(entry.changes)}`}
        <Text type="secondary" style={{ fontSize: 11, opacity: 0.7 }}>
          {"  ·  "}
          {formatTime(entry.timestamp)}
        </Text>
      </Text>
    </TimelineRow>
  );
}
