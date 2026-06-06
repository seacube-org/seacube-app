import i18n from "@/locale/i18n";

export type FieldType = "text" | "choice" | "number" | "date" | "boolean";

export type OperatorArity = "none" | "single" | "multi" | "range";

export type OperatorDef = { value: string; arity: OperatorArity };

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  operators: OperatorDef[]; // value + value-arity, server-driven
  choices?: { value: string; label: string; color?: string }[] | null; // color: optional Tag color (from OptionSet meta)
  sortable?: boolean;
  searchable?: boolean;
  // List-column metadata (schema-driven table) — see docs/schema-driven-columns.md.
  listable?: boolean; // may be a table column (ColumnPicker)
  width?: number | null; // default column width (px)
  align?: "left" | "right" | "center" | null;
};

export type Visibility = "private" | "shared";

/** Value-arity of a field's selected operator (server-declared via the schema). */
export function arityOf(field: FieldDef | undefined, operator: string): OperatorArity {
  return field?.operators.find((o) => o.value === operator)?.arity ?? "single";
}

export type Criterion = { field: string; operator: string; value: unknown };
export type ViewMatch = "all" | "any";

/**
 * A stored view (backend SavedView). Built-in views are `is_system` rows seeded
 * globally — same shape, just non-editable; their `name` arrives localized.
 */
export type SavedView = {
  id: number;
  entity: string;
  name: string;
  match: ViewMatch;
  criteria: Criterion[];
  columns: string[];
  ordering: string;
  page_size: number | null;
  visibility: Visibility;
  is_shared: boolean; // read-only convenience derived from visibility
  is_favorite: boolean;
  is_default: boolean;
  is_mine: boolean;
  is_system: boolean; // seeded built-in (All/Customers/...) — non-editable
  system_key: string; // stable id for system rows ('all' | 'customers' | ...)
};

/** What a list page applies to its table: filter criteria + columns + sort. */
export type FilterValue = {
  match: ViewMatch;
  criteria: Criterion[];
  columns: string[];
  ordering: string;
};

/** Project a stored view onto the comparable FilterValue (drops view-only metadata). */
export function viewToFilter(v: SavedView): FilterValue {
  // Empty ordering = no explicit sort (the backend still name-orders via Meta);
  // this keeps the column header sort cancellable instead of snapping back to name.
  return { match: v.match, criteria: v.criteria ?? [], columns: v.columns ?? [], ordering: v.ordering || "" };
}

/** Stable equality for two FilterValues (fixed key order via the projection). */
export function filtersEqual(a: FilterValue, b: FilterValue): boolean {
  const norm = (f: FilterValue) => JSON.stringify([f.match, f.criteria, f.columns, f.ordering]);
  return norm(a) === norm(b);
}

/** Who may edit/update a saved view: its owner or an org admin. */
export function canEditView(view: SavedView, isAdmin: boolean): boolean {
  return view.is_mine || isAdmin;
}

export function operatorLabel(op: string): string {
  const map: Record<string, [string, string]> = {
    contains: ["views.opContains", "包含"],
    not_contains: ["views.opNotContains", "不包含"],
    equals: ["views.opEquals", "等于"],
    not_equals: ["views.opNotEquals", "不等于"],
    starts_with: ["views.opStartsWith", "开头为"],
    ends_with: ["views.opEndsWith", "结尾为"],
    is_empty: ["views.opIsEmpty", "为空"],
    is_not_empty: ["views.opIsNotEmpty", "不为空"],
    is: ["views.opIs", "是"],
    is_not: ["views.opIsNot", "不是"],
    in: ["views.opIn", "属于"],
    gt: ["views.opGt", "大于"],
    lt: ["views.opLt", "小于"],
    gte: ["views.opGte", "大于等于"],
    lte: ["views.opLte", "小于等于"],
    between: ["views.opBetween", "介于"],
    on: ["views.opOn", "在"],
    before: ["views.opBefore", "早于"],
    after: ["views.opAfter", "晚于"],
    in_the_last: ["views.opInTheLast", "最近 N 天内"],
    is_true: ["views.opIsTrue", "为真"],
    is_false: ["views.opIsFalse", "为假"],
  };
  const e = map[op];
  return e ? i18n.t(e[0], { defaultValue: e[1] }) : op;
}
