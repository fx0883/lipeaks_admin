# Original User Request

## Initial Request — 2026-10-16T08:04:41Z

基于对 `lipeaks_admin` 代码库的全面静态分析（严格排除可能已过时的现有文档与历史说明），从专业软件工程视角出发，逆向分析源码并生成成体系的工程级技术文档，统一输出至 `docs/` 目录。

Working directory: d:\Github\lipeaks_admin
Integrity mode: development

## Requirements

### R1. 纯源码事实逆向约束 (Code Ground-Truth)
- 严禁参考项目内现存的任何旧版文档、已废弃的 README 或陈旧外部说明，严格以实际 TypeScript、Vue 3、Pinia、Vite 及相关配置文件中的真实代码实现为唯一事实来源（Single Source of Truth）。
- 深入分析 `src/` 各关键分层实现（`api/`, `router/`, `store/`, `views/`, `composables/`, `utils/`, `layout/`, `plugins/`, `directives/` 等）。

### R2. 软件工程核心规范与架构文档 (System Architecture & Engineering Specs)
在 `docs/` 目录下生成结构完备的 Markdown 规范体系，必须包含以下独立文档：
1. **主索引导航** (`docs/README.md`)：项目工程定位、技术栈矩阵、文档目录索引与推荐阅读路径。
2. **系统总架构与工程规范** (`docs/architecture.md`)：系统分层架构（视图层/状态层/网络层/底层工具）、整体目录组织规范、Vite 与 TypeScript 构建打包配置及开发规范。
3. **路由系统与权限控制** (`docs/routing-and-permissions.md`)：基于 Vue Router 的静态/动态路由生成机制、路由守卫拦截链、白名单机制、基于角色/权限码（RBAC）与按钮级指令（`v-perms` 等）的鉴权控制实现。
4. **全局状态管理与数据流** (`docs/state-management.md`)：Pinia Store 的模块划分（如 user, permission, app, settings 等）、响应式状态流转、持久化存储（localStorage/cookies）与缓存失效/清理机制。
5. **网络层与 API 通信契约** (`docs/api-and-network.md`)：Axios 实例封装、请求/响应拦截器设计、全局错误处理与通知、Token 鉴权与刷新机制、Mock 联调策略。
6. **工程化与容器化部署** (`docs/engineering-and-deployment.md`)：多环境配置策略（`.env.*`）、Docker 与 Nginx 部署方案、代码质量保证工具链（ESLint, Prettier, Stylelint, Husky, Commitlint）。

### R3. 全量业务模块深度解析 (Business Modules Documentation)
在 `docs/business-modules/` 目录下，对 `src/views/` 中的所有业务模块进行逐一分析，产出独立的模块技术说明文档。文档需阐明模块业务职责、路由与页面组件结构、依赖的状态与接口、关键交互与生命周期流程。必须覆盖以下全部模块：
- `admin-user.md` (系统管理员与账号管理)
- `application.md` (应用系统管理)
- `check-system.md` (系统检测/审计相关)
- `cms.md` (内容管理系统)
- `customer.md` (客户/客群管理)
- `dashboard.md` (运营/系统仪表盘)
- `feedback.md` (反馈管理)
- `license.md` (授权与证书许可管理)
- `login.md` (登录鉴权与重定向)
- `member.md` (会员/用户中心)
- `menu.md` (动态菜单配置)
- `notification.md` (消息与系统通知)
- `order.md` (订单与交易流转)
- `permission.md` (权限规则与分配)
- `tenant.md` (多租户管理体系)
- `welcome.md` & `error.md` (引导页与全局异常处理)

### R4. 工程级图表表达 (Mermaid Diagrams)
关键架构设计、鉴权路由流转、核心业务流必须配备标准 Mermaid 图表（时序图、流程图或状态机图），确保图文呼应、结构清晰直观。

## Acceptance Criteria

### 业务与模块覆盖度
- [ ] `docs/business-modules/` 下完整包含上述列出的所有 17 个视图模块的独立技术文档，无任何遗漏。
- [ ] `docs/README.md` 包含所有文档的相对路径索引，且所有文件内链均有效无死链。

### 事实准确性与代码吻合度
- [ ] 文档中引用的所有 Store 名称、字段、路由守卫函数、API 路径与组件名称必须与当前代码库 100% 对应，不存在虚构或陈旧逻辑。
- [ ] 所有 Mermaid 图表语法规范，能正常在 Markdown 查看器中解析渲染。


