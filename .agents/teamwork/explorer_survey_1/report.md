# lipeaks_admin 底座升级与系统现状详尽调研报告

**调研执行者**：Survey Explorer 1  
**调研时间**：2026-10-16  
**调研对象**：`d:\Github\lipeaks_admin` 仓库与源码资产  
**基线状态**：pure-admin-thin 6.0.0 (Vue 3.5.13, Vite 6.3.3, TypeScript 5.8.3, Pinia 3.0.2)

---

## 1. Git 状态与历史提交勘查 (Git Baseline Check)

### 1.1 分支与 HEAD 指针
- **当前工作分支**：`1016`
- **上游对应分支**：`origin/1016`，与 `origin/0703` 指针保持一致
- **当前 HEAD Commit**：`6c9decd` (*Update detail.vue*)
- **最近提交历史日志**：
  ```text
  6c9decd (HEAD -> 1016, origin/1016, origin/0703) Update detail.vue
  8f563ba 123
  e2f94d1 123
  93f2b3b 123
  8c54120 123
  ```

### 1.2 工作区状态 (Working Tree Status)
- **源码状态**：`src/` 源码目录干净，**没有任何未暂存/未提交的代码修改**。
- **已暂存/未提交删除项 (Deleted)**：共 100+ 个已删除的旧版文档与临时 SQL/脚本文件（前序阶段已从工作区移除），主要分布在：
  - `docs/dashboard/` (旧版图表集成指南与 API 文档)
  - `docs/docker/` 与 `docs/docker_admin/` (旧部署脚本与文档)
  - `docs/menus/` (旧菜单设计文档)
  - `docs/temp1123_6_application/` (含旧测试脚本 `test_articles.py`、`cleanup_deleted_apps.sql` 等)
  - `docs/temp1123_8_feedback/` (旧反馈 API 文档)
  - `docs/temp1124_cms/` (旧 CMS API 文档与脚本)
  - `docs/temp1125_licenses/` (旧许可证 API 文档)
  - `docs/temp1126/` (旧反馈与通知指南)
  - `docs/tenants/` (旧租户文档)
  - `licenses_doc/` (旧许可证设计文档与 json)
- **未跟踪文件 (Untracked Files)**：
  - `.agents/` (多智能体协作元数据与任务文件，含 `ORIGINAL_REQUEST.md`)
  - `PROJECT.md` (项目规范体系定义)
  - `docs/` 下全套权威技术架构与业务文档（第一阶段已通过逆向源码构建完毕）：
    - `docs/README.md`
    - `docs/architecture.md`
    - `docs/routing-and-permissions.md`
    - `docs/state-management.md`
    - `docs/api-and-network.md`
    - `docs/engineering-and-deployment.md`
    - `docs/business-modules/*.md` (全部 17 个模块文档)

### 1.3 前置基线固化建议
在执行底座升级（R2~R4）前，必须执行一次基线 Commit 固化：
```bash
git add -A
git commit -m "chore(baseline): checkpoint baseline before vue-pure-admin v7 upgrade & docs generation"
```
确保刚生成的 `docs/` 文档、删除旧文档的状态及所有历史基线资产形成不可逆安全检查点。

---

## 2. 非代码历史临时文件与废弃脚本勘查 (Legacy & Temp Artifacts)

经过全库深度排查，系统内仍存留多处历史遗留、无引用或废弃的非代码资产：

| 资产路径 | 类型/规模 | 详细说明 | 建议处理方式 |
| :--- | :--- | :--- | :--- |
| `src/temp1006/` | 目录 (11 个 Markdown 文件，约 168 KB) | 存放旧版接口重构提议、会员 API 说明文档，非运行时源码 | **清理删除**（已在 `docs/business-modules/member.md` 完整覆盖） |
| `test_tag_group_integration.sh` | 根目录 Shell 脚本 (5.1 KB) | 历史标签组接口联调使用的 Bash 临时测试脚本 | **清理删除** |
| `dist.zip` | 根目录压缩包 (1.76 MB) | 历史生产构建产物压缩残留 | **清理删除** |
| `clear-route-cache.html` | 根目录 HTML (1.28 KB) | 临时手动清理 localStorage 路由缓存单页 | **可清理或归档** |
| `frontend/` | 根目录 (7 个 Markdown 文件，约 105 KB) | 早期 Django 错误响应格式与前端处理指南文档 | **清理删除**（已在 `docs/api-and-network.md` 完整覆盖） |
| `WARP.md` | 根目录 Markdown (4.9 KB) | 历史 AI 提示词与项目说明文件 | **归档或清理** |
| `src/components/ErrorHandling/README.md` | 源码组件文档 (2.4 KB) | 错误边界组件内部说明 | 可保留作为组件开发说明 |

