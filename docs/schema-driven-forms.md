# Schema-driven forms — 设计方案

表单字段如何从**后端字段 schema** 渲染，而非在 JSX 里硬编码（label / required / choices / maxLength / 输入类型 / 字段集）。目标是消除"后端改了、前端没改"的漂移，并**分阶段**推进，避免一次性大重构。

> 配套：参考/主数据见 `seacube-server/apps/core`（`Currency` 表、`OptionSet` 表）；列表筛选字段 schema 见 `seacube-server/apps/preferences`（registry / `/fields/`）。

---

## 现状（已实现到哪）

| 维度                                     | 现状                                    | 来源                                                                                                                                                                             |
| ---------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **choice 值集**                          | ✅ 动态                                 | `type` ← DRF `OPTIONS`（`useFieldMeta`）；`currency` ← `Currency` 表（`useCurrencies`）；`incoterms`/`shipment_type` ← `OptionSet`（registry `ref`，**filter 已用、form 待用**） |
| `required` / `maxLength`                 | ❌ 硬编码在 `Form.Item.rules` / `Input` | `useFieldMeta` **已 expose** 但 form 未消费                                                                                                                                      |
| `label`                                  | ❌ 硬编码 i18n                          | 刻意（见下）                                                                                                                                                                     |
| 字段集 / 顺序 / 输入类型 / 只读 / 可见性 | ❌ 手写 JSX                             | —                                                                                                                                                                                |

即：**当前只有 choice 的"值"是 schema/数据驱动的**，其余仍手写。

---

## Schema 来源（契约）

三个互补来源，各管一段：

1. **DRF `OPTIONS`**（每 viewset，`actions.POST`/`PUT`/`PATCH`）→ `type` / `required` / `label` / `max_length` / `read_only` / `choices`。
   - 优点：内置，随 serializer 自动；
   - 注意：受 **create/update 权限**门控（无权限则 `actions` 不出现）、按 viewset、嵌套字段在 `child.children` 里；POST/PUT/PATCH 语义不同（见注意点）。
2. **后端配置/参考数据** —— 分两类，**前端在读取层统一**：
   - **普通可配置枚举 / 自定义选项** → 统一进 **`OptionSet`(+`meta` JSON)**：`incoterms` / `shipment_type` / `unit` / 管理员自定义选项。
   - **带业务属性 / 约束的对象** → **保留专用模型**：`Currency`（精度、符号、未来汇率），以及未来的 `TaxRate` / `PaymentTerm` 等。
   - **前端统一在读取层**：一个 `useReferenceOptions(ref)` hook，`ref ∈ {'currency', 'optionset:<category>'}`，分别路由到 `currencies` / `option-sets` API —— **镜像后端 registry 的 `resolve_choices`**。原则：**统一的是前端 option 读取接口，不一定统一后端表**。
3. **（Phase 3，可选）专用 `describe` / `layout` 端点** → 解耦 CRUD 权限，携带**分区 / 顺序 / 可见性 / 记录类型布局 / 自定义字段**。Salesforce `describe` / Zoho `fields`+`layouts` / Odoo `fields_get`+视图的做法。

### 后端：OptionSet（普通枚举） vs 专用模型（业务对象）

```
OptionSet(category, code, label, sort, is_active, meta: JSON)
```

- **一表多类目**：`incoterms` / `shipment_type` / `unit` / 未来任意普通 picklist。
- **`meta` JSON**：承载零散展示属性 + **管理员自定义选项**的额外属性（无需改表 / 发版）—— 这是"配置完后把 custom option 写进 option 数据结构"的落点。

**何时用专用模型（不进 OptionSet）：**

- `Currency`：`decimal_places` 参与**金额舍入/格式化**（强类型 int）、`symbol`、未来 **`CurrencyRate`**（时间序列 date/base/quote/rate，按 `code` 关联）。
- 未来 `TaxRate` / `PaymentTerm` 等带计算/约束的对象同理。
- **判据**：需要**强类型列 / DB 约束 / FK 关系 / 复杂查询报表** → 专用模型；只是 `code+label`（+少量展示属性）→ `OptionSet`。

