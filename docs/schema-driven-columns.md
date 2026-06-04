# Schema-driven table columns — 设计方案

列表表格的**列定义**（表头 label / 是否可排序 / 列类型 → 渲染器 / 宽度 / 哪些列、顺序）如何从**后端字段 schema** 来，而非在页面里硬编码 `baseColumns`。目标与 [schema-driven-forms.md](./schema-driven-forms.md) 一致：消除"后端改了、前端没改"的漂移，**单一字段元数据来源**。本方案是表单 `SchemaField`（L2）的姊妹件 —— 同样的"**按类型默认渲染 + 自定义入口**"模式，只是落在表格列上。

> 复用：列表筛选字段 schema 已存在于 `seacube-server/apps/preferences`（registry / `/fields/`）。**列定义复用同一份 schema**，不另起炉灶。

---

## 现状（已实现到哪）

| 维度 | 现状 | 来源 |
|------|------|------|
| **哪些列 / 顺序** | ✅ 数据驱动 | `SavedView.columns`（每视图存储）+ ColumnPicker；空则用默认集 |
| **字段元数据**（label / type / sortable / choices） | ✅ 已有 schema | `/api/preferences/fields/?entity=`（registry `FieldDef`），**已被 FilterPanel 消费** |
| **列定义**（title / width / sorter / render） | ❌ 硬编码 `baseColumns` | `index.web.tsx`：name(Avatar+链接) / type(彩色 Tag) / email / phone / currency |
| 列 label | ❌ 前端 `fieldLabel` i18n map | 客户端本地化 |

即：**"哪些列"已是数据驱动，但"列怎么定义"仍硬编码**，且 `sortable` / `label` 在 registry（给 filter）和 `baseColumns`（给表格）**各写了一遍 → 漂移点**。

---

## Schema 来源（契约）

复用**已有**的 registry 字段 schema（与 filter builder 同一份）：

```python
# apps/preferences/registry.py
@dataclass(frozen=True)
class FieldDef:
    name; label; type; operators; choices; source; sortable; searchable; ref
    # 新增：
    listable: bool = True            # 可作为表格列（出现在 ColumnPicker）
    width: Optional[int] = None      # 默认列宽
    align: Optional[str] = None      # 'left' | 'right' | 'center'（数字右对齐）
```

`/api/preferences/fields/?entity=contact` 已返回 `{name,label,type,choices,sortable,searchable,operators}`，本方案再补 `listable / width / align`。前端 `useSavedViews` 已加载这份 `fields` —— **列和 filter 共用它**。

> 为什么用 registry 而非 DRF `OPTIONS`：registry 是**列表导向**（自带 `sortable` / `searchable`、已加载），`OPTIONS` 是 serializer/表单导向。列用 registry，表单用 `OPTIONS`，各取所长（同 forms 方案的分工）。

---

## 设计（镜像 SchemaField L2）

### 前端：`useEntityColumns(fields, overrides)`

把字段 schema → antd 列：

```ts
useEntityColumns(fields, {
  name: { render: (v, r) => <Avatar/> + 链接, width: 260 },   // 自定义入口
  type: { render: (v) => <Tag color={typeColor(v)}>{typeLabel(v)}</Tag> },
})
```

每个 `listable` 字段生成一列：
- `title = f.label`、`key/dataIndex = f.name`、`sorter = f.sortable`、`width = override.width ?? f.width ?? 按类型默认`、`align`、`ellipsis = (type==='text')`；
- `render = override[name]?.render ?? 按类型默认渲染器`。

**自定义入口**（escape hatch，等价于 `SchemaField` 的 `config.control`）：`overrides[name]` 提供 `render` / `width` / `title` 覆盖默认。少数领域单元（头像名、彩色 Tag）走这里 —— 这是预期的，schema 不该消灭它们。

### 按类型默认渲染器

| `type` | 默认渲染 | 备注 |
|--------|----------|------|
| `text` | `ellipsis` 文本，空 → `—` | |
| `choice` | label（`choices` 的 value→label）；可选 `meta.color` → Tag | 见"选项颜色" |
| `number` | 右对齐、千分位 | |
| `date` | `toLocaleDateString` | |
| `boolean` | ✓ / — 图标 | |

### 列选择 / 顺序（不变）