### `src/temp1006/` 详细文件清单：
1. `API_REFACTOR_COMPLETED.md`
2. `API_RESTRUCTURE_PROPOSAL.md`
3. `FRONTEND_MIGRATION_GUIDE.md`
4. `INDEX.md`
5. `README.md`
6. `URL_PATH_CORRECTION.md`
7. `member_avatar_api.md`
8. `member_common.md`
9. `member_detail_api.md`
10. `member_list_create_api.md`
11. `member_subaccount_api.md`

---

## 3. 17 个核心业务模块在 Views、Components 及路由中的全景分布

系统共包含 17 个核心业务模块，各模块的页面级视图位于 `src/views/`（共 99 个源文件），业务配套组件位于 `src/components/`。

### 3.1 业务模块全景矩阵表

| 序号 | 业务模块标识 | Views 目录及文件数 | 配套 Components 目录及文件数 | 路由加载机制 | 业务职责简述 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `admin-user` | `src/views/admin-user/` (6 个 Vue) | `src/components/AdminUserManagement/` (8 个文件) | 动态异步路由 (`/menus/admin/routes/`) | 系统管理员、超级管理员创建/编辑/详情及个人中心 |
| 2 | `application` | `src/views/application/` (4 个 Vue) | `src/components/Application/` (3 个文件) | 动态异步路由 | 应用系统接入、配置维护、应用列表与状态流转 |
| 3 | `check-system` | `src/views/check-system/` (9 个 Vue) | 无专属目录（组件内聚） | 动态异步路由 | 任务分类、任务模板、检查周期、任务执行与审计记录 |
| 4 | `cms` | `src/views/cms/` (17 个 Vue) | `src/components/Cms/` (13 个文件，含 Article/Category/Comment/Tag) | 动态异步路由 + 3个静态剩余路由 | 内容发布、富文本、草稿箱、分类层级、标签云、评论管理 |
| 5 | `customer` | `src/views/customer/` (4 个 Vue) | `src/components/CustomerManagement/` (9 个文件) | 动态异步路由 | 客户档案管理、客群分组、多维度查询与联系人记录 |
| 6 | `dashboard` | `src/views/dashboard/` (1 个 Vue) | `src/components/Dashboard/` (13 个文件，含各类 Charts) | 动态异步路由 | 运营与指标分析仪表盘，多维度折线图、饼图与热力图 |
| 7 | `error` | `src/views/error/` (3 个 Vue) | `src/components/ErrorHandling/` (8 个文件) | 静态路由 (`src/router/modules/error.ts`) | 403 (无权限)、404 (未找到)、500 (服务器内部错误) |
| 8 | `feedback` | `src/views/feedback/` (15 个 Vue) | 无专属目录（内聚于各子目录） | 动态异步路由 | 用户反馈流转、软件产品/版本管理、邮件日志与健康监控 |
| 9 | `license` | `src/views/license/` (15 个 Vue) | `src/components/License/` (12 个文件) | 动态异步路由 | 软件许可方案、授权码发放、激活设备绑定、审计日志 |
| 10 | `login` | `src/views/login/` (1 Vue + 3 TS) | 无（基础登录） | 静态剩余路由 (`src/router/modules/remaining.ts`) | 用户登录入口、图片/滑块验证、双 Token 写入与重定向 |
| 11 | `member` | `src/views/member/` (4 个 Vue) | `src/components/MemberManagement/` (6 个文件) | 动态异步路由 | 会员核心信息、积分账户、子账号管理、头像维护 |
| 12 | `menu` | `src/views/menu/` (1 个 Vue) | `src/components/MenuManagement/` (3 个文件) | 动态异步路由 | 动态菜单配置、路由树编辑、操作权限码（perms）挂载 |
| 13 | `notification`| `src/views/notification/` (3 个 Vue) | 无专属目录（视图内聚） | 动态异步路由 | 消息与站内通知列表、可视化富文本编辑器、详情预览 |
| 14 | `order` | `src/views/order/` (5 个 Vue) | `src/components/OrderManagement/` (15 个文件，含 Charts) | 动态异步路由 | 订单交易列表、状态变更跟踪、退款与订单统计报表 |
| 15 | `permission` | `src/views/permission/` (3 个 Vue) | 无（依赖基础 RePerms） | 动态异步路由 (`mock/asyncRoutes.ts`) | 页面级权限（Roles）演示、按钮级权限（Auths/Perms）控制 |
| 16 | `tenant` | `src/views/tenant/` (4 个 Vue) | `src/components/TenantManagement/` (4 个文件) | 动态异步路由 | 多租户管理体系、租户配额控制、租户管理员管理 |
| 17 | `welcome` | `src/views/welcome/` (1 个 Vue) | 无 | 静态主页路由 (`src/router/modules/home.ts`) | 系统引导页、首屏欢迎页（重定向自 `/`） |