> **决策（已修订，撤回"把 currency 并入 OptionSet"）**：统一在**前端读取层**而非后端表。保留 `Currency` 作为 master data 的类型安全与汇率扩展空间；把财务精度/汇率塞进无类型 JSON 风险偏大，且会弱化未来 `CurrencyRate` 的 FK 关系。管理员一致性靠一个"参考数据"设置页聚合 `Currency` + `OptionSet` 各类目，而非一张表。

---

## 前端统一的字段元数据形状

把上面来源归一成一个 `FieldMeta`，渲染器只认它：

```ts
type FieldMeta = {
  name: string;
  type: "text" | "number" | "date" | "boolean" | "choice";
  label?: string; // schema 标签，仅作 i18n 的 fallback
  required: boolean;
  read_only: boolean;
  max_length?: number;
  choices?: { value: string; label: string }[]; // 来自 OPTIONS 或 ref 解析
};
```

来源映射：`OPTIONS` → type/required/label/max_length/read_only/choices；`ref ∈ {'currency', 'optionset:<category>'}` 经 `useReferenceOptions` 动态解析 choices（`currency`→currencies API，`optionset:*`→option-sets API）；前端按 **field key 做 i18n**，schema label 兜底。

---

## 渲染分层（逐步消费 schema，每层独立可交付）

- **L0｜现状** — 手写 JSX，仅 choice 值动态。
- **L1｜先做（contacts 表单）** — 布局仍手写，但每个顶层字段：
  - **`required` + `maxLength` 从 `FieldMeta` 读**（label 仍 i18n）；
  - **按 `schema.hasField(name)` 决定是否渲染** —— 解决 staff-hidden（`OPTIONS` 不返回 `tax_id`/`payment_terms` → 不渲染），不只是 required/maxLength；
  - choice options 从 `useReferenceOptions` / `useFieldMeta`。
  - 收益：消除**校验漂移** + staff-hidden 字段不再被硬渲染。改动小、低风险。
  - 实现：`fieldRules(meta, name, msg)` 生成 antd `rules`；`<Input maxLength={meta(name)?.max_length} />`；`hasField` gate；**保留** submit-time drop-blank 作为双保险。
  - 嵌套（persons / bank）：本阶段**保持手写**（嵌套 schema 在 `OPTIONS` 的 `child.children`，留到 L2 统一）。
- **L2｜按类型自动选控件（✅ 已实现）** — `string→Input`、`integer/float/decimal→InputNumber`、`date/datetime→DatePicker`、`boolean→Switch`、`choice/ref→Select`。
  - **`<SchemaField schema name [namePath] config />`**（`components/modules/base/SchemaField.tsx`）：按 `OPTIONS` type 选默认控件，折叠 `required`/`maxLength`/可见性；**自定义入口**：`config.control`（整控件逃生舱）+ `ref`/`options`/`rules`/`inputProps`/`itemProps`/`valuePropName` 旋钮。**渲染哪些字段、分区、顺序仍由页面声明**。
  - **嵌套路径规范（已落地）**：`useFieldMeta` 递归解析 `child.children`（many=True 列表）/ `children`（单嵌套对象）进 `FieldMeta.children`，并暴露 `schema.nested(name)` 返回子 schema；`SchemaField` 用 `name` 查 schema 元数据、`namePath`（如 `[index, "bank_name"]`）定位 `Form.Item`。persons / bank_accounts 两个 `Form.List` 已迁移，`required` 全部来自后端。
- **L3｜完整元数据驱动（Phase 3）** — 字段集 / 顺序 / 分区 / 可见性 / 只读 / 记录类型布局全部来自后端 `describe`/`layout`；支持**管理员自定义字段**。一个通用 `<SchemaForm schema=… />`。仅当"自定义字段/布局"成为产品目标时才做。

---

## 关键设计决策 / 注意点

