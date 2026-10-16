# Project: lipeaks_admin 官方最新 vue-pure-admin 完整版升级与架构重构

## Architecture
- **前端底座架构**：基于官方最新 `vue-pure-admin` 完整版 v7.0.0，构建工具链采用 Vite 8.3.4 + Rolldown/Oxc，语言层采用 TypeScript 6.0.3，核心框架为 Vue 3.5.43 + Vue Router 5.4.0（导航守卫 return 规范）+ Pinia 4.0.3 + Tailwind CSS v4。
- **业务视图与状态**：全量保留 17 个核心业务模块（`admin-user`, `application`, `check-system`, `cms`, `customer`, `dashboard`, `feedback`, `license`, `login`, `member`, `menu`, `notification`, `order`, `permission`, `tenant`, `welcome`, `error`）及其配套业务组件、9 个业务 Pinia Store 与 7 个业务 Composables。
- **官方示例/开发参考收拢**：官方自带的 26 个高阶公共组件及 26 个功能演示页面全量保留，路由全部收拢至专属目录 `src/router/reference/`，由单一模块入口 `src/router/modules/reference.ts`（`rank: 999`）挂载为一级折叠菜单“示例/开发参考”，与 17 个核心业务实现完全解耦和隔离。
- **高可用 DRF 网络底座**：坚守企业级 DRF 通信契约，整包平移保留双 Token 机制（TokenManager 预警静默刷新、401 并发互斥队列）、DRF 异常反解责任链（Django 字段列表/字典/detail 序列化反解及单引号正则修复）、CSRF 头（`X-CSRFTOKEN`）自动提取注入。
- **运维与部署契约**：严格保持暴露端口 8848，保留 Dockerfile 多阶段构建、Nginx 三路反向代理（`/api/`, `/backend-static/`, `/media/` -> `http://web:8000`）及全套环境配置（`.env.*`）。

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Git 基线提交固化 | 将工作区未暂存/未提交的逆向文档与删除变更固化为升级前基线 commit | M1 | Survey 1 & ORIGINAL_REQUEST |
| 2 | 临时冗余文件清理 | 安全清理 `src/temp1006/`、根目录 `test_tag_group_integration.sh`、`dist.zip`、`clear-route-cache.html`、`frontend/` | M1 | Survey 1 & ORIGINAL_REQUEST |
| 3 | 官方最新 v7.0.0 工具链升级 | 同步官方 Vite 8 + Rolldown + TS 6 + Vue 3.5 + Tailwind CSS v4 构建配置与 package.json 依赖体系 | M2 | Survey 2 & ORIGINAL_REQUEST |
| 4 | 官方组件与 Demo 页面同步 | 引入官方 26 个高阶组件与 26 个演示视图，保留官方完整版功能体验 | M2 | Survey 2 & ORIGINAL_REQUEST |
| 5 | Demo 路由收拢为“示例/开发参考” | 将官方 23 个 Demo 路由收拢到 `src/router/reference/`，通过 `src/router/modules/reference.ts` 呈现为 rank: 999 的二级折叠菜单 | M2 | Survey 2 & ORIGINAL_REQUEST |
| 6 | Vue Router 守卫规范调整 | 将路由导航守卫 `router.beforeEach` 全面重构为官方标准的 `return` 语法 | M2 | Survey 2 & ORIGINAL_REQUEST |
| 7 | DRF TokenManager 机制平移 | 移植双 Token 本地存储、过期前 5 分钟主动预警静默刷新心跳与 401 并发互斥重发等待队列 | M3 | Survey 3 & ORIGINAL_REQUEST |
| 8 | DRF 异常反解责任链移植 | 移植 `formatErrorMessage`、Python 字典正则反解及 6 级错误分类责任链，确保 Django 错误精准提示 | M3 | Survey 3 & ORIGINAL_REQUEST |
| 9 | CSRF 请求头自动提取与注入 | 维持从 Cookie 自动提取 `csrftoken` 并在拦截器注入 `X-CSRFTOKEN` 头机制 | M3 | Survey 3 & ORIGINAL_REQUEST |
| 10 | 环境与运维部署契约保全 | 保留 `.env.*` 全套环境配置、Dockerfile (8848端口)、nginx/default.conf 三路反代及 docker-compose 契约 | M3 | Survey 3 & ORIGINAL_REQUEST |
| 11 | 17 个核心业务模块全量注入 | 迁移注入 17 个业务视图模块（99个文件）及对应业务专属组件，无缝对接动态路由加载 | M4 | Survey 1 & ORIGINAL_REQUEST |
| 12 | 业务 Pinia Store 与 Composables 适配 | 迁移 9 个业务 Pinia Store 模块与 7 个业务 Composables，适配最新 Pinia 4.x / TS 6 类型声明 | M4 | Survey 1 & ORIGINAL_REQUEST |
| 13 | 全量编译与类型检查验收 (Typecheck & Build) | 确保 `pnpm install` 成功解析、`pnpm typecheck` 0 报错、`pnpm build` 0 错误产出生产资产 | M5 | ORIGINAL_REQUEST |
| 14 | 运行时集成与端到端体验验证 (Runtime E2E) | 验证 `pnpm dev` 正常启动，登录页正常挂载，17 个业务路由正常访问，Demo 菜单独立可用，DRF 网络契约完好 | M5 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Git 基线固化与前置清理 | Git 提交基线 checkpoint，清理 `src/temp1006/` 等临时文件 | none | IN_PROGRESS |
| M2 | 官方底座同步与 Demo 路由收拢 | 同步 v7.0.0 依赖、Vite 8/Rolldown/TS 6 构建链，收拢 Demo 菜单至“示例/开发参考” | M1 | PLANNED |
| M3 | DRF 网络底座平移与部署契约保全 | 平移注入 TokenManager、异常责任链、CSRF 头及运维部署配置，适配 TS 6 类型 | M2 | PLANNED |
| M4 | 17 业务模块与 Pinia 状态层全量注入 | 迁移 17 个业务 views、配套 components、9 个 Pinia Stores 与 7 个 Composables | M3 | PLANNED |
| M5 | 全量构建闭环与运行时验证 (Final Milestone) | 验证 `pnpm install`、`pnpm typecheck`、`pnpm build` 及运行时 17 个路由与 Demo 菜单 | M4 | PLANNED |