### 3.2 路由架构深度勘查 (Routing Architecture)
1. **静态路由层 (Static Routes)**：
   - `src/router/modules/home.ts`：根路径 `/` 重定向至 `/welcome`，加载 `src/views/welcome/index.vue`。
   - `src/router/modules/error.ts`：异常路径 `/error/403`, `/error/404`, `/error/500`。
   - `src/router/modules/remaining.ts`：未包含在侧边菜单中的路由：
     - `/login` (`src/views/login/index.vue`)
     - `/redirect/:path(.*)` (页面重载刷新中转)
     - `/preview/article/:id` (`src/views/cms/article/detail.vue`)
     - `/cms/article/import` (`src/views/cms/article/import.vue`)
     - `/cms/article/export` (`src/views/cms/article/export.vue`)
2. **动态路由机制 (Dynamic Routes & Glob Import)**：
   - 依赖 Vite 的 Glob 特性：`const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}");`
   - 挂载入口：`src/router/index.ts` 中的 `router.beforeEach` 守卫拦截未加载菜单请求，触发 `initRouter()`。
   - 契约调用：通过 `getAsyncRoutes()`（`src/api/routes.ts`，实际请求后端 DRF 端点 `/menus/admin/routes/`）。
   - 组件反解：`addAsyncRoutes()` 将后端返回的 `v.component` 字符串进行精确查找匹配，自动赋予异步组件函数并将路由展平（`formatFlatteningRoutes`）后调用 `router.addRoute(v)` 挂载到根路由 children 下。

---

## 4. Pinia 状态管理架构与业务依赖特征 (Pinia & Composables)

系统采用了 **Pinia 全局 Store + Vue 3 Composables 组合式函数** 的现代前端状态管理架构。

### 4.1 Pinia Store 模块分布 (`src/store/modules/`)
共包含 16 个定义文件（15 个 TypeScript 模块 + 1 个类型声明文件）：

#### A. 基础与框架层 Store (6 个)
1. **`app.ts`** (2.6 KB)：应用全局 UI 配置、左侧菜单折叠展开（`sidebar.opened`）、桌面/移动端设备适配。
2. **`epTheme.ts`** (1.3 KB)：Element Plus 主题换肤系统、动态主题色持久化。
3. **`multiTags.ts`** (4.8 KB)：历史标签页（Tabs View）缓存队列管理、固定标签、多标签清空与路由联动。
4. **`permission.ts`** (3.2 KB)：存储当前用户过滤后的完整菜单树（`wholeMenus`）、缓存路由页面集合（`cachePage`）。
5. **`settings.ts`** (0.8 KB)：系统外观配置（暗黑模式、灰色模式、弱色模式、隐藏头部等）。
6. **`user.ts`** (11.7 KB)：用户鉴权中枢，处理 `loginByUsername`、`logOut`、用户 Token 存取、用户个人信息持久化。

