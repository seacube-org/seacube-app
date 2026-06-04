# (app) — 已登录应用区

登录后的应用外壳与各业务模块页面。本目录是 Expo Router 的 `(app)` 路由组：包含顶部栏 + 侧边菜单（Web）/ 底部 Tabs（Native）的整体框架，以及挂在其下的各模块（contacts、后续 sales / purchases / inventory…）。

`contacts` 是**模块参考实现**——新模块照它的结构复制即可。

---

## 目录与路由

Expo Router 文件即路由；`(name)` 形式的分组**不产生**路径段，只用于组织与共享布局。

```
app/(app)/
├── _layout.tsx          # Native：底部 Tabs（仅 dashboard 可见，其余 href:null）
├── _layout.web.tsx      # Web：AppHeader + 可折叠 Sider 菜单 + <Slot/> 内容区
├── index.tsx            # 首页 / 仪表盘
└── (contacts)/          # 模块组（参考实现）
    ├── _layout.tsx      # Stack（headerShown:false）—— 让 index↔[id] 正常 push/pop
    ├── index.tsx        # Native 占位
    ├── index.web.tsx    # Web 列表页（ViewSelect + FilterPanel + DataTable）
    ├── [id].tsx         # Native 占位
    └── [id].web.tsx     # Web 全页详情（左信息栏 + 右 Tabs）
```

### 平台拆分
`.web.tsx` = Web（antd），`.tsx` = Native（RN 原生 + NativeWind）。**当前 Web 优先**，Native 业务页多为占位（`common.comingSoon`）。

### 导航接线（`components/modules/layout/constants.ts`）
- `ITEM_ROUTES` — 菜单 key → 路由路径（如 `contacts: "/(app)/(contacts)"`）。
- `PAGE_TO_KEY` — 子页面段 → 菜单 key（用于高亮带子项的模块）。
- 详情动态段 `[id]` 仍归属父模块：`_layout.web.tsx` 的 `selectedKeys` 对 `page.startsWith("[")` 回退到模块 key，保持父菜单高亮。

---

## 应用外壳

**Web（`_layout.web.tsx`）：** antd `Layout` = 顶部 `AppHeader`（机构切换 / 用户抽屉 / 设置入口）+ 可折叠 `Layout.Sider`（`Menu`，菜单项由 `useMenuItems` 生成）+ `<Slot/>` 内容区。

- **菜单按权限生成**：`useMenuItems(locale, perms, elevated)` 中 `perms = activeMembership.profile.module_permissions`（**逐组织**）；`elevated`（is_staff / superuser / 激活 ADMIN 角色）绕过 profile 直接看全量菜单。
- **切换机构即重挂载**：内容区 `<Layout.Content key={activeOrgId}>`，换组织时 `key` 变化触发 remount，各页 effect 重新拉取该组织的数据。
- 首次无机构的用户进入 `OrgOnboarding` 引导建组织。

**Native（`_layout.tsx`）：** `Tabs`，仅 dashboard 可见，模块组 `href:null` 隐藏（Web 优先期）。

---

## 模块页面模式

新模块页面由三块可复用基建拼成，**不要每页重写**：

### 1. 列表页（`index.web.tsx`）
- **`DataTable`**（`components/modules/base/DataTable.tsx`）：服务端分页 / 排序、可拖拽列宽、空态居中、底部分页条。传 `endpoint` + `columns` + `params` 即可。
- **自定义视图 / 筛选**（`components/modules/views/`）：`ViewSelect`（视图下拉：系统视图 + 我的 + 共享，含收藏/默认/编辑）+ `FilterPanel`（左侧滑入：条件构建 + 列选择 + 排序 + 另存为视图）。由后端 `preferences` app 驱动，详见 `seacube-server/apps/preferences/README.md`。
- 顶部工具栏：筛选按钮 + `ViewSelect` + 搜索框（**防抖 300ms**）+ 视图切换 + 新建按钮。
- 点击行 `router.push("/(app)/(contacts)/<id>")` 进详情。

