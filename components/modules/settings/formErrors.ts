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