#### B. 业务专属 Store (9 个)
1. **`adminUser.ts`** (16.5 KB)：系统管理员增删改查、批量禁用/启用、重置密码。
2. **`application.ts`** (9.7 KB)：应用接入清单、接入凭证秘钥配置、应用详情。
3. **`cms.ts`** (47.5 KB，重度复合业务 Store)：文章管理全流程（新增/编辑/版本回退）、分类树、标签池、评论审查、缩略图生成与文件上传。
4. **`customer.ts` & `customer.d.ts`** (40.9 KB)：客户画像档案、客群细分、多条件高级搜索。
5. **`license.ts`** (23.9 KB)：授权许可管理、许可方案 CRUD、设备指纹绑定、机器激活记录审计。
6. **`member.ts`** (21.7 KB)：会员核心主档、子账号关系树、会员积分与等级配置。
7. **`menu.ts`** (17.5 KB)：动态菜单树节点管理、菜单排序、页面与按钮级权限码维护。
8. **`order.ts`** (24.3 KB)：订单流转交易记录、支付/履约状态变更、退款审计、订单报表统计。
9. **`tenant.ts`** (11.5 KB)：多租户组织架构、多租户配额分配、租户超管账号初始化。

### 4.2 Composables 业务状态层 (`src/composables/`)
对于不需要全局跨模块共享状态的业务，采用 Vue 3 组合式函数进行轻量且高内聚的状态管理：
- **`useCheckSystem.ts`** (27.1 KB)：承载 `check-system` 模块的全部状态（任务、执行周期、分类与模板、审计流水）。
- **`useFeedback.ts`** (15.1 KB)：承载 `feedback` 用户反馈业务的核心响应式状态与流转。
- **`useFeedbackNotification.ts`** (12.5 KB)：承载反馈邮件/消息通知配置状态。
- **`useNotification.ts`** (15.4 KB)：承载 `notification` 模块列表与富文本编辑状态。
- **`useSoftware.ts`** (6.1 KB)：承载软件产品与版本的状态流转。
- **`useApplication.ts`** (6.4 KB)：辅助 `application` 模块的表单与上下文操作。
- **`useErrorHandling.ts`** (7.8 KB)：全局 DRF 错误格式反解与弹窗提示 Composable。

### 4.3 状态依赖与耦合性评估
- **水平解耦度极高**：业务 Store 之间（如 `adminUser`、`cms`、`license` 等）**彼此无任何横向引用**。
- **垂直依赖规范**：业务 Store 仅向下依赖自己的 API 模块（`@/api/modules/...`）以及基础设施（`@/utils/logger`、`ElMessage`）。
- **框架联动简单明确**：
  - `user.ts` 在退出登录时调用 `multiTags.ts` 清理标签；
  - `multiTags.ts` 与 `permission.ts` 保持 Hook 交互，用于刷新和清理缓存页面。
- **升级适配结论**：业务状态体系具备天然的高隔离性，在升级至 Vue Pure Admin v7 规范时，Pinia 升级迁移风险极低。

---

## 5. UI 组件库、图标库与工具函数的关键依赖特征

### 5.1 UI 组件库依赖特征
1. **Element Plus 为核心基石 (`element-plus`: ^2.9.8)**：
   - 17 个模块中 100% 依赖 Element Plus 核心组件。
   - 使用频率最高的组件：`el-button`, `el-card`, `el-form`, `el-form-item`, `el-input`, `el-select`, `el-table`, `el-table-column`, `el-pagination`, `el-dialog`, `el-descriptions`, `el-tag`。
2. **纯表格与业务表格共存**：
   - 项目安装了 `@pureadmin/table` (^3.2.1) 与 `@pureadmin/descriptions` (^1.2.1)。
   - 在实际业务页面中，大量复杂的业务页面（如 `check-system`, `customer`, `feedback`, `order`）直接使用了原生 `<el-table>` 模板，搭配 `src/components/RePureTableBar` 工具栏；部分模块（如 `admin-user`, `member`, `license`）通过 `src/components/` 中的封装组件提供列表与弹窗。
