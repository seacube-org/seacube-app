import { useCallback, useState, type KeyboardEvent } from "react";
import { Input, Button, Segmented, theme } from "antd";
import i18n from "@/locale/i18n";
import type { Visibility } from "./shared";

type Props = {
  submitting: boolean;
  onSubmit: (body: string, visibility: Visibility) => Promise<void>;
};

/**
 * The "add a comment" box pinned above the feed. Owns its own draft state so
 * typing never re-renders the timeline. Ctrl/⌘+Enter submits. The internal/
 * external toggle controls whether the comment is visible to clients.
 */
export default function CommentComposer({ submitting, onSubmit }: Props) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("internal");
  const { token } = theme.useToken();

  const submit = useCallback(async () => {
    // Guard on `submitting` too: the keyboard shortcut bypasses the disabled
    // button, so a fast double Ctrl/⌘+Enter could otherwise post twice.
    if (submitting || !body.trim()) return;
    await onSubmit(body, visibility);
    setBody("");
  }, [submitting, body, visibility, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <div
      style={{
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        padding: 12,
        boxShadow: token.boxShadowTertiary,
      }}
    >
      <Input.TextArea
        variant="borderless"
        autoSize={{ minRows: 2, maxRows: 8 }}
        placeholder={i18n.t("comment.placeholder")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ padding: 0, resize: "none" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Segmented
          size="small"
          value={visibility}
          onChange={(v) => setVisibility(v as Visibility)}
          options={[
            { label: i18n.t("comment.internal"), value: "internal" },
            { label: i18n.t("comment.external"), value: "external" },
          ]}
        />
        <Button type="primary" onClick={submit} loading={submitting} disabled={!body.trim()}>
          {i18n.t("comment.submit")}
        </Button>
      </div>
    </div>
  );
}
