import { useState, useEffect } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";

type ContentTypeMap = Record<string, number>;

const MAX_RETRIES = 3;
let _cache: ContentTypeMap | null = null;
let _inflight: Promise<void> | null = null;
let _failCount = 0;
const _listeners: Array<(m: ContentTypeMap) => void> = [];
const _retryTriggers: Array<() => void> = [];

export function useContentType(modelName: string): number | null {
  const [map, setMap] = useState<ContentTypeMap | null>(_cache);
  const [fetchAttempt, setFetchAttempt] = useState(0);
  const { getViewSet } = useDataService();

  useEffect(() => {
    if (_cache) return;

    const handler = (m: ContentTypeMap) => setMap(m);
    const retryHandler = () => setFetchAttempt((n) => n + 1);
    _listeners.push(handler);
    _retryTriggers.push(retryHandler);

    if (!_inflight) {
      const vs = getViewSet(API_ENDPOINTS.contentTypes);
      _inflight = vs
        .list()
        .then((data) => {
          _cache = data as ContentTypeMap;
          _failCount = 0;
          _listeners.forEach((fn) => fn(_cache!));
        })
        .catch(() => {
          if (_failCount < MAX_RETRIES) {
            _failCount++;
            setTimeout(() => _retryTriggers.forEach((fn) => fn()), 3000);
          }
        })
        .finally(() => {
          _inflight = null;
        });
    }

    return () => {
      const i = _listeners.indexOf(handler);
      if (i >= 0) _listeners.splice(i, 1);
      const j = _retryTriggers.indexOf(retryHandler);
      if (j >= 0) _retryTriggers.splice(j, 1);
    };
  }, [getViewSet, fetchAttempt]);

  return map ? (map[modelName] ?? null) : null;
}
