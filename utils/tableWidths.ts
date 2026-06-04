/**
 * Per-device column widths (localStorage).
 *
 * Column widths are device-specific (screen size differs per device), so they're
 * the sole-authority of localStorage — never synced to the server. Keyed per
 * (entity, user, org) by the caller. Distinct from server-side UiState, which
 * holds the cross-device resume pointer + view prefs; the two stores own
 * different data, so there is no reconciliation.
 *
 * Intentionally uses `localStorage` directly rather than the repo's async
 * `utils/storage.ts`: widths are web-only (antd table) and must hydrate
 * synchronously in `useResizableColumns`' useState initializer to avoid a
 * first-paint flash — an awaited read can't do that.
 */

const PREFIX = "seacube:colw:";

export function loadColumnWidths(key: string): Record<string, number> {
  if (typeof localStorage === "undefined" || !key) return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFIX + key) ?? "null");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveColumnWidths(key: string, widths: Record<string, number>): void {
  if (typeof localStorage === "undefined" || !key) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(widths));
  } catch {
    /* quota / private-mode — widths are non-critical, ignore */
  }
}
