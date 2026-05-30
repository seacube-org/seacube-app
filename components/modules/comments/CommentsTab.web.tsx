import { useState, useEffect, useCallback, useMemo } from 'react';
import { List, Input, Button, Radio, Space, Typography, Tag, Avatar, Spin, theme } from 'antd';
import { UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDataService } from '@/hooks/core/useDataService';
import i18n from '@/locale/i18n';

type UserDisplay = { id: number; username: string; display_name: string } | null;

type CommentEntry = {
  _type: 'comment';
  id: number;
  body: string;
  visibility: 'internal' | 'external';
  is_pinned: boolean;
  is_edited: boolean;
  author_display: UserDisplay;
  created_at: string;
};

type AuditEntry = {
  _type: 'audit';
  id: number;
  action: string;
  user_display: UserDisplay;
  timestamp: string;
  changes: Record<string, { old: unknown; new: unknown }>;
};

type TimelineEntry = CommentEntry | AuditEntry;

function entryTime(e: TimelineEntry): string {
  return e._type === 'comment' ? e.created_at : e.timestamp;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

function authorName(a: UserDisplay): string {
  if (!a) return i18n.t('comment.system');
  return a.display_name || a.username;
}

function summarizeChanges(changes: Record<string, { old: unknown; new: unknown }>): string {
  return Object.entries(changes)
    .map(([k, v]) => `${k}: ${String(v.old)} → ${String(v.new)}`)
    .join(', ');
}

type Props = { contentTypeId: number; objectId: number | string };

export default function CommentsTab({ contentTypeId, objectId }: Props) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'internal' | 'external'>('internal');
  const [submitting, setSubmitting] = useState(false);
  const { getViewSet } = useDataService();
  const { token } = theme.useToken();

  const commentVs = useMemo(() => getViewSet('/api/comments/'), [getViewSet]);
  const auditVs = useMemo(() => getViewSet('/api/audit/logs/'), [getViewSet]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { content_type_id: contentTypeId, object_id: String(objectId), page_size: 1000 };
      const [cData, aData] = await Promise.all([
        commentVs.list({ params }),
        auditVs.list({ params }),
      ]);
      const comments: CommentEntry[] = ((cData as { results?: unknown[] }).results ?? cData as unknown[])
        .map((c: unknown) => ({ ...(c as Omit<CommentEntry, '_type'>), _type: 'comment' as const }));
      const audits: AuditEntry[] = ((aData as { results?: unknown[] }).results ?? aData as unknown[])
        .map((a: unknown) => ({ ...(a as Omit<AuditEntry, '_type'>), _type: 'audit' as const }));
      const merged = [...comments, ...audits].sort(
        (a, b) => new Date(entryTime(a)).getTime() - new Date(entryTime(b)).getTime(),
      );
      setEntries(merged);
    } finally {
      setLoading(false);
    }
  }, [commentVs, auditVs, contentTypeId, objectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = useCallback(async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await commentVs.create({
        body: { body, visibility, content_type_id: contentTypeId, object_id: objectId },
      });
      setBody('');
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  }, [body, visibility, contentTypeId, objectId, commentVs, fetchAll]);

  return (
    <div style={{ padding: '16px 0' }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
        {i18n.t('comment.title')}
      </Typography.Text>

      {loading ? (
        <Spin style={{ display: 'block', margin: '24px auto' }} />
      ) : entries.length === 0 ? (
        <Typography.Text type="secondary">{i18n.t('comment.noActivity')}</Typography.Text>
      ) : (
        <List
          dataSource={entries}
          size="small"
          renderItem={(entry) => {
            if (entry._type === 'comment') {
              return (
                <List.Item style={{ alignItems: 'flex-start', border: 0, padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} size={28} />}
                    title={
                      <Space size={4}>
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          {authorName(entry.author_display)}
                        </Typography.Text>
                        {entry.visibility === 'external' && (
                          <Tag color="blue" style={{ fontSize: 11 }}>{i18n.t('comment.external')}</Tag>
                        )}
                        {entry.is_edited && (
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            ({i18n.t('comment.edited')})
                          </Typography.Text>
                        )}
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {formatTime(entry.created_at)}
                        </Typography.Text>
                      </Space>
                    }
                    description={
                      <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>{entry.body}</Typography.Text>
                    }
                  />
                </List.Item>
              );
            }
            return (
              <List.Item style={{ alignItems: 'flex-start', border: 0, padding: '8px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<InfoCircleOutlined />}
                      size={28}
                      style={{ backgroundColor: token.colorFillSecondary, color: token.colorTextSecondary }}
                    />
                  }
                  title={
                    <Space size={4}>
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        {authorName(entry.user_display)}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {formatTime(entry.timestamp)}
                      </Typography.Text>
                    </Space>
                  }
                  description={
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {entry.action}
                      {Object.keys(entry.changes).length > 0 && ` — ${summarizeChanges(entry.changes)}`}
                    </Typography.Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 12 }}>
        <Input.TextArea
          rows={3}
          placeholder={i18n.t('comment.placeholder')}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Radio.Group
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            size="small"
          >
            <Radio.Button value="internal">{i18n.t('comment.internal')}</Radio.Button>
            <Radio.Button value="external">{i18n.t('comment.external')}</Radio.Button>
          </Radio.Group>
          <Button
            type="primary"
            size="small"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!body.trim()}
          >
            {i18n.t('comment.submit')}
          </Button>
        </Space>
      </div>
    </div>
  );
}
