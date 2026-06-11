import type { FormInstance } from "antd";
import { ApiError } from "@/services/DataService";

/**
 * Map a DRF field-error payload (`{field: [msg, ...]}`) onto antd form fields.
 * Returns true if at least one field error was applied (so the caller can skip
 * a generic toast). The non-field `detail` key is ignored.
 */
export function applyFieldErrors(form: FormInstance, err: unknown): boolean {
  if (!(err instanceof ApiError) || !err.data || typeof err.data !== "object") return false;
  const fields = Object.entries(err.data as Record<string, unknown>)
    .filter(([name]) => name !== "detail")
    .map(([name, msgs]) => ({
      name,
      errors: (Array.isArray(msgs) ? msgs : [String(msgs)]).map(String),
    }));
  if (!fields.length) return false;
  form.setFields(fields);
  return true;
}

/**
 * First human-readable message under a nested list field (e.g. DRF `items`
 * errors like `[{spec: ["required"]}]`). applyFieldErrors maps these onto the
 * Form.List name, which renders no error slot — so a failed save would be
 * silent. Callers toast this message instead.
 */
export function nestedListError(err: unknown, field = "items"): string | null {
  if (!(err instanceof ApiError) || !err.data || typeof err.data !== "object") return null;
  const walk = (node: unknown): string | null => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) {
      for (const child of node) {
        const msg = walk(child);
        if (msg) return msg;
      }
    } else if (node && typeof node === "object") {
      for (const child of Object.values(node)) {
        const msg = walk(child);
        if (msg) return msg;
      }
    }
    return null;
  };
  return walk((err.data as Record<string, unknown>)[field]);
}
