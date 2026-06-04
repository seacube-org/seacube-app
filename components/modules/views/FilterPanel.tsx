import { useEffect, useState } from "react";
import { Button, Divider, Drawer, Segmented, Select, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useIsActiveAdmin } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import CriteriaRow from "./CriteriaRow";
import ColumnPicker, { type ColumnOption } from "./ColumnPicker";
import SaveViewModal, { type SaveViewMeta } from "./SaveViewModal";
import { canEditView, type Criterion, type FieldDef, type FilterValue, type SavedView, type ViewMatch } from "./types";

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
  onUpdate: (v: FilterValue) => Promise<void> | void;
};

export default function FilterPanel({
  open, fields, labelFor, allColumns, value, activeSavedView, onClose, onApply, onSaveAs, onUpdate,
}: Props) {
  const isAdmin = useIsActiveAdmin();
  const [match, setMatch] = useState<ViewMatch>("all");
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [ordering, setOrdering] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Seed the working copy each time the panel opens.
  useEffect(() => {
    if (!open) return;
    setMatch(value.match);
    setCriteria(value.criteria.map((c) => ({ ...c })));
    setColumns(value.columns.length ? [...value.columns] : allColumns.map((c) => c.key));
    setOrdering(value.ordering);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = (): FilterValue => ({ match, criteria, columns, ordering });

  const addCriterion = () =>
    setCriteria((c) => [...c, { field: fields[0]?.name ?? "", operator: fields[0]?.operators[0]?.value ?? "", value: null }]);
  const updateCriterion = (i: number, next: Criterion) =>
    setCriteria((c) => c.map((x, idx) => (idx === i ? next : x)));
  const removeCriterion = (i: number) => setCriteria((c) => c.filter((_, idx) => idx !== i));

  const sortDesc = ordering.startsWith("-");
  const sortField = ordering.replace(/^-/, "");
  const setSort = (field: string, desc: boolean) => setOrdering(field ? (desc ? `-${field}` : field) : "");

  const canUpdate = activeSavedView && canEditView(activeSavedView, isAdmin);

  const handleSaveAs = async (meta: SaveViewMeta) => {
    setSaving(true);
    try {
      await onSaveAs(current(), meta);
      setSaveOpen(false);
      onClose();
    } catch {
      // Save failed (the page already toasted) — keep the modal + panel open so
      // the user's criteria/name aren't discarded.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      width={400}
      title={i18n.t("views.filterTitle", { defaultValue: "筛选" })}
      styles={{ body: { paddingTop: 12 }, footer: { padding: 12 } }}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <Button onClick={() => { setCriteria([]); }}>{i18n.t("views.clear", { defaultValue: "清除" })}</Button>
          <Space>
            {canUpdate && (
              <Button onClick={() => onUpdate(current())}>
                {i18n.t("views.updateView", { defaultValue: "更新视图" })}
              </Button>
            )}
            <Button onClick={() => setSaveOpen(true)}>{i18n.t("views.saveAsView", { defaultValue: "另存为视图" })}</Button>
            <Button type="primary" onClick={() => onApply(current())}>
              {i18n.t("views.applyFilter", { defaultValue: "应用筛选" })}
            </Button>
          </Space>
        </div>
      }
    >
      {/* Match */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{i18n.t("views.match", { defaultValue: "匹配" })}</Typography.Text>
        <Segmented
          size="small"
          value={match}
          onChange={(v) => setMatch(v as ViewMatch)}
          options={[
            { label: i18n.t("views.matchAll", { defaultValue: "全部条件" }), value: "all" },
            { label: i18n.t("views.matchAny", { defaultValue: "任一条件" }), value: "any" },
          ]}
        />
      </div>

      {/* Criteria */}
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
      <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addCriterion} style={{ marginTop: 4 }}>
        {i18n.t("views.addCriteria", { defaultValue: "添加条件" })}
      </Button>

      <Divider style={{ margin: "16px 0" }} />

      {/* Sort */}
      <Typography.Text strong style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        {i18n.t("views.sort", { defaultValue: "排序" })}
      </Typography.Text>
      <Space.Compact style={{ width: "100%", marginBottom: 4 }}>
        <Select
          style={{ flex: 1 }}
          allowClear
          value={sortField || undefined}
          onChange={(f) => setSort(f, sortDesc)}
          placeholder={i18n.t("views.sortField", { defaultValue: "排序字段" })}
          options={allColumns.map((c) => ({ value: c.key, label: c.label }))}
        />
        <Segmented
          value={sortDesc ? "desc" : "asc"}
          onChange={(v) => setSort(sortField, v === "desc")}
          options={[
            { label: i18n.t("views.asc", { defaultValue: "升序" }), value: "asc" },
            { label: i18n.t("views.desc", { defaultValue: "降序" }), value: "desc" },
          ]}
        />
      </Space.Compact>

      <Divider style={{ margin: "16px 0" }} />

      {/* Columns */}
      <Typography.Text strong style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        {i18n.t("views.columns", { defaultValue: "列" })}
      </Typography.Text>
      <ColumnPicker allColumns={allColumns} value={columns} onChange={setColumns} />

      <SaveViewModal
        open={saveOpen}
        isAdmin={isAdmin}
        saving={saving}
        initial={activeSavedView && activeSavedView.is_mine
          ? { name: activeSavedView.name, is_favorite: activeSavedView.is_favorite, is_shared: activeSavedView.is_shared }
          : undefined}
        onClose={() => setSaveOpen(false)}
        onSave={handleSaveAs}
      />
    </Drawer>
  );
}
