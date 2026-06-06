import { useEffect, useState } from "react";
import { Button, Collapse, Drawer, Segmented, Select, Space, Typography } from "antd";
import { PlusCircleFilled } from "@ant-design/icons";
import { useIsActiveAdmin } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import CriteriaRow from "./CriteriaRow";
import ColumnPicker, { type ColumnOption } from "./ColumnPicker";
import VisibilityPicker from "./VisibilityPicker";
import SaveViewModal, { type SaveViewMeta } from "./SaveViewModal";
import {
  canEditView,
  type Criterion,
  type FieldDef,
  type FilterValue,
  type SavedView,
  type ViewMatch,
  type Visibility,
} from "./types";

export type { FilterValue };

type Props = {
  open: boolean;
  fields: FieldDef[];
  labelFor: (f: FieldDef) => string;
  allColumns: ColumnOption[];
  value: FilterValue;
  activeSavedView: SavedView | null;
  onClose: () => void;
  onApply: (v: FilterValue) => void;
  onSaveAs: (v: FilterValue, meta: SaveViewMeta) => Promise<void> | void;
  onUpdate: (v: FilterValue, visibility?: Visibility) => Promise<void> | void;
};

export default function FilterPanel({
  open,
  fields,
  labelFor,
  allColumns,
  value,
  activeSavedView,
  onClose,
  onApply,
  onSaveAs,
  onUpdate,
}: Props) {
  const isAdmin = useIsActiveAdmin();
  const [match, setMatch] = useState<ViewMatch>("all");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [ordering, setOrdering] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Seed the working copy each time the panel opens.
  useEffect(() => {
    if (!open) return;
    setMatch(value.match);
    setCriteria(value.criteria.map((c) => ({ ...c })));
    setColumns(value.columns.length ? [...value.columns] : allColumns.map((c) => c.key));
    setOrdering(value.ordering);
    // Non-admins can't share (canShare={isAdmin}); seed private so a Save As of a
    // shared view never submits visibility:"shared" for them.
    setVisibility(isAdmin ? (activeSavedView?.visibility ?? "private") : "private");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = (): FilterValue => ({ match, criteria, columns, ordering });

  const addCriterion = () =>
    setCriteria((c) => [
      ...c,
      {
        field: fields[0]?.name ?? "",
        operator: fields[0]?.operators[0]?.value ?? "",
        value: null,
      },
    ]);
  const updateCriterion = (i: number, next: Criterion) => setCriteria((c) => c.map((x, idx) => (idx === i ? next : x)));
  const removeCriterion = (i: number) => setCriteria((c) => c.filter((_, idx) => idx !== i));

  const sortDesc = ordering.startsWith("-");
  const sortField = ordering.replace(/^-/, "");
  const setSort = (field: string, desc: boolean) => setOrdering(field ? (desc ? `-${field}` : field) : "");

  const canUpdate = activeSavedView && canEditView(activeSavedView, isAdmin);

  const handleSaveAs = async (meta: { name: string; is_favorite: boolean }) => {
    setSaving(true);
    try {
      await onSaveAs(current(), { ...meta, visibility });
      setSaveOpen(false);
      onClose();
    } catch {
      // Save failed (the page already toasted) — keep the modal + panel open so
      // the user's criteria/name aren't discarded.
    } finally {
      setSaving(false);
    }
  };

  const sectionLabel = (text: string) => (
    <Typography.Text strong style={{ fontSize: 13 }}>
      {text}
    </Typography.Text>
  );

  const filterSection = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Match mode — reads as a short sentence; the toggle hugs its text
          instead of stretching, so it doesn't look like an empty bar. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {i18n.t("views.matchPrefix", { defaultValue: "满足以下" })}
        </Typography.Text>
        <Segmented
          value={match}
          onChange={(v) => setMatch(v as ViewMatch)}
          options={[
            {
              label: i18n.t("views.matchAll", { defaultValue: "全部" }),
              value: "all",
            },
            {
              label: i18n.t("views.matchAny", { defaultValue: "任一" }),
              value: "any",
            },
          ]}
        />
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {i18n.t("views.matchSuffix", { defaultValue: "条件" })}
        </Typography.Text>
      </div>
      {criteria.map((c, i) => (
        <CriteriaRow
          key={i}
          fields={fields}
          value={c}
          labelFor={labelFor}
          onChange={(next) => updateCriterion(i, next)}
          onRemove={() => removeCriterion(i)}
        />
      ))}
      <Button
        type="link"
        icon={<PlusCircleFilled />}
        onClick={addCriterion}
        style={{ alignSelf: "flex-start", paddingLeft: 0 }}
      >
        {i18n.t("views.addCriteria", { defaultValue: "添加条件" })}
      </Button>
    </div>
  );

  const sortSection = (
    // Not Space.Compact: Segmented renders a padded track instead of a real
    // border, so it never seams cleanly against the Select. Use a plain gap.
    <div style={{ display: "flex", gap: 8, width: "100%" }}>
      <Select
        style={{ flex: 1 }}
        allowClear
        value={sortField || undefined}
        onChange={(f) => setSort(f, sortDesc)}
        placeholder={i18n.t("views.sortField", { defaultValue: "排序字段" })}
        // Sort options are the *sortable* fields (≠ the listable column set).
        options={fields.filter((f) => f.sortable !== false).map((f) => ({ value: f.name, label: labelFor(f) }))}
      />
      <Segmented
        value={sortDesc ? "desc" : "asc"}
        onChange={(v) => setSort(sortField, v === "desc")}
        options={[
          {
            label: i18n.t("views.asc", { defaultValue: "升序" }),
            value: "asc",
          },
          {
            label: i18n.t("views.desc", { defaultValue: "降序" }),
            value: "desc",
          },
        ]}
      />
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      title={i18n.t("views.filterTitle", { defaultValue: "筛选" })}
      styles={{
        wrapper: { width: 550 },
        body: { padding: "8px 0" },
        footer: { padding: 12 },
      }}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <Button
            onClick={() => {
              setCriteria([]);
            }}
          >
            {i18n.t("views.clear", { defaultValue: "清除" })}
          </Button>
          <Space>
            {canUpdate && (
              <Button onClick={() => onUpdate(current(), visibility)}>
                {i18n.t("views.updateView", { defaultValue: "更新视图" })}
              </Button>
            )}
            <Button onClick={() => setSaveOpen(true)}>
              {i18n.t("views.saveAsView", { defaultValue: "另存为视图" })}
            </Button>
            <Button type="primary" onClick={() => onApply(current())}>
              {i18n.t("views.applyFilter", { defaultValue: "应用筛选" })}
            </Button>
          </Space>
        </div>
      }
    >
      <Collapse
        defaultActiveKey={["filter", "sort", "columns", "visibility"]}
        expandIconPlacement="end"
        bordered={false}
        style={{ background: "transparent" }}
        items={[
          {
            key: "filter",
            label: sectionLabel(i18n.t("views.filterSection", { defaultValue: "筛选条件" })),
            children: filterSection,
          },
          {
            key: "sort",
            label: sectionLabel(i18n.t("views.sort", { defaultValue: "排序" })),
            children: sortSection,
          },
          {
            key: "columns",
            label: sectionLabel(i18n.t("views.columns", { defaultValue: "列" })),
            children: <ColumnPicker allColumns={allColumns} value={columns} onChange={setColumns} />,
          },
          {
            key: "visibility",
            label: sectionLabel(i18n.t("views.visibility", { defaultValue: "可见性" })),
            children: <VisibilityPicker value={visibility} canShare={isAdmin} onChange={setVisibility} />,
          },
        ]}
      />

      <SaveViewModal
        open={saveOpen}
        saving={saving}
        initial={
          activeSavedView && activeSavedView.is_mine
            ? {
                name: activeSavedView.name,
                is_favorite: activeSavedView.is_favorite,
              }
            : undefined
        }
        onClose={() => setSaveOpen(false)}
        onSave={handleSaveAs}
      />
    </Drawer>
  );
}