### 2. 全页详情（`[id].web.tsx`）— Bigin 风格
- 头部：返回 + 头像 + 名称/类型 + 编辑 / 删除。
- 左：固定信息栏（Basic Info + 备注 + 最后修改）。
- 右：Tabs —— 概览 / 动态（`CommentsTab`：评论 + 审计时间轴）/ 文件（`AttachmentPanel`）。`useContentType(entity)` 解析 contentTypeId 挂载活动面板。
- 加载失败渲染错误态 + 返回，不卡 spinner。

### 3. 新建 / 编辑
- 滑入式 `Drawer` 表单（如 `ContactFormDrawer`），保存后 bump 一个 tick 触发 `DataTable` 重取。

---

## 列表状态持久化设计框架

列表状态**按数据切片存储，每个存储各自是唯一权威**——不同数据放不同地方，因此没有"双写后对账"的复杂度。

| 数据 | 性质 | 存储（唯一权威） | 写入时机 |
|------|------|-----------------|---------|
| **列宽** | 设备相关（屏幕宽度不同）· 高频 | `localStorage`（`seacube:colw:<entity>:<user>:<org>`） | 拖拽结束**防抖 500ms** 写本地 |
| **恢复态** `active_view`/`active_view_key` + `state` 快照 | 个人 · 点击级低频 | 服务端 UiState | 选视图 / 应用临时筛选（**diff-guard**） |
| **默认视图 / 收藏** | 个人 · 跨设备 | 服务端 UiState | `ViewSelect` 的 set_default / favorite action |
| **视图定义** `criteria`/列/排序 | 命名(可共享)工件 | 服务端 SavedView | **显式**：更新视图 / 另存为 |

要点：
- **列宽天然属于本地**——不只是降频，更是语义正确（笔记本调的列宽不该同步到手机小屏）。它是唯一高频写源，放本地后服务端只剩点击级低频写。
- **localStorage 与服务端存的是不同数据**，谁也不覆盖谁，所以挂载时无需 reconcile。

### 页面状态三件套（职责分明）
- **`active: ActiveView`** — 当前选中的视图*身份*（系统 / 保存），驱动下拉显示。
- **`applied: Applied`** — 下发给 `DataTable` 的*物化筛选* `{match, criteria, columns, ordering, pageSize}`。临时筛选（Apply 未保存）后会与 active 的定义分歧。
- **`search`** — 搜索框，**瞬态 · 防抖 · 不持久化**（刷新即清）。

### Dirty 态（编辑共享工件的安全确认，对标 Zoho）
当 `active` 是**保存视图**且 `applied` 与其定义有差异（`filtersEqual` 比对）→ 显示 `<ViewDirtyBanner>`：
- **更新视图**（`canEditView` = owner 或 admin 才显示）/ **另存为视图** / **还原**。
- 列宽改动**不**触发 dirty banner（它是个人态、静默存本地，不是视图工件）——这正是 Zoho 用 banner 管列宽的唠叨，我们刻意避开。

### 生命周期
```
挂载（视图列表 loaded 后，一次性，restored ref 守卫）
  列宽 ← loadColumnWidths(localStorage)        （同步、无闪烁）
  GET /ui-state/?entity=  → 有恢复态？
   ├─ active_view 命中保存视图 → active=该视图, applied=fromSaved(view)
   ├─ active_view_key 命中系统视图 / 有 state 快照 → active=系统视图, applied={…系统基线, …state}
   └─ 无 → 回退：用户默认视图(is_default) → 否则系统"全部"
运行中：
  选视图 / 应用筛选 → setActive+setApplied + ui.save(...)（diff-guard，fire-and-forget）
  拖列宽            → useResizableColumns 防抖写 localStorage（不碰服务端）
  搜索 / 翻页 / 表头排序 → 不写持久化
```
- **恢复优先级**：保存的恢复态 > 用户默认视图 > 系统"全部"。
- **恢复语义差异**（刻意）：选保存视图恢复其*当前定义*（忽略临时改动）；系统视图之上的临时筛选作为 `state` 快照被恢复。

