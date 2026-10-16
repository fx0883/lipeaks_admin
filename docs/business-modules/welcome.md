# 引导页与首屏重定向模块 (Welcome & Landing)

## 1. 模块业务职责与核心能力

引导页与欢迎模块（Welcome）是系统静态路由与首屏落地重定向的基础骨架组件。其核心业务能力涵盖：

1. **系统默认落地页 (Default Landing Page)**：
   - 作为整个后台管理系统的基底路由入口，在用户成功登录或直接访问根路径 `/` 时，由静态路由配置自动触发 `redirect: "/welcome"`，将视口引导至欢迎页；
   - 处于全局多标签页（Multi-Tags）导航队列的首位，作为系统常驻与固定标签基准。
2. **环境变量级首页隐匿策略 (`VITE_HIDE_HOME`)**：
   - 支持通过环境配置文件（如 `.env.development`、`.env.production`）中的环境变量 `VITE_HIDE_HOME` 动态决定是否向终端用户暴露首页；
   - 包含菜单级隐匿与守卫级强拦截两道防御：
     - **侧边栏隐匿**：当 `VITE_HIDE_HOME === "true"` 时，路由元数据中的 `showLink` 自动置为 `false`，从左侧导航菜单中隐去“首页”标签；
     - **地址栏直接访问强拦截**：全局路由守卫（`src/router/index.ts`）在检测到开启隐藏首页后，若用户尝试通过浏览器地址栏直接输入 `/welcome` 强刷，守卫将主动将其强行重定向至 `/error/404` 页面。
3. **极简轻量化加载契约**：
   - 组件采用零外部异步接口依赖的轻量化设计，秒级渲染，杜绝首页由于大量网络慢接口堵塞首屏呈现；
   - 为后续运营活动、系统公告看板、业务快捷导航或个性化仪表盘留出可插拔插槽扩展空间。

---

## 2. 源码结构与组件分工

```
src/
├── views/welcome/
│   └── index.vue                       # 欢迎页 SFC 视图（极简落地占位组件）
├── router/
│   ├── modules/
│   │   └── home.ts                     # 静态路由根模块（定义 / 到 /welcome 重定向与元数据）
│   └── index.ts                        # 全局前置守卫（VITE_HIDE_HOME 拦截强跳 404）
└── layout/
    └── index.vue                       # 顶层布局框架（Header, Sidebar, AppMain 容器）
```

### 真实 SFC 源码事实 (`src/views/welcome/index.vue`)

```vue
<script setup lang="ts">
defineOptions({
  name: "Welcome"
});
</script>

<template>
  <h1>Lipeaks_admin</h1>
</template>
```

---

## 3. 路由与前置守卫

### 1) 静态路由配置事实 (`src/router/modules/home.ts`)

```ts
import { $t } from "@/plugins/i18n";
const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/welcome",
  meta: {
    icon: "ep/home-filled",
    title: $t("menus.pureHome"),
    rank: 0
  },
  children: [
    {
      path: "/welcome",
      name: "Welcome",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        title: $t("menus.pureHome"),
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    }
  ]
} satisfies RouteConfigsTable;
```

### 2) 全局前置守卫拦截逻辑 (`src/router/index.ts`)

在用户已通过登录鉴权（存在 `multipleTabsKey` Cookie 与 `userInfo`）的导航流程中，守卫执行如下拦截：

```ts
// 开启隐藏首页后在浏览器地址栏手动输入首页welcome路由则跳转到404页面
if (VITE_HIDE_HOME === "true" && to.fullPath === "/welcome") {
  next({ path: "/error/404" });
}
```

---

## 4. API 通信契约

欢迎页（Welcome）作为无网络副作用的纯静态落地视图，**不发起任何后台业务 API 请求**。其运行依赖纯客户端渲染，避免了首屏白屏时间（FCP）受制于后端服务可用性。

---

## 5. 状态管理与数据模型

### 依赖的全局 Store

- **MultiTagsStore (`src/store/modules/multiTags.ts`)**：
  - 首页路由通常作为不可关闭的常驻固定标签页（Affix Tag）保存在 `multiTags` 列表的首项，供多标签页栏常驻展示；
- **PermissionStore (`src/store/modules/permission.ts`)**：
  - 在静态路由阶段，`home.ts` 生成的路由配置被合并入 `constantMenus`，并在计算整个左侧菜单（`wholeMenus`）时根据 `showLink` 属性决定是否呈现。

### 核心环境变量模型

| 变量键名 | 变量类型 | 示例取值 | 业务效用 |
|---|---|---|---|
| `VITE_HIDE_HOME` | `string` | `"true"` / `"false"` | 控制是否在左侧菜单隐藏首页项，并在地址栏直接访问时阻断跳转 404 |

---

## 6. 关键业务流程与时序

### 首屏重定向与隐藏策略导航流转图

```mermaid
flowchart TD
    UserReq[浏览器发起导航: 访问根路径 / 或 /welcome] --> GuardCheck{全局守卫拦截链 router.beforeEach}
    
    GuardCheck --> CheckAuth{已登录且有效?}
    CheckAuth -- 否 --> ToLogin[重定向至 /login]
    CheckAuth -- 是 --> CheckTarget{访问路径目标}
    
    CheckTarget -- 访问 / --> ExecRedirect[匹配 redirect: '/welcome']
    ExecRedirect --> CheckEnv
    
    CheckTarget -- 访问 /welcome --> CheckEnv{环境变量判断: VITE_HIDE_HOME === 'true'?}
    
    CheckEnv -- 是 (开启隐藏首页) --> Intercept404[next({ path: '/error/404' })<br/>终止访问，呈现 404 页面]
    CheckEnv -- 否 (正常公开首页) --> AllowAccess[next() 放行]
    
    AllowAccess --> RenderLayout[渲染 Layout 骨架]
    RenderLayout --> MountWelcome[挂载 views/welcome/index.vue]
    MountWelcome --> AddAffixTag[MultiTags 栏压入常驻首页标签]
```

---

## 7. 权限控制与按钮级鉴权

### 权限与准入设计

- **通用准入性**：欢迎页本身未配置 `meta.roles` 角色限制，属于全系统已登录用户（所有管理员、租户账号、普通成员）均可到达的公共落地页；
- **无按钮级权限控制**：视图内仅包含基础占位与标题渲染，无 `v-perms` 或 `v-auth` 按钮控制逻辑；
- **防越权机制**：通过环境变量 `VITE_HIDE_HOME` 统一从系统构建层面收归入口。在面向特定定制化纯业务系统（如只看订单大屏或单一客户工单的受限平台）时，开启隐匿即可直接让系统默认落地至业务模块。
