import { useState, useEffect, useCallback, useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import {
  AUDIT_LOGS_URL,
  COMMENTS_URL,
  entryTime,
  type AuditEntry,
  type CommentEntry,
  type TimelineEntry,
  type Visibility,
} from "./shared";

/**
 * Loads the merged comment + audit timeline for one object and exposes a
 * `submit` for posting a new comment. Newest entries come first.
 */
export function useCommentTimeline(contentTypeId: number, objectId: number | string) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { getViewSet } = useDataService();

  const commentVs = useMemo(() => getViewSet(COMMENTS_URL), [getViewSet]);
  const auditVs = useMemo(() => getViewSet(AUDIT_LOGS_URL), [getViewSet]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = { content_type_id: contentTypeId, object_id: String(objectId), page_size: 1000 };
      const [cData, aData] = await Promise.all([commentVs.list({ params }), auditVs.list({ params })]);
      const comments: CommentEntry[] = ((cData as { results?: unknown[] }).results ?? (cData as unknown[])).map(
        (c: unknown) => ({ ...(c as Omit<CommentEntry, "_type">), _type: "comment" as const }),
      );
      const audits: AuditEntry[] = ((aData as { results?: unknown[] }).results ?? (aData as unknown[])).map(
        (a: unknown) => ({ ...(a as Omit<AuditEntry, "_type">), _type: "audit" as const }),
      );
      // Newest first so the most recent activity sits right below the composer.
      const merged = [...comments, ...audits].sort(
        (a, b) => new Date(entryTime(b)).getTime() - new Date(entryTime(a)).getTime(),
      );
      setEntries(merged);
    } finally {
      setLoading(false);
    }
  }, [commentVs, auditVs, contentTypeId, objectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(
    // Visibility is chosen in the composer (internal vs client-visible);
    // defaults to "internal" when a caller omits it.
    async (body: string, visibility: Visibility = "internal") => {
      if (!body.trim()) return;
      setSubmitting(true);
      try {
        await commentVs.create({
          body: { body, visibility, content_type_id: contentTypeId, object_id: objectId },
        });
        await refresh();
      } finally {
        setSubmitting(false);
      }
    },
    [commentVs, contentTypeId, objectId, refresh],
  );

  return { entries, loading, submitting, submit, refresh };
}