3. **图表与可视化**：
   - `echarts` (^5.6.0)：在 `dashboard`, `order`, `license`, `feedback` 等多个模块中有深度应用（仪表盘折线图、柱状图、饼图）。
4. **特殊业务组件**：
   - `diff` (^8.0.2)：在 `cms/article/version.vue` 中用于文章版本对比。
   - `file-saver` (^2.0.5) & `jszip` (^3.10.1)：用于订单、文章和日志的客户端导出与打包下载。

### 5.2 图标库依赖特征
项目存在 3 种图标使用范式：
1. **Element Plus 原生图标 (`@element-plus/icons-vue`: ^2.3.2)**：
   - 在各业务模块的页面模板和按钮操作中占据主导地位（如 `Search`, `Plus`, `Edit`, `Delete`, `Refresh`, `Download` 等）。
2. **Iconify 图标规范 (`@iconify/vue`, `@iconify/json`, `unplugin-icons`)**：
   - 在菜单系统、动态路由配置与特定页面中广泛使用（如 `ep:home-filled`, `ep:lollipop`, `ri:user-3-fill`, `ri:lock-fill`）。
   - 通过 PureAdmin 封装组件 `<ReIcon>` 与工具函数 `useRenderIcon` 进行渲染。
3. **本地静态图标**：
   - `src/assets/svg/` (配合 `vite-svg-loader`) 与 `src/assets/iconfont/`。

### 5.3 工具函数依赖特征
1. **`@pureadmin/utils`** (^2.6.0)：
   - 核心辅助工具，深度渗透在路由管理与状态管理中（`buildHierarchyTree`, `formatFlatteningRoutes`, `storageLocal`, `cloneDeep`, `isAllEmpty`, `isUrl`, `intersection` 等）。
2. **日期处理**：
   - 统一采用 **`dayjs`** (^1.11.13)，无旧版 moment.js 遗留。
3. **国际化**：
   - 采用 `vue-i18n` (^11.1.3)，业务中主要通过 `@/plugins/i18n` 导出的 `$t` 与 `transformI18n` 进行中英文切换。
4. **网络请求通信契约**：
   - 基于 `axios` (^1.9.0) 构建的高可用 DRF 适配器（`src/utils/http/index.ts`）：
     - **TokenManager**：支持 Access/Refresh 双 Token、过期前 5 分钟主动静默刷新、401 并发互斥队列重放；
     - **DRF 异常反解**：对 Django REST Framework 的 `non_field_errors`、字段级验证错误列表进行序列化语义反解；
     - **CSRF 自动注入**：从 Cookie (`csrftoken`) 提取并自动挂载 `X-CSRFTOKEN` 请求头。

---

## 6. 总结与底座重构指导建议 (Recommendations for Base Upgrade)

1. **第 1 步：基线固化**
   - 立即执行 `git add -A && git commit`，将历史删除项及本次新建的完整规范文档固化为升级前基线点。
2. **第 2 步：非代码历史临时文件清理**
   - 物理清理 `src/temp1006/`、`test_tag_group_integration.sh`、`dist.zip`、`clear-route-cache.html`、`frontend/`。
3. **第 3 步：底座同步与升级**
   - 引入官方最新 `vue-pure-admin` 完整版 v7.0.0 作为新基底；
   - 升级构建工具链（Vite 8、Rolldown、TypeScript 6、Vue 3.5、Tailwind CSS v4）；
   - 将官方 Demo 视图及路由完整收纳进独立菜单“示例/开发参考”。
4. **第 4 步：17 个业务模块与 Store 注入**
   - 将 `src/views/`（99 个文件）、`src/components/`（业务专属组件）完整平移；
   - 注入 9 个业务 Pinia Store 与 7 个 Composables，无缝适配新版 Pinia；
   - 适配 Vue Router 守卫中将 `next()` 替换为返回值的全新语法。
5. **第 5 步：保全 DRF 高可用网络层**
   - 严格平移 TokenManager 预警刷新、401 互斥重放、DRF 错误责任链与 CSRF 拦截逻辑至新基座的 `PureHttp` 中，确保接口通信 100% 契约保全。
