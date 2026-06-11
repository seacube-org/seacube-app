import { DatePicker, Input, InputNumber, Select, Space, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import i18n from "@/locale/i18n";
import { arityOf, operatorLabel, type Criterion, type FieldDef } from "./types";

type Props = {
  fields: FieldDef[];
  value: Criterion;
  labelFor: (f: FieldDef) => string;
  onChange: (c: Criterion) => void;
  onRemove: () => void;
};

export default function CriteriaRow({ fields, value, labelFor, onChange, onRemove }: Props) {
  const field = fields.find((f) => f.name === value.field);

  const setField = (name: string) => {
    const f = fields.find((x) => x.name === name);
    // Reset operator/value to sensible defaults for the new field type.
    onChange({ field: name, operator: f?.operators[0]?.value ?? "", value: null });
  };
  const setOperator = (op: string) => onChange({ ...value, operator: op, value: null });
  const setValue = (v: unknown) => onChange({ ...value, value: v });

  const renderValue = () => {
    const arity = arityOf(field, value.operator);
    if (!field || !value.operator || arity === "none") return null;
    const isRange = arity === "range";

    if (field.type === "choice") {
      return (
        <Select
          mode={arity === "multi" ? "multiple" : undefined}
          value={(value.value as string | string[]) ?? undefined}
          onChange={setValue}
          options={field.choices ?? []}
          style={{ flex: 1, minWidth: 0 }}
          placeholder={i18n.t("views.value", { defaultValue: "值" })}
          allowClear
        />
      );
    }
    if (field.type === "number") {
      if (isRange) {
        const arr = (Array.isArray(value.value) ? value.value : [null, null]) as (number | null)[];
        return (
          <Space.Compact style={{ flex: 1 }}>
            <InputNumber style={{ width: "50%" }} value={arr[0]} onChange={(v) => setValue([v, arr[1]])} />
            <InputNumber style={{ width: "50%" }} value={arr[1]} onChange={(v) => setValue([arr[0], v])} />
          </Space.Compact>
        );
      }
      return <InputNumber style={{ flex: 1 }} value={value.value as number} onChange={setValue} />;
    }
    if (field.type === "date") {
      if (value.operator === "in_the_last") {
        return (
          <InputNumber
            style={{ flex: 1 }}
            min={1}
            value={value.value as number}
            onChange={setValue}
            addonAfter={i18n.t("views.days", { defaultValue: "天" })}
          />
        );
      }
      if (isRange) {
        const arr = (Array.isArray(value.value) ? value.value : [null, null]) as (string | null)[];
        return (
          <Space.Compact style={{ flex: 1 }}>
            <DatePicker
              style={{ width: "50%" }}
              value={arr[0] ? dayjs(arr[0]) : null}
              onChange={(d) => setValue([d ? d.format("YYYY-MM-DD") : null, arr[1]])}
            />
            <DatePicker
              style={{ width: "50%" }}
              value={arr[1] ? dayjs(arr[1]) : null}
              onChange={(d) => setValue([arr[0], d ? d.format("YYYY-MM-DD") : null])}
            />
          </Space.Compact>
        );
      }
      return (
        <DatePicker
          style={{ flex: 1 }}
          value={value.value ? dayjs(value.value as string) : null}
          onChange={(d) => setValue(d ? d.format("YYYY-MM-DD") : null)}
        />
      );
    }
    // text
    return (
      <Input
        style={{ flex: 1 }}
        value={(value.value as string) ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder={i18n.t("views.value", { defaultValue: "值" })}
      />
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Select
        value={value.field || undefined}
        onChange={setField}
        // Only fields that declare operators are filterable; column-only fields
        // (e.g. computed statuses) are excluded from the criteria field picker.
        options={fields.filter((f) => f.operators.length > 0).map((f) => ({ value: f.name, label: labelFor(f) }))}
        placeholder={i18n.t("views.field", { defaultValue: "字段" })}
        style={{ width: 120, flexShrink: 0 }}
        showSearch
        optionFilterProp="label"
      />
      <Select
        value={value.operator || undefined}
        onChange={setOperator}
        options={(field?.operators ?? []).map((op) => ({ value: op.value, label: operatorLabel(op.value) }))}
        placeholder={i18n.t("views.operator", { defaultValue: "条件" })}
        style={{ width: 116, flexShrink: 0 }}
        disabled={!field}
      />
      {renderValue()}
      <Button type="text" size="small" icon={<CloseOutlined />} onClick={onRemove} />
    </div>
  );
}
