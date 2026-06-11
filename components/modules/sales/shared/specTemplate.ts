// Client-side mirror of apps/products/utils.py render_spec_template — keep the
// semantics in sync. Used for live description generation in the line-item
// editor; the backend re-applies the same rules for blank descriptions on save.

// `@` + spec code, optionally with a format modifier ("@glazing:percent").
// Unknown modifiers are left as literal text.
const PLACEHOLDER = /@([A-Za-z0-9_]+)(?::(percent))?/g;

/** All spec codes referenced by a template's @placeholders (mirrors backend template_codes). */
export function templateCodes(template: string): string[] {
  return [...new Set([...(template ?? "").matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

// Line-level placeholders resolved from the line item itself (not spec):
// @unit = pricing unit, @entry_unit = entry unit. A spec attribute with the
// same code wins (mirrors backend BUILTIN_TEMPLATE_CODES).
export const BUILTIN_TEMPLATE_CODES = new Set(["unit", "entry_unit"]);

/**
 * One spec value as display text. Booleans read as flags (true → the code
 * itself, false → ""); numbers drop trailing zeros ("10.000" → "10"); the
 * `percent` modifier scales a fraction ("0.10" → "10%").
 */
function formatValue(value: unknown, code: string, modifier?: string): string {
  if (value == null || value === false || value === "") return "";
  if (value === true) return code;
  if (typeof value !== "object") {
    const n = Number(value);
    if (Number.isFinite(n) && String(value).trim() !== "") {
      // toFixed dodges float artifacts (0.1 * 100 → 10.000000000000002).
      if (modifier === "percent") return `${Number((n * 100).toFixed(6))}%`;
      return String(n);
    }
  }
  return String(value);
}

/**
 * One comma-delimited segment, or null when it should be dropped. A segment
 * whose placeholders ALL resolve to empty is dropped entirely — its literal
 * prefix/suffix text (e.g. " glazing", "size: ") must not leak into the
 * description. Literal-only segments always render; a segment with several
 * placeholders survives if at least one resolves.
 */
function renderSegment(segment: string, values: Record<string, unknown>): string | null {
  const resolved: string[] = [];
  const out = segment.replace(PLACEHOLDER, (_, code: string, modifier?: string) => {
    const value = formatValue(values[code], code, modifier);
    resolved.push(value);
    return value;
  });
  if (resolved.length > 0 && resolved.every((v) => v === "")) return null;
  return out.trim();
}

/**
 * Substitute @code placeholders in `template` with values from `spec`, falling
 * back to `builtins` (line-level values such as unit/entry_unit). The template
 * is treated as newline-separated lines of comma-separated segments: segments
 * whose placeholders are all blank are dropped (so blank spec values don't
 * leave dangling labels/separators), survivors are joined with ", ", and lines
 * that end up empty disappear. Capped to the description column size.
 */
export function renderSpecTemplate(
  template: string,
  spec: Record<string, unknown> | null | undefined,
  builtins?: Record<string, unknown>,
  maxLength = 500,
): string {
  const values = { ...(builtins ?? {}), ...(spec ?? {}) };
  const lines = (template ?? "").split("\n").map((line) =>
    line
      .split(",")
      .map((segment) => renderSegment(segment, values))
      .filter((s): s is string => !!s)
      .join(", "),
  );
  return lines
    .filter((line) => line !== "")
    .join("\n")
    .slice(0, maxLength)
    .trim();
}