## Interface Contracts
### 网络层接口契约 (DRF Network Contract)
- **Token 存储契约**：`localStorage.getItem('access_token')` 与 `localStorage.getItem('refresh_token')`，过期检测阈值 300 秒。
- **401 并发等待队列**：`tokenManager.waitForTokenRefresh()` 返回 Promise 挂起并发请求，主刷新请求成功后遍历队列逐个重发。
- **CSRF 提取注入**：从 Cookie 正则提取 `csrftoken`，并在请求头挂载 `config.headers["X-CSRFTOKEN"] = csrfToken`。
- **错误反解**：捕获 DRF 标准 `ErrorDetail`、`non_field_errors`、字段字典错误及 Python 单引号字典序列化字符串，输出格式化多字段错误信息。
- **环境变量**：`VITE_PORT = 8848`，`VITE_BASE_API` 分环境映射（本地 8000、线上 8000 反向代理）。

### 路由与菜单契约 (Router & Menu Contract)
- **业务动态路由**：后端通过 `/menus/admin/routes/` 返回动态路由表，由 `src/router/utils.ts` 结合 `import.meta.glob("/src/views/**/*.{vue,tsx}")` 进行异步加载与权限挂载。
- **官方示例/开发参考菜单**：`src/router/modules/reference.ts`（`path: "/reference"`, `rank: 999`），内部子路由由 `src/router/reference/*.ts` 扁平化映射构建，标题统一为“示例/开发参考”。
- **导航守卫规范**：`router.beforeEach` 全面遵从 `return true`、`return false` 或 `return { path: "/login", query: ... }` 语法，严禁调用已废弃的 `next()`。

## Code Layout
- `src/views/`：包含 17 个核心业务视图目录（99个文件）与官方示例视图目录。
- `src/components/`：包含 26 个官方通用组件与业务专属组件目录（如 `AdminUserManagement`, `Cms`, `CustomerManagement`, `OrderManagement` 等）。
- `src/router/`：
  - `src/router/modules/`：静态核心路由（`home.ts`, `remaining.ts`, `error.ts`）及 Demo 唯一入口 `reference.ts`。
  - `src/router/reference/`：官方 23 个 Demo 路由定义文件。
  - `src/router/utils.ts`：路由工具函数、导航守卫与动态路由构建。
- `src/store/modules/`：
  - 框架 Store：`app.ts`, `epTheme.ts`, `multiTags.ts`, `permission.ts`, `settings.ts`, `user.ts`。
  - 业务 Store：`adminUser.ts`, `application.ts`, `cms.ts`, `customer.ts`, `license.ts`, `member.ts`, `menu.ts`, `order.ts`, `tenant.ts`。
- `src/composables/`：业务专用 Composables（`useCheckSystem.ts`, `useFeedback.ts`, `useNotification.ts` 等）。
- `src/utils/http/`：高可用 DRF 网络通信底座（`tokenManager.ts`, `errorHandlers.ts`, `errorCodes.ts`, `retryManager.ts`, `index.ts`, `types.d.ts`）。
- `public/platform-config.json`：全局平台配置（使用 `TagsStyle`）。
- `Dockerfile` & `nginx/default.conf`：端口 8848 及三路反代契约。
