import { Form } from "antd";

/**
 * Enforce a single-select boolean flag across a `Form.List` of nested rows — e.g.
 * one default billing / shipping address, one primary contact person, one default
 * bank account. Returns a handler to call from a switch's `onChange` when it is
 * turned **on**; it clears the same flag on every other row.
 *
 * This mirrors the backend's partial unique constraint (+ sibling demotion in the
 * model `save()`), so the form can't show two "defaults" that the backend would
 * then silently collapse to whichever row was saved last.
 *
 * Usage (inside the component that renders the Form.List):
 *   const keepSingleDefault = useSingleDefault("addresses");
 *   // …onChange={(checked) => checked && keepSingleDefault("is_default_billing", name)}
 */
export function useSingleDefault(listName: string) {
  const form = Form.useFormInstance();
  return (flag: string, keepName: number) => {
    const rows = (form.getFieldValue(listName) as unknown[]) ?? [];
    rows.forEach((_, i) => {
      if (i !== keepName && form.getFieldValue([listName, i, flag])) {
        form.setFieldValue([listName, i, flag], false);
      }
    });
  };
}
