/**
 * Unwrap a DRF list response. Paginated endpoints return `{results: [...]}`;
 * a few return a bare array. Returns `[]` for anything unexpected.
 */
export function rows<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const r = (res as { results?: T[] } | null)?.results;
  return Array.isArray(r) ? r : [];
}
