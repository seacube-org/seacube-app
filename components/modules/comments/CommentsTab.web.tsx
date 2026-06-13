import { Typography, Spin, theme } from "antd";
import i18n from "@/locale/i18n";
import { SectionLabel, TAB_PANE_STYLE } from "@/components/modules/base/sections";
import { useCommentTimeline } from "./useCommentTimeline";
import CommentComposer from "./CommentComposer";
import { AuditRow, CommentRow } from "./timeline";

const { Text } = Typography;

type Props = { contentTypeId: number; objectId: number | string };

export default function CommentsTab({ contentTypeId, objectId }: Props) {
  const { entries, loading, submitting, submit } = useCommentTimeline(contentTypeId, objectId);
  const { token } = theme.useToken();

  return (
    <div style={TAB_PANE_STYLE}>
      <SectionLabel first>{i18n.t("comment.title")}</SectionLabel>

      <CommentComposer submitting={submitting} onSubmit={submit} />

      {loading ? (
        <Spin style={{ display: "block", margin: "24px auto" }} />
      ) : entries.length === 0 ? (
        <Text type="secondary" style={{ display: "block", textAlign: "center", padding: "24px 0" }}>
          {i18n.t("comment.noActivity")}
        </Text>
      ) : (
        <div style={{ marginTop: 16 }}>
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