## Follow-up — 2026-10-16T09:20:21Z

将当前项目 `lipeaks_admin`（基于 pure-admin-thin 6.0.0）平滑升级重构为以官方最新 `vue-pure-admin` 完整版（v7.0.0 / Vite 8 / Rolldown / TS 6）为基准的全新底座系统。保留官方组件/功能 Demo 作为独立“示例/开发参考”菜单组，同时完整注入并兼容现存 17 个业务模块与企业级 DRF 网络通信底座。

Working directory: d:\Github\lipeaks_admin
Integrity mode: development

## Requirements

### R1. Git 基线固化与前置安全保障 (Baseline Checkpoint)
- 在执行任何底座重构前，首先对当前工作区的所有未暂存/未提交变更进行一次 Git Commit 固化（提交信息清晰标注为升级前基线），确保历史代码与刚生成的 `docs/` 文档安全可回溯。
- 清理源码目录中的非代码历史临时文件（如移除 `src/temp1006/` 临时文档目录、清理废弃的临时集成脚本）。

### R2. 官方最新 vue-pure-admin 底座同步与环境构建 (Upstream Base Sync)
- 获取并引入官方最新 `https://github.com/pure-admin/vue-pure-admin` 架构基座（包含最新的构建依赖、Vite 8/Rolldown/Oxc 配置、TypeScript 6、Vue 3.5、Tailwind CSS v4 以及现代化的代码质量工具链配置）。
- 升级 `package.json` 中的全量基础依赖体系，适配官方规范调整（包括 Vue Router 守卫改用 `return` 语法替换已弃用的 `next()`，全局类型映射及平台配置文件调整）。
- 将官方自带的丰富组件库（`@pureadmin/table`, `vxe-table`, 导表、富文本、流程图等组件工具）及其配套的 Demo 页面完整收拢至一个独立的“示例/开发参考”菜单体系中，供后续开发快速查阅。

### R3. 17 个业务视图模块全量注入与兼容性适配 (Business Modules Migration)
- 将现有的 17 个核心业务模块及其子路由完整迁移并注入到新基座中，确保业务路由挂载正确：
  `admin-user`, `application`, `check-system`, `cms`, `customer`, `dashboard`, `feedback`, `license`, `login`, `member`, `menu`, `notification`, `order`, `permission`, `tenant`, `welcome`, `error`。
- 迁移现有的全部业务 Pinia Store 模块，确保各模块的状态管理、字段及派生 Getter 无缝适配新版 Pinia。
- 修复因基础库升级（如 TypeScript 6 严格模式、Vue 3.5 宏定义等）可能引入的任何类型与组件属性编译报错。

### R4. DRF 高可用网络层平滑移植与契约保全 (DRF Network Contract Preservation)
- 严禁直接使用官方简化的原生拦截器替换现有接口逻辑。必须将当前经过实战检验的高可用 DRF 适配层平移至新基座的 `PureHttp` 中：
  1. **TokenManager**：保留双 Token 存储、过期前 5 分钟主动预警静默刷新、401 并发互斥重发等待队列。
  2. **DRF 异常反解责任链**：保留针对 Django 典型字典错误（`non_field_errors`、字段列表错误、`detail` 等）的序列化反解机制，保障前端精确错误定位。
  3. **CSRF 头自动提取与注入**：保留针对 Django Session/Cookie 的 `X-CSRFTOKEN` 自动提取与请求头注入逻辑。
- 保留并迁移现有的全局环境配置（如 `VITE_BASE_API`、多租户变量等）及 Docker/Nginx 部署配置文件。

## Acceptance Criteria

### 编译与静态类型检查
- [ ] `pnpm install` 依赖解析与安装无死锁，构建工具链正常工作。
- [ ] `pnpm typecheck`（TypeScript & Vue-TSC 全量类型检查）0 报错。
- [ ] `pnpm build` 生产构建成功，成功产出生产 `dist` 资产，0 编译错误。

### 运行时架构与业务保全
- [ ] 系统能成功启动（`pnpm dev`），登录页面正常挂载。
- [ ] 现存 17 个业务模块的路由均可被正常访问，视图组件挂载正常，无控制台致命报错。
- [ ] 官方 Demo 页面与示例路由被正确定位收拢在“示例/开发参考”菜单组中，功能正常可用。
- [ ] DRF 接口调用请求头正常携带 `Authorization: Bearer <token>` 与 `X-CSRFTOKEN`，错误响应能正常解析展示。
