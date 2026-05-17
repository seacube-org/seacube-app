# seacube-app

SeaCube ERP 前端，基于 React Native + Expo，支持 iOS、Android 和 Web 三端。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React Native 0.81 + Expo 54 |
| 路由 | Expo Router (file-based) |
| 样式 | NativeWind 4 + Tailwind CSS 4 |
| Web UI | Ant Design 6 |
| 状态管理 | Zustand 5 |
| 国际化 | i18n-js |
| 安全存储 | expo-secure-store |
| 语言 | TypeScript 5.9 |

---

## 快速开始

```bash
npm install

# 启动开发服务器（选择平台）
npm run web        # Web
npm run ios        # iOS Simulator
npm run android    # Android Emulator
npm start          # 交互式选择
```

---

## 目录结构

```
seacube-app/
├── app/                        # Expo Router 页面（文件即路由）
│   ├── _layout.tsx             # 根布局
│   ├── (auth)/                 # 未登录路由组
│   │   └── login.tsx
│   └── (app)/                  # 已登录路由组
│       ├── index.tsx           # 首页 / 仪表盘
│       ├── (sales)/            # 销售模块
│       ├── (purchases)/        # 采购模块
│       ├── (inventory)/        # 库存模块
│       ├── (production)/       # 生产模块
│       ├── (logistics)/        # 物流模块
│       ├── (contacts)/         # 联系人模块
│       └── (settings)/         # 设置模块
│
├── components/
│   ├── ui/                     # 基础 Design System 组件
│   └── modules/                # 业务模块组件
│       ├── comments/           # 单据评论 + 历史时间轴
│       └── document-template/  # PDF 模板选择与预览
│
├── services/
│   └── DataService.ts          # API 客户端（CRUD + JWT 刷新）
│
├── stores/
│   ├── authStore.ts            # 登录状态（Zustand）
│   └── localeStore.ts          # 语言切换（Zustand）
│
├── hooks/                      # 自定义 React Hooks
├── constants/                  # API URL、枚举等常量
├── locale/                     # i18n 翻译文件
├── utils/                      # 工具函数（logger、form 等）
└── tailwind.config.js          # Design Token
```

---

## Design Token

设计风格参考 Zoho Books，定义在 `tailwind.config.js`：

```js
colors: {
  primary:    '#1A73E8',   // 主色调
  surface:    '#FFFFFF',   // 卡片背景
  background: '#F4F5F7',   // 页面背景
  border:     '#E5E7EB',
  status: {
    draft:   '#F3F4F6',   // 草稿
    open:    '#DBEAFE',   // 待处理
    paid:    '#D1FAE5',   // 已完成
    overdue: '#FEE2E2',   // 逾期
    voided:  '#F3F4F6',   // 已作废
  }
}
```

---

## 平台差异

文件以 `.web.tsx` 结尾的为 Web 专属实现，无此后缀的为 Native（iOS/Android）实现：

```
component.tsx       ← iOS / Android
component.web.tsx   ← Web（antd 组件）
```

Web 端使用 Ant Design 组件（Table、Modal、Form 等）；Native 端使用 React Native 原生组件 + NativeWind 样式。

---

## API 对接

后端为 `seacube-server`（Django REST Framework），所有请求通过 `DataService` 发送：

```ts
const viewSet = getViewSet('invoices')  // 需用 useMemo 包裹
await viewSet.list({ params: { status: 'SENT' } })
await viewSet.retrieve({ id: 42 })
await viewSet.create({ body: { ... } })
await viewSet.update({ id: 42, body: { ... } })
await viewSet.delete({ id: 42 })
```

认证使用 JWT，Token 存储于 `expo-secure-store`（Native）/ `localStorage`（Web），过期自动刷新。

---

## 代码规范

```bash
npm run lint   # ESLint 检查
npm run test   # Jest 单元测试
```

**关键约定：**
- `getViewSet` 必须用 `useMemo` 包裹，避免无限重渲染
- 日志用 `devLog()` / `devError()`，不直接用 `console.*`
- 路径别名 `@/` 指向项目根目录
