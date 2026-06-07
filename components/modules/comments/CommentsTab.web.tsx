import { Typography, Spin, theme } from "antd";
import i18n from "@/locale/i18n";
import { useCommentTimeline } from "./useCommentTimeline";
import CommentComposer from "./CommentComposer";
import { AuditRow, CommentRow } from "./timeline";

const { Text } = Typography;

type Props = { contentTypeId: number; objectId: number | string };

export default function CommentsTab({ contentTypeId, objectId }: Props) {
  const { entries, loading, submitting, submit } = useCommentTimeline(contentTypeId, objectId);
  const { token } = theme.useToken();

  return (
    <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 12 }}>
      <Text strong style={{ display: "block" }}>
        {i18n.t("comment.title")}
      </Text>

      <CommentComposer submitting={submitting} onSubmit={submit} />

      {loading ? (
        <Spin style={{ display: "block", margin: "24px auto" }} />
      ) : entries.length === 0 ? (
        <Text type="secondary" style={{ textAlign: "center", padding: "24px 0" }}>
          {i18n.t("comment.noActivity")}
        </Text>
      ) : (
        <div style={{ paddingTop: 4 }}>
          {entries.map((entry, idx) => {
            const isLast = idx === entries.length - 1;
            const key = `${entry._type}-${entry.id}`;
            return entry._type === "comment" ? (
              <CommentRow key={key} entry={entry} isLast={isLast} token={token} />
            ) : (
              <AuditRow key={key} entry={entry} isLast={isLast} token={token} />
            );
          })}
        </div>
      )}
    </div>
  );
}