### 写入策略（控频，而非 write-behind）
- **diff-guard**：`useUiState.save` 记 `lastSaved`，payload 未变则跳过 POST（重复选同一视图、no-op apply 都不写）。**乐观置位 + 失败回滚**——失败时回滚 `lastSaved`，使下次相同状态仍可重试（调用方静默吞错）。
- **列宽防抖**：拖拽连续触发，仅在停手 500ms 后写一次 localStorage。
- 不需要 write-behind：移走列宽后服务端写全是点击级低频，diff-guard 足矣。
- `POST /ui-state/` 是 (user, org, entity) **幂等 upsert**，只写恢复态三字段，绝不碰 `default_view`/`favorites`（后者由 action 单独维护）。

### 触发矩阵（什么写、写哪）
| 动作 | 服务端 UiState | localStorage | 服务端 SavedView |
|------|:--:|:--:|:--:|
| 选系统/保存视图、应用临时筛选 | ✓(diff-guard) | — | — |
| set_default / 收藏 | ✓(action) | — | — |
| 更新视图 / 另存为 | （随后 reselect） | — | ✓ |
| 拖列宽 | — | ✓(防抖) | — |
| 搜索输入 / 表头排序 / 翻页 / 改每页条数 | — | — | — |

> 注：表头排序/翻页是 `DataTable` 内部态，目前不回写 `applied`，故不持久化（只有筛选面板里设置并 Apply 的排序才进 `applied`/恢复态）。

### 作用域与清理
服务端 UiState 按 (用户, 组织, 实体) 唯一；localStorage 列宽 key 含 user+org+entity。切换机构时内容区 `key={activeOrgId}` remount，恢复流程对新组织重跑——**无需手动清理**。

### 新模块接线（契约）
```ts
const ui = useUiState(ENTITY);
// 挂载：const saved = await ui.load();   // null → default/系统视图回退
// 变更：ui.save({ active_view, active_view_key, state: applied }).catch(() => {});
// DataTable 传 widthStorageKey={`${ENTITY}:${userId}:${orgId}`} 即获列宽持久化；
// dirty 用 filtersEqual/viewToFilter/canEditView + <ViewDirtyBanner>（均在 views/）。
```

---

## 新增一个模块（如 products）

1. **后端**：在该 app 的 `apps.py::ready()` 注册筛选字段（`preferences.registry.register`），并在其 ViewSet 上设 `saved_view_entity` + 挂 `SavedViewFilterBackend`（见 preferences README）。
2. **导航**：在 `layout/constants.ts` 的 `ITEM_ROUTES` 加路由；在 `layout/useMenuItems.ts` 加菜单项（按 `module_permissions` key 控权限）；有子页时补 `PAGE_TO_KEY`。
3. **页面**：新建 `app/(app)/(products)/`，含 `_layout.tsx`（Stack）+ `index.web.tsx`（`DataTable` + views）+ `[id].web.tsx`（详情）+ 对应 `.tsx` Native 占位。
4. **组件**：在 `components/modules/products/` 放该实体专属的列定义、表单 Drawer、详情子组件；列表/筛选/详情骨架直接复用 base 与 views 模块。

---

## 关键约定

- `getViewSet` 必须用 `useMemo` 包裹（防无限重渲染）。
- 列表数据走 `DataTable`（服务端分页/排序），**不要**用 antd `Table` 自带的客户端分页。
- 机构相关数据：`reloadKey` 含 `activeOrgId`，或依赖 Content 的 `key` remount。
- 文案走 i18n（`i18n.t(key, { defaultValue })`），新键补到 `locale/en.json` + `zh-Hans.json`。
