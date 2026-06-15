import { ApiError } from "@/services/DataService";

/**
 * Pull a human-readable message out of a DRF error payload, or null if there's
 * none. Handles the shapes DRF actually returns: a bare string, `{detail: "..."}`,
 * a non-field list `["..."]`, or field errors `{field: ["..."]}` (first one).
 * Use it to surface a backend reason (e.g. the contact delete-guard) on a failed
 * mutation, falling back to a generic toast when it returns null.
 */
export function extractApiErrorMessage(err: unknown): string | null {
  if (!(err instanceof ApiError) || !err.data) return null;
  const d = err.data;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return typeof d[0] === "string" ? d[0] : null;
  if (typeof d === "object") {
    const obj = d as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    const first = Object.values(obj)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
  }
  return null;
}