`SavedView.columns` 存每视图可见列 + 顺序；ColumnPicker 选列。本方案只把 ColumnPicker 的"可选列"从 `baseColumns` 改为 **schema 的 listable 字段**；`applied.columns` 为空时默认显示全部 listable（registry 顺序，name 在首）。

### 选项颜色（M3）

`choice` 列若要彩色 Tag：颜色放进**选项 meta**（`OptionSet.meta.color` / choice 的 `color`），渲染器据此上色。`type` 是 `TextChoices` 枚举（无 meta），故 `type` 列**继续用 override**（客户端 `typeColor`/`typeLabel`，已本地化 + 带色）。即：通用 choice 列支持 meta 上色；`type` 走 override。

---

## 关键决策

- **源用 registry，不用 OPTIONS**：registry 列表导向、已带 `sortable`、已加载。
- **label 本地化在后端（gettext）**：registry label 现为英文字面量、前端 `fieldLabel` map 本地化。改为**后端 `/fields/` 用 `gettext(f.label)` 返回本地化 label**（随 `Accept-Language`，与 form label 方案一致），前端直接用 `f.label`，**删除 `fieldLabel` map**。`useSavedViews` 已随 locale 重取（系统视图名也靠它），列 label 一并刷新。
- **`listable` ≠ `filterable`**：registry 现列的是可筛选字段；列可能不同（只展示字段 / 可筛不展示）。加 `listable`（默认 True）独立控制。
- **choice label 本地化的坑**：静态 `choices`（如 `type`）经 `as_choices(str(label))` 在 app-ready **冻结于默认语言**，`/fields/` 不按请求本地化。故 `type`/`currency` 列用 **override**（客户端 helper）规避；通用 choice 列的 label 本地化留作后续（需把静态 choices 改成按请求解析）。
- **自定义渲染保留**：头像名、彩色 Tag、`—` 兜底 等经 override map —— 与表单 `config.control` 同理，bounded。

---

## 里程碑

1. **M1（后端）**：`FieldDef += listable/width/align`；`/fields/` 返回之 + `gettext` 本地化 label；contacts 注册补全列字段（name/type/email/phone/currency/payment_terms/created_at 的 width/align/listable）；补译 `Payment Terms`/`Created`；测试。
2. **M2（前端）**：`useEntityColumns(fields, overrides)`（by-type 渲染器 + override map）；`index.web.tsx` 用它替换 `baseColumns` + 删 `fieldLabel`；ColumnPicker 可选列来自 schema。
3. **M3**：通用 choice 列支持 `meta.color`；`type` 保留 override。**自定义字段自动成列**：任何注册进 registry 的字段（含未来管理员自定义字段）自动出现在 ColumnPicker / 表格 —— 无需前端改代码（架构属性，随 registry 扩展自然获得）。

---

## 文件改动

**后端**
- `apps/preferences/registry.py`：`FieldDef` 加 `listable/width/align`。
- `apps/preferences/views.py`：`SavedViewFieldsView` 返回 `listable/width/align` + `gettext(f.label)`。
- `apps/contacts/apps.py`：注册补列元数据（width/align/listable）。
- `locale/zh_Hans/django.po`：`Payment Terms`/`Created` 译文。
- `apps/preferences/tests.py`：`/fields/` 含 listable/width、label 本地化。

**前端**
- `hooks/core/useEntityColumns.tsx`（新）：schema → antd 列 + by-type 渲染器 + override。
- `app/(app)/(contacts)/index.web.tsx`：删 `baseColumns`/`fieldLabel`，改用 `useEntityColumns`；`allColumnOptions` 来自 schema。
- `components/modules/views/types.ts`：`FieldDef` 加 `listable/width/align`。

---

## 验证

- 后端：`/fields/?entity=contact` 返回 `listable/width/align`，label 随 `Accept-Language` 本地化（补测试）。
- 前端：后端把某字段 `sortable` 改 false / 加一个 listable 字段 → 表格自动跟随；切语言 → 列头本地化；`tsc` + `eslint`。

---

> **当前落点**：列的"哪些/顺序"已数据驱动（`SavedView.columns`）；本方案把"列定义"（label/sortable/type→渲染/宽度）也收归 registry schema，仅 name/type 等领域单元保留 override。与 forms 的 `SchemaField`（L2）完全同构：**按类型默认 + 自定义入口**。