- **字段 label 走后端 schema（✅ 已实现，对齐成熟 ERP）**：成熟 ERP（Salesforce describe / Zoho metadata / Odoo `fields_get`）都把**字段 label 放服务端元数据 + 服务端本地化**，因为字段可被管理员重命名/自定义，前端无法硬编码。我们落法：模型 `verbose_name=_('...')`(gettext) → DRF `OPTIONS` 返回 label → 前端 `<SchemaField>` 去掉 `config.label`、兜底 `meta.label`；本地化靠 `Accept-Language`（见下）。**同名不同译**用不同 msgid 区分（`Contact.name`→名称 用 `_('Name')`，`ContactPerson.name`→姓名 用 `_('Full Name')`）。`config.label` 仅作覆写;`<SchemaField>` 冷加载兜底用 `humanize(name)`。
  - **分工**：字段/选项 label = 后端 schema（gettext）；**静态 chrome**（按钮、tab、分区标题、通用提示）= 前端 i18n bundle —— 成熟 ERP 也这么分。
- **OPTIONS 区分 create / edit / partial**：`actions.POST`（create）、`PUT`（full update）、`PATCH`（partial）语义不同。
  - create form 用 `actions.POST`；edit（全字段）用 `PUT`，或仍用 POST schema 但**仅作 UI 校验**；
  - **PATCH/只存改动字段时，不得因 `schema.required` 阻止提交未改字段**。我们的表单是"全字段提交"，故 edit 时 required 字段恒在场、实务 OK；但部分提交/新表单须遵此。
- **staff-hidden 字段**：后端对 STAFF 隐藏 `tax_id`/`payment_terms`（`FieldPermissionMixin`）。L1 必须**按 `hasField` gate 渲染**（`OPTIONS` 不返回 → 不渲染）；并**保留** submit-time drop-blank（双保险）。
- **权限门控 ≠ schema 驱动**：mutation 入口已用 `useCan` 隐藏；schema 驱动不替代权限门控。
- **校验分工**：`required`/`maxLength` 来自 schema；复杂规则（email 格式、跨字段）仍前端；后端 400 由 `applyFieldErrors` 映射到字段（已有）。
- **缓存**：`OPTIONS`/`describe` 强缓存（`useFieldMeta` 已做），随部署失效；参考数据按 source 缓存（`useReferenceOptions`：currencies / 每个 option-set category）。
- **Accept-Language**（可选）：若将来消费 schema 的 `label`/`choices` 标签，DataService 带 `Accept-Language` 让后端返回本地化标签（当前 type 用 i18n、currency 用表 name，暂不需要）。

---

## 推进里程碑

1. **L1（先做，低风险高收益）**：`contacts` 表单的 `required` + `maxLength` + `choices` + **`hasField` gate**（顶层字段）。
2. **前端读取层统一**：`useReferenceOptions(ref)` 适配器（`currency`→currencies API；`optionset:*`→option-sets），把 `useCurrencies` 调用迁过去；给 `OptionSet` 加 `meta`（供普通类目/自定义选项带属性）。**`Currency` 后端保持专用，不迁表。**
3. **L2（✅ 已完成）**：嵌套路径规范（`schema.nested` + `namePath`）+ `<SchemaField>` by-type 控件渲染器（带自定义入口）；contacts 顶层 + persons/bank 嵌套全部迁移，新模块表单复用。
4. **L3**：引入 `describe`/`layout` 端点 + `<SchemaForm>`，仅当需要管理员自定义字段时。
5. **（判据，远期）** 某 `OptionSet` 类目长出强类型列 / FK / 复杂查询（如真要做汇率逻辑），再**提取为专用模型**（与 `Currency` 同级）。

## 验证

- 后端：`OPTIONS` 返回 contacts 字段的 `required`/`max_length`/`choices`（补测试）；`currencies` / `option-sets` 端点（已测）。
- 前端：后端把某字段改必填 / 对 STAFF 隐藏某字段 / 新增一个 currency 或 incoterm → 表单自动跟随（手测）；`tsc` + `eslint`。

---

> **当前落点**：L2（contacts 顶层 + 嵌套 persons/bank 全部由 `<SchemaField>` 驱动，带自定义入口）。**决策（已修订）**：撤回"currency 并入 OptionSet"；统一在**前端读取层**（`useReferenceOptions`），后端 `Currency`（及未来 `TaxRate`/`PaymentTerm`）保持专用模型，`OptionSet`(+`meta`) 管普通可配置枚举与自定义选项。执行顺序：**L1 → 前端读取层统一 → L2 ✅ → L3**（L3 待"自定义字段/布局"成为产品目标）。
