import { renderSpecTemplate } from "../specTemplate";

// Shared divergence guard: these vectors mirror the backend test suite
// (seacube-server/apps/products/tests.py::SpecTemplateRenderTest) one-to-one.
// If a rendering rule changes on either side, update BOTH test files and BOTH
// implementations (specTemplate.ts ↔ apps/products/utils.py).
describe("renderSpecTemplate (mirrors backend render_spec_template)", () => {
  it("substitutes placeholders and keeps literals", () => {
    expect(
      renderSpecTemplate("@size 镀冰@glazing @outer_packaging", {
        size: "3-5oz",
        glazing: "0.10",
        outer_packaging: "散装",
      }),
    ).toBe("3-5oz 镀冰0.1 散装");
  });

  it("renders missing and blank values as empty", () => {
    expect(renderSpecTemplate("@a/@b", { a: "X" })).toBe("X/");
    expect(renderSpecTemplate("@a", { a: "" })).toBe("");
    expect(renderSpecTemplate("@a", null)).toBe("");
  });

  it("drops trailing zeros from numbers", () => {
    expect(renderSpecTemplate("@w", { w: "10.000" })).toBe("10");
    expect(renderSpecTemplate("@w", { w: 0.5 })).toBe("0.5");
  });

  it("reads booleans as flags", () => {
    expect(renderSpecTemplate("@iqf @x", { iqf: true, x: false })).toBe("iqf");
  });

  it("caps the result to max length", () => {
    expect(renderSpecTemplate("@a", { a: "x".repeat(600) })).toHaveLength(500);
  });

  it("passes non-spec text through", () => {
    expect(renderSpecTemplate("A级 16/20", {})).toBe("A级 16/20");
  });

  it("scales fractions with the percent modifier", () => {
    expect(renderSpecTemplate("镀冰@glazing:percent", { glazing: "0.10" })).toBe("镀冰10%");
    expect(renderSpecTemplate("@r:percent", { r: 0.135 })).toBe("13.5%");
    expect(renderSpecTemplate("@s:percent", { s: "N/A" })).toBe("N/A");
  });

  it("leaves unknown modifiers as literal text", () => {
    expect(renderSpecTemplate("@size:pct", { size: "3-5oz" })).toBe("3-5oz:pct");
  });

  it("keeps newlines", () => {
    expect(renderSpecTemplate("@size\n镀冰@glazing:percent", { size: "3-5oz", glazing: "0.1" })).toBe("3-5oz\n镀冰10%");
  });

  const TEMPLATE = "@grade, @glazing:percent glazing, size: @size, @gross_weight_per_carton/carton";

  it("renders all segments when every value is present", () => {
    expect(
      renderSpecTemplate(TEMPLATE, { grade: "Grade A", glazing: "0.10", size: "3-5oz", gross_weight_per_carton: "10" }),
    ).toBe("Grade A, 10% glazing, size: 3-5oz, 10/carton");
  });

  it("drops a blank segment together with its literal text", () => {
    expect(renderSpecTemplate(TEMPLATE, { grade: "Grade A", size: "3-5oz", gross_weight_per_carton: "10" })).toBe(
      "Grade A, size: 3-5oz, 10/carton",
    );
  });

  it("renders empty when all segments are blank", () => {
    expect(renderSpecTemplate(TEMPLATE, {})).toBe("");
  });

  it("always renders literal-only segments", () => {
    expect(renderSpecTemplate("Frozen, size: @size", {})).toBe("Frozen");
  });

  it("drops a line when all its segments drop", () => {
    expect(renderSpecTemplate("@size\n镀冰@glazing:percent", { size: "3-5oz" })).toBe("3-5oz");
  });

  it("resolves builtin unit placeholders from the line", () => {
    expect(
      renderSpecTemplate(
        "@gross_weight_per_carton@unit/@entry_unit",
        { gross_weight_per_carton: "10" },
        { unit: "KGS", entry_unit: "CTN" },
      ),
    ).toBe("10KGS/CTN");
  });

  it("lets a spec value win over a builtin of the same code", () => {
    expect(renderSpecTemplate("@unit", { unit: "spec-says" }, { unit: "KGS" })).toBe("spec-says");
  });
});
