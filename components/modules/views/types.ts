import i18n from "@/locale/i18n";

export type FieldType = "text" | "choice" | "number" | "date" | "boolean";

export type OperatorArity = "none" | "single" | "multi" | "range";

export type OperatorDef = { value: string; arity: OperatorArity };

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  operators: OperatorDef[];        // value + value-arity, server-driven
  choices?: { value: string; label: string }[] | null;
  sortable?: boolean;
  searchable?: boolean;
};

export type Visibility = "private" | "shared";

/** Value-arity of a field's selected operator (server-declared via the schema). */
export function arityOf(field: FieldDef | undefined, operator: string): OperatorArity {
  return field?.operators.find((o) => o.value === operator)?.arity ?? "single";
}

export type Criterion = { field: string; operator: string; value: unknown };
export type ViewMatch = "all" | "any";

/** A stored, user-created view (backend SavedView). */
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
  is_shared: boolean;   // read-only convenience derived from visibility
  is_favorite: boolean;
  is_default: boolean;
  is_mine: boolean;
};

/** A virtual built-in view — frontend-only, never stored. */
export type SystemView = {
  key: string;            // 'all' | 'customers' | 'vendors'
  name: string;
  match: ViewMatch;
  criteria: Criterion[];
};

/** The thing the toolbar/page treats as "currently applied". */
export type ActiveView =
  | { kind: "system"; view: SystemView }
  | { kind: "saved"; view: SavedView };

export function activeViewId(active: ActiveView): string {
  return active.kind === "system" ? `sys:${active.view.key}` : `view:${active.view.id}`;
}

/** What a list page applies to its table: filter criteria + columns + sort. */
export type FilterValue = {
  match: ViewMatch;
  criteria: Criterion[];
  columns: string[];
  ordering: string;
};

/** Project a stored view onto the comparable FilterValue (drops view-only metadata). */
export function viewToFilter(v: SavedView): FilterValue {
  return { match: v.match, criteria: v.criteria ?? [], columns: v.columns ?? [], ordering: v.ordering || "name" };
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
