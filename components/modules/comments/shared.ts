import i18n from "@/locale/i18n";

export const COMMENTS_URL = "/api/comments/";
export const AUDIT_LOGS_URL = "/api/audit/logs/";

export type Visibility = "internal" | "external";

export type UserDisplay = { id: number; username: string; display_name: string } | null;

export type CommentEntry = {
  _type: "comment";
  id: number;
  body: string;
  visibility: Visibility;
  is_pinned: boolean;
  is_edited: boolean;
  author_display: UserDisplay;
  created_at: string;
};

export type AuditEntry = {
  _type: "audit";
  id: number;
  action: string;
  user_display: UserDisplay;
  timestamp: string;
  changes: Record<string, { old: unknown; new: unknown }>;
};

export type TimelineEntry = CommentEntry | AuditEntry;

export function entryTime(e: TimelineEntry): string {
  return e._type === "comment" ? e.created_at : e.timestamp;
}

// One cached formatter reused for every row — building the Intl options object
// per call is the expensive part of toLocaleString.
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function authorName(a: UserDisplay): string {
  if (!a) return i18n.t("comment.system");
  return a.display_name || a.username;
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// Deterministic, pleasant avatar colour derived from the author name so each
// person keeps a stable colour across the feed (à la Zoho Bigin). Named
// distinctly from the type-based `avatarColor` in contacts/shared.
const NAME_COLORS = ["#52c41a", "#1677ff", "#722ed1", "#eb2f96", "#fa8c16", "#13c2c2", "#f5222d"];
export function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
}

export function summarizeChanges(changes: Record<string, { old: unknown; new: unknown }>): string {
  return Object.entries(changes)
    .map(([k, v]) => `${k}: ${String(v.old)} → ${String(v.new)}`)
    .join(", ");
}
