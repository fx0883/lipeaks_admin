# 业务视图模块逆向调研报告 (Part A: 9大核心业务模块)

**项目名称**: lipeaks_admin 前端工程  
**调研人员**: teamwork_preview_explorer (业务模块逆向探索与代码分析专家)  
**调研时间**: 2026-10-16  
**事实来源**: 基于前端源码静态逆向分析（Vue 3 SFC、TypeScript 类型系统、Pinia 全局状态、Vue Router 路由配置及 Axios 网络封装）。

---

## 目录
1. [admin-user (系统管理员与账号管理)](#1-admin-user-系统管理员与账号管理)
2. [application (应用系统管理)](#2-application-应用系统管理)
3. [check-system (系统检测与打卡体系)](#3-check-system-系统检测与打卡体系)
4. [cms (内容管理系统)](#4-cms-内容管理系统)
5. [customer (客户与客群管理)](#5-customer-客户与客群管理)
6. [dashboard (运营与系统仪表盘)](#6-dashboard-运营与系统仪表盘)
7. [feedback (反馈与软件支持体系)](#7-feedback-反馈与软件支持体系)
8. [license (授权与证书许可管理)](#8-license-授权与证书许可管理)
9. [login (登录鉴权与重定向)](#9-login-登录鉴权与重定向)

---

## 1. admin-user (系统管理员与账号管理)

### 1.1 真实代码位置与组件清单
- **视图目录**: `src/views/admin-user/`
- **页面组件清单**:
  - `src/views/admin-user/index.vue`: 管理员用户主列表、组合搜索栏、表格展示、更多操作下拉菜单、各类模态框集成。
  - `src/views/admin-user/create.vue`: 独立页面模式创建普通租户管理员。
  - `src/views/admin-user/create-super-admin.vue`: 独立页面模式创建超级管理员。
  - `src/views/admin-user/edit.vue`: 独立页面模式更新管理员信息。
  - `src/views/admin-user/detail.vue`: 独立页面模式查看管理员详情。
  - `src/views/admin-user/profile.vue`: 当前登录管理员个人资料展示与修改页面。
- **关联组件**:
  - `src/components/AdminUserManagement/AdminUserForm.vue`: 统一管理员表单（支持 create / superAdmin / update / view 四种模式）。
  - `src/components/AdminUserManagement/ConfirmDialog.vue`: 二次确认弹窗组件。
  - `src/components/AdminUserManagement/TenantSelectDialog.vue`: 撤销超级管理员时强制选择归属租户的弹窗。
  - `src/components/AdminUserManagement/MenuSettingButton.vue`: 菜单权限配置操作按钮。
  - `src/components/AdminUserManagement/MenuSettingDialog.vue`: 针对特定管理员的动态菜单树分配弹窗。
  - `src/components/AdminUserManagement/ResetPasswordDialog.vue`: 重置管理员登录密码弹窗。

### 1.2 业务职责与功能概述
- 针对平台内部“超级管理员 (Super Admin)”和“租户管理员 (Tenant Admin)”两级账号体系的全生命周期治理。
- 支持管理员增删改查、账号启用/停用、超级管理员身份提拔（Grant）与降级（Revoke，降级必须指定租户归属）、密码重置、头像维护、个人 Profile 维护及针对账号个人的细粒度菜单权限配置。

### 1.3 路由挂载
- **挂载模式**: 动态后端路由（由接口 `/menus/admin/routes/` 返回后由 `addAsyncRoutes` 动态注册至 Vue Router）。
- **路由标识**:
  - `path`: `/admin-user`（列表）及子路径 `/admin-user/create`、`/admin-user/profile` 等。
  - `component`: 动态映射至 `src/views/admin-user/index.vue`。
  - `meta`:
    - `title`: i18n 键值 `"menus.pureAdminUser"` / `"adminUser.management"`。
    - `backstage`: `true`（动态标记）。
    - `roles`: 要求管理员权限。

### 1.4 接口与通信契约
- **API 模块**: `src/api/modules/adminUser.ts`
- **核心接口汇总**:
  | 函数名 | 请求方法 | 路径 | 参数 | 返回契约 |
  |---|---|---|---|---|
  | `getAdminUserList` | `GET` | `/admin-users/` | `AdminUserListParams` (page, page_size, search, status, is_super_admin, tenant_id) | `PaginationResponse<AdminUser>` |
  | `createAdminUser` | `POST` | `/admin-users/` | `AdminUserCreateParams` (username, email, password, password_confirm, phone, nick_name, tenant_id) | `ApiResponse<AdminUser>` |
  | `createSuperAdmin` | `POST` | `/admin-users/super-admin/create/` | `AdminUserCreateParams` (`is_super_admin: true`) | `ApiResponse<AdminUser>` |
  | `getAdminUserDetail`| `GET` | `/admin-users/${id}/` | 路径参数 `id: number` | `ApiResponse<AdminUser>` |
  | `updateAdminUser` | `PUT` | `/admin-users/${id}/` | `AdminUserUpdateParams` (email, phone, nick_name, first_name, last_name, status) | `ApiResponse<AdminUser>` |
  | `deleteAdminUser` | `DELETE` | `/admin-users/${id}/` | 路径参数 `id: number` | `ApiResponse<any>` |
  | `grantSuperAdmin` | `POST` | `/admin-users/${id}/grant-super-admin/` | 路径参数 `id: number` | `ApiResponse<AdminUser>` |
  | `revokeSuperAdmin` | `POST` | `/admin-users/${id}/revoke-super-admin/` | `id: number`, body: `{ tenant_id: number }` | `ApiResponse<AdminUser>` |
  | `activateAdminUser` | `POST` | `/admin-users/${id}/activate/` | 路径参数 `id: number` | `ApiResponse<AdminUser>` |
  | `deactivateAdminUser`| `POST` | `/admin-users/${id}/deactivate/` | 路径参数 `id: number` | `ApiResponse<AdminUser>` |
  | `resetAdminUserPassword`| `POST` | `/auth/${id}/change-password/` | `{ new_password: string, confirm_password: string }` | `ApiResponse<{ success: boolean }>` |
  | `uploadAdminUserAvatar` | `POST` | `/admin-users/${id}/avatar/upload/` | `FormData` (multipart/form-data) | `ApiResponse<{ avatar: string }>` |
  | `getCurrentAdmin` | `GET` | `/admin-users/me/` | 无 | `ApiResponse<AdminUser>` |
  | `updateCurrentAdmin`| `PUT` | `/admin-users/me/` | `AdminUserUpdateParams` | `ApiResponse<AdminUser>` |

### 1.5 依赖状态与数据模型
- **Pinia Store**: `useAdminUserStore` (`src/store/modules/adminUser.ts`)
  - `state`:
    - `adminUserList`: `{ total: number, page: number, limit: number, data: AdminUser[] }`
    - `currentAdminUser`: `AdminUser | null`
    - `loading`: 细粒度布尔控制字典 (`list`, `create`, `update`, `delete`, `grantSuperAdmin`, `revokeSuperAdmin`, `activate`, `deactivate`, `resetPassword`, `uploadAvatar`, `createSuperAdmin`)
  - `actions`: `fetchAdminUserList`, `createNewAdminUser`, `createNewSuperAdmin`, `updateAdminUserInfo`, `removeAdminUser`, `grantSuperAdminAction`, `revokeSuperAdminAction`, `activateAdminUserAction`, `deactivateAdminUserAction`, `resetAdminUserPasswordAction` 等。
- **关键数据模型 (`src/types/adminUser.ts`)**:
  - `AdminUser`: `{ id, username, email, phone, nick_name, first_name, last_name, is_active, avatar, tenant, tenant_name, is_admin, is_member, is_super_admin, role, status, last_login_time, last_login_ip, date_joined }`
  - 状态枚举: `AdminUserStatus = 'active' | 'suspended' | 'inactive'`

### 1.6 关键业务流程与交互
1. **超级管理员页面硬防线**: 组件装载前校验 `if (!userStore.is_super_admin) { ElMessage.error("无权限访问此页面"); router.push("/dashboard"); }`。
2. **多重安全互锁**:
   - 自身账号防护：列表更多操作中，如果 `scope.row.id === userStore.id`，则隐藏“撤销超管”、“停用账号”、“删除用户”选项，防止管理员误锁自身。
3. **撤销超管两阶段事务交互**:
   - 触发“撤销超级管理员” -> 弹出 `TenantSelectDialog` 要求选择降级后的归属租户 -> 选定租户后弹出 `ConfirmDialog` 警告确认 -> 提交 `revokeSuperAdminAction(userId, tenantId)`。

### 1.7 权限控制点
- 页面进入级：强依赖 `userStore.is_super_admin`。
- 操作级：内置在下拉菜单和按钮的 `v-if` 条件渲染（根据 `is_super_admin`、`is_active` 以及当前用户自身 ID 判断）。

---

## 2. application (应用系统管理)

### 2.1 真实代码位置与组件清单
- **视图目录**: `src/views/application/`
- **页面组件清单**:
  - `src/views/application/index.vue`: 应用管理主界面（多维检索、数据列表、创建/编辑模态框调用、删除确认）。
  - `src/views/application/create.vue`: 独立页面模式创建应用。
  - `src/views/application/edit.vue`: 独立页面模式编辑应用。
  - `src/views/application/detail.vue`: 应用多维度详情看板（基础属性描述列表、关联统计指标看板）。
- **关联组件**:
  - `src/components/Application/StatusTag.vue`: 应用生命周期状态标签。
  - `src/components/Application/ApplicationForm.vue`: 应用创建/编辑核心表单组件（含 Logo 上传及参数校验）。

### 2.2 业务职责与功能概述
- 统一管理平台旗下接入的各个软件应用系统（Application）。
- 记录应用的标识代码（Code）、中英文名称、版本号、系统状态、负责人（Owner）、归属团队（Team）、关联描述与 Logo。
- 作为许可证（License）、反馈（Feedback）与内容（CMS）模块的业务上层宿主，汇聚统计数据（关联许可证数、反馈单数、发布文章数）。

### 2.3 路由挂载
- **挂载模式**: 动态后端路由。
- **页面路径**:
  - 列表: `/application`
  - 详情: `/application/detail/:id`
  - 新建: `/application/create`
  - 编辑: `/application/edit/:id`
- **路由 Meta**:
  - `title`: `"application.title"` / `"menus.pureApplication"`
  - `keepAlive`: 支持列表缓存

### 2.4 接口与通信契约
- **API 模块**: `src/api/modules/application.ts`
- **核心接口汇总**:
  | 函数名 | 请求方法 | 路径 | 参数 | 返回契约 |
  |---|---|---|---|---|
  | `getApplicationList` | `GET` | `/applications/` | `ApplicationListParams` (search, status, page, page_size) | `PaginationResponse<Application>` |
  | `getApplicationDetail` | `GET` | `/applications/${id}/` | 路径参数 `id: number` | `ApiResponse<Application>` |
  | `createApplication` | `POST` | `/applications/` | `ApplicationCreateUpdateParams` (name, code, current_version, status, owner, team, description) | `ApiResponse<Application>` |
  | `updateApplication` | `PUT` | `/applications/${id}/` | `id: number`, `ApplicationCreateUpdateParams` | `ApiResponse<Application>` |
  | `patchApplication` | `PATCH` | `/applications/${id}/` | `id: number`, `Partial<ApplicationCreateUpdateParams>` | `ApiResponse<Application>` |
  | `deleteApplication` | `DELETE` | `/applications/${id}/` | 路径参数 `id: number` | `ApiResponse<any>` |
  | `getApplicationStatistics` | `GET` | `/applications/${id}/statistics/` | 路径参数 `id: number` | `ApiResponse<ApplicationStatistics>` (licenses, feedbacks, articles 聚合数据) |
  | `getApplicationArticles` | `GET` | `/applications/${id}/articles/` | 路径参数 `id: number` | `ApiResponse<ApplicationArticle[]>` |
  | `uploadApplicationLogo` | `POST` | `/applications/${id}/upload-logo/` | `FormData` (`logo: File`) | `ApiResponse<ApplicationLogoUploadResponse>` |

### 2.5 依赖状态与数据模型
- **Pinia Store**: `useApplicationStore` (`src/store/modules/application.ts`)
  - `state`:
    - `applicationList`: `{ total: number, page: number, limit: number, data: Application[] }`
    - `currentApplication`: `Application | null`
    - `statistics`: `ApplicationStatistics | null`
    - `loading`: `{ list: boolean, detail: boolean, create: boolean, update: boolean, delete: boolean }`
- **数据模型 (`src/types/application.ts`)**:
  - 状态枚举: `ApplicationStatus = 'development' | 'testing' | 'active' | 'inactive' | 'deprecated'`
  - 核心实体 `Application`: `{ id, name, code, logo, current_version, status, owner, team, description, created_at, updated_at }`

### 2.6 关键业务流程与交互
1. **列表与弹窗混合模式**: 列表页同时支持点击按钮弹出 `ApplicationForm` 模态框，也支持深层链接跳转独立详情页。
2. **表单重置防御机制**: 在打开新建对话框时，通过 `setTimeout(..., 0)` 下一个宏任务中调用子组件 `createFormRef.value.resetForm()`，避免复用上一次提交残留。
3. **统计集成视图**: 详情页通过 `Promise.all` 联动获取应用实体数据及聚合统计指标 (`getApplicationStatistics`)，渲染包括许可证总数、工单总数、知识库文章数在内的 KPI 卡片。

### 2.7 权限控制点
- 统一通过辅助函数 `hasPermission`:
  ```ts
  const hasPermission = (permission: string): boolean => {
    return userStore.is_super_admin || hasPerms(permission);
  };
  ```
- 按钮权限码：
  - 创建: `application:create`
  - 查看: `application:view`
  - 编辑: `application:edit`
  - 删除: `application:delete`

---

## 3. check-system (系统检测与打卡体系)

### 3.1 真实代码位置与组件清单
- **视图目录**: `src/views/check-system/`
- **业务子系统组件清单**:
  - **任务类型 (Task Categories)**:
    - `src/views/check-system/task-categories/list/index.vue`: 任务类型列表、系统预设过滤、表单类型过滤、排序。
    - `src/views/check-system/task-categories/editor/index.vue`: 多语言国际化编辑表单、颜色与图标选择器。
  - **任务模板 (Task Templates)**:
    - `src/views/check-system/task-templates/list/index.vue`: 任务模板列表。
    - `src/views/check-system/task-templates/editor/index.vue`: 任务模板多语言编辑器。
  - **用户任务 (Tasks)**:
    - `src/views/check-system/tasks/list/index.vue`: 会员习惯任务管理列表。
    - `src/views/check-system/tasks/detail/index.vue`: 任务执行详情。
  - **打卡记录流水 (Check Records)**:
    - `src/views/check-system/check-records/list/index.vue`: 全局会员打卡日志流水列表。
  - **21天打卡周期 (Cycles)**:
    - `src/views/check-system/cycles/list/index.vue`: 21天周期执行追踪列表。
    - `src/views/check-system/cycles/detail/index.vue`: 周期完成度进度条、主题分布、打卡统计。

### 3.2 业务职责与功能概述
- 提供 21 天习惯养成与打卡追踪完整闭环体系。
- 负责系统预设/自定义打卡分类（支持特定记录表单：文本、睡眠时长、运动消耗、饮食摄入），多语言国际化文案（支持 zh-hans, en, zh-hant, ja, ko, fr 六国语言）。
- 支撑任务模版分配、会员个性化打卡任务调度、提醒时间管理、周期进度与延迟打卡核验。

### 3.3 路由挂载
- **挂载模式**: 动态后端路由。
- **页面路径**:
  - 任务类型: `/check-system/task-categories`
  - 任务模板: `/check-system/task-templates`
  - 任务列表: `/check-system/tasks`
  - 打卡记录: `/check-system/check-records`
  - 打卡周期: `/check-system/cycles`
- **路由 Meta**: 带有各个子页面的 `title`、`icon` 及面包屑配置。

### 3.4 接口与通信契约
- **API 模块**: `src/api/modules/checkSystem.ts` (基础路径 `/check-system`)
- **接口汇总表**:
  | 业务领域 | 函数名 | 方法 | 路径 | 核心参数/负载 |
  |---|---|---|---|---|
  | 任务类型 | `getTaskCategoryList` | `GET` | `/check-system/task-categories/` | `is_system`, `form_type`, `search`, `page`, `page_size` |
  | 任务类型 | `createTaskCategory` | `POST` | `/check-system/task-categories/` | `name`, `form_type`, `icon`, `color`, `translations` 等 |
  | 任务类型 | `updateTaskCategory` | `PATCH` | `/check-system/task-categories/${id}/` | `TaskCategoryUpdateParams` |
  | 任务类型 | `deleteTaskCategory` | `DELETE` | `/check-system/task-categories/${id}/` | 无 |
  | 任务模板 | `getTaskTemplateList` | `GET` | `/check-system/task-templates/` | `category`, `is_system`, `search` |
  | 任务模板 | `createTaskTemplate` | `POST` | `/check-system/task-templates/` | `name`, `category`, `translations`, `reminder` |
  | 任务模板 | `updateTaskTemplate` | `PATCH` | `/check-system/task-templates/${id}/` | `TaskTemplateUpdateParams` |
  | 任务模板 | `deleteTaskTemplate` | `DELETE` | `/check-system/task-templates/${id}/` | 无 |
  | 会员任务 | `getTaskList` | `GET` | `/check-system/tasks/` | `category`, `status`, `search` |
  | 会员任务 | `getTaskDetail` | `GET` | `/check-system/tasks/${id}/` | 路径参数 `id` |
  | 会员任务 | `createTask` | `POST` | `/check-system/tasks/` | `category`, `member`, `start_date`, `end_date`, `frequency_type` |
  | 会员任务 | `updateTask` | `PATCH` | `/check-system/tasks/${id}/` | `TaskUpdateParams` |
  | 会员任务 | `deleteTask` | `DELETE` | `/check-system/tasks/${id}/` | 无 |
  | 打卡记录 | `getCheckRecordList` | `GET` | `/check-system/check-records/` | `task`, `member`, `check_date`, `delayed` |
  | 打卡记录 | `getCheckRecordDetail`| `GET` | `/check-system/check-records/${id}/` | 路径参数 `id` |
  | 打卡周期 | `getCycleList` | `GET` | `/check-system/cycles/` | `member`, `is_active` |
  | 打卡周期 | `getCycleDetail` | `GET` | `/check-system/cycles/${id}/` | 路径参数 `id` |
  | 打卡周期 | `getCurrentCycle` | `GET` | `/check-system/cycles/current/` | 无 |
  | 打卡周期 | `getCycleStatistics` | `GET` | `/check-system/cycles/${id}/stats/` | 路径参数 `id` |

### 3.5 依赖状态与数据模型
- **模型文件**: `src/types/checkSystem.ts`
  - 表单类型: `FormType = "text" | "sleep" | "exercise" | "diet"`
  - 任务状态: `TaskStatus = "active" | "completed" | "paused" | "cancelled"`
  - 频率类型: `FrequencyType = "daily" | "weekly" | "custom"`
  - 国际化对象结构: `TaskCategoryTranslations: { "zh-hans": {...}, "en": {...}, ... }`
- **状态管理**: 视图层直接组合 `ref`、`reactive` 与 API 通信，无专用 Pinia 模块，保障状态独立性。

### 3.6 关键业务流程与交互
1. **多语言动态编辑交互**: 在 `task-categories/editor` 与 `task-templates/editor` 中，Tab 页提供各语言切换，输入即时注入对应语言的 `translations` 字段，服务端自动根据当前请求头返回 `translated_name` 与 `translated_description`。
2. **21天周期进度看板**: 详情页读取 `CycleStatistics`，计算完成百分比 `progress`、已完成主题数 `themes_completed` 及连续打卡天数 `unique_days`。

---

## 4. cms (内容管理系统)

### 4.1 真实代码位置与组件清单
- **视图目录**: `src/views/cms/`
- **页面组件清单**:
  - **文章 (Article)**:
    - `src/views/cms/article/index.vue`: 文章列表管理枢纽（含复合筛选、批量删除、批量锁定/解锁、快速发布）。
    - `src/views/cms/article/create.vue`: 新建文章页面。
    - `src/views/cms/article/edit.vue`: 编辑文章页面。
    - `src/views/cms/article/detail.vue`: 文章完整详情与阅读预览。
    - `src/views/cms/article/export.vue`: 文章自定义格式导出页面（txt, md, html, json）。
    - `src/views/cms/article/import.vue`: 基于 Web Worker 的批量 Markdown/图文离线解析与导入向导。
    - `src/views/cms/article/version.vue`: 文章历史版本对比与回滚。
  - **分类 (Category)**:
    - `src/views/cms/category/index.vue`: 分类管理与树形拖拽排序。
    - `src/views/cms/category/edit.vue`: 分类编辑。
    - `src/views/cms/category/detail.vue`: 分类详情。
  - **标签与分组 (Tag & TagGroup)**:
    - `src/views/cms/tag/index.vue`: 标签列表及所属分组管理。
    - `src/views/cms/tag/create.vue`: 创建标签。
    - `src/views/cms/tag/edit.vue`: 编辑标签。
  - **评论管理 (Comment)**:
    - `src/views/cms/comment/index.vue`: 评论审核台（审核、批准、拒绝、垃圾标记、批量处理）。
    - `src/views/cms/comment/create.vue`: 管理端代发评论。
    - `src/views/cms/comment/edit.vue`: 编辑评论。
    - `src/views/cms/comment/detail.vue`: 评论及多层回复详情。
- **关联组件**:
  - `src/components/Cms/Article/ArticleForm.vue`: 文章核心编辑器（集成 Markdown/HTML 富文本、分类标签多选、置顶/加锁/特性标记）。
  - `src/components/Cms/Article/ConfirmDialog.vue`: 操作确认组件。

### 4.2 业务职责与功能概述
- 企业级内容发布与管理中心，涵盖文章全流程（撰写、草稿、审核、发布、下架、归档）。
- 支撑多层级树形分类组织、标签分组系统、富文本及 Markdown 内容解析。
- 支持大批量文章的离线解压解析导入（利用多线程 Worker 处理内部图片重映射上传）及多格式导出。
- 支持多版本修订对比（Diff）与恢复、评论反垃圾过滤与盖楼回复审核。

### 4.3 路由挂载
- **静态豁免路由 (`src/router/modules/remaining.ts`)**:
  - 文章无外层侧边栏预览: `path: "/preview/article/:id"`, `name: "ArticlePreview"`, `component: () => import("@/views/cms/article/detail.vue")`
  - 批量导入向导: `path: "/cms/article/import"`, `name: "ArticleImport"`, `component: () => import("@/views/cms/article/import.vue")`
  - 批量导出页面: `path: "/cms/article/export"`, `name: "ArticleExport"`, `component: () => import("@/views/cms/article/export.vue")`
- **动态业务路由**:
  - `/cms/article` (文章管理)
  - `/cms/category` (分类树)
  - `/cms/tag` (标签组)
  - `/cms/comment` (评论审核)

### 4.4 接口与通信契约
- **API 模块**: `src/api/modules/cms.ts`
- **核心接口汇总**:
  | 业务分类 | 函数名 | 方法 | 路径 | 说明 |
  |---|---|---|---|---|
  | 文章 | `getArticleList` | `GET` | `/cms/articles/` | 分页、关键词、状态、分类、标签、置顶、锁定筛选 |
  | 文章 | `getArticleDetail` | `GET` | `/cms/articles/${id}/` | 获取文章完整数据 |
  | 文章 | `createArticle` | `POST` | `/cms/articles/` | 创建文章（接收 category_ids, tag_ids） |
  | 文章 | `updateArticle` | `PUT` | `/cms/articles/${id}/` | 完整更新 |
  | 文章 | `patchArticle` | `PATCH` | `/cms/articles/${id}/` | 局部更新（如单独修改 is_locked） |
  | 文章 | `deleteArticle` | `DELETE` | `/cms/articles/${id}/` | 删除单篇文章 |
  | 文章 | `batchDeleteArticles` | `POST` | `/cms/articles/batch-delete/` | `{ article_ids, force }` 批量物理/逻辑删除 |
  | 文章 | `publishArticle` | `POST` | `/cms/articles/${id}/publish/` | 状态变为 published |
  | 文章 | `unpublishArticle` | `POST` | `/cms/articles/${id}/unpublish/`| 撤回发布 |
  | 文章 | `archiveArticle` | `POST` | `/cms/articles/${id}/archive/` | 文章归档 |
  | 文章版本 | `getArticleVersions` | `GET` | `/cms/articles/${id}/versions/` | 获取历史版本列表 |
  | 文章版本 | `getArticleVersionDetail`| `GET`| `/cms/articles/${id}/versions/${ver}/`| 获取指定版本快照 |
  | 分类 | `getCategoryList` | `GET` | `/cms/categories/` | 获取全部分类（可带 Accept-Language） |
  | 分类 | `getCategoryTree` | `GET` | `/cms/categories/tree/` | 树形结构数据 |
  | 分类 | `updateCategoryOrder`| `POST` | `/cms/categories/reorder/`| 拖拽排序位置批量更新 |
  | 标签 | `getTagList` | `GET` | `/cms/tags/` | 标签列表 |
  | 标签组 | `getTagGroupList` | `GET` | `/cms/tag-groups/` | 标签组列表 |
  | 评论 | `getCommentList` | `GET` | `/cms/comments/` | 评论分页列表 |
  | 评论 | `approveComment` | `POST` | `/cms/comments/${id}/approve/` | 批准展示 |
  | 评论 | `rejectComment` | `POST` | `/cms/comments/${id}/reject/` | 驳回评论 |
  | 评论 | `markCommentAsSpam`| `POST` | `/cms/comments/${id}/mark-spam/` | 标记垃圾评论 |
  | 评论 | `batchComments` | `POST` | `/cms/comments/batch/` | 批量审核/删除 |

### 4.5 依赖状态与数据模型
- **Pinia Store**: `useCmsStore` (`src/store/modules/cms.ts`)
  - 管理庞大的缓存与实体：`articles`, `currentArticle`, `articleStatistics`, `articleVersions`, `categories`, `categoryTree`, `tags`, `tagGroups`, `comments`。
- **核心数据模型 (`src/types/cms.ts`)**:
  - 文章状态: `ArticleStatus = "draft" | "pending" | "published" | "archived"`
  - 内容格式: `ContentType = "markdown" | "html" | "image" | ...`
  - 访问控制: `ArticleVisibility = "public" | "private" | "password"`

### 4.6 关键业务流程与交互
1. **多选批量管线**: 表格内多选后激活底部操作栏，支持批量锁定、批量解锁、批量删除。删除支持标准错误捕获系统（`useErrorHandling`）。
2. **多线程离线导入**: `import.vue` 引入 Web Worker 解析前端选择的文件夹，提取 Markdown frontmatter、正文与相对路径图片，通过 `matchCoverImage` 与 `processMarkdownImages` 将本地图片先行上传服务器替换后再创建文章实体。

---

## 5. customer (客户与客群管理)

### 5.1 真实代码位置与组件清单
- **视图目录**: `src/views/customer/`
- **页面组件清单**:
  - `src/views/customer/index.vue`: 客户总表、内嵌联系人子表展开、多维状态检索、批量删除。
  - `src/views/customer/create.vue`: 新建客户。
  - `src/views/customer/edit.vue`: 编辑客户基本信息。
  - `src/views/customer/detail.vue`: 客户深度档案（包含“基本信息 Basic”、“联系人 Contacts”、“关联租户 Tenants”、“订单流转 Orders”多标签页）。
- **关联组件 (`src/components/CustomerManagement/`)**:
  - `CustomerStatusTag.vue`: 客户生命周期状态标签（active, inactive, prospect, churned）。
  - `CustomerValueTag.vue`: 价值分级标签（platinum, gold, silver, bronze）。
  - `CustomerForm.vue`: 客户基本属性编辑表单。
  - `CustomerMembersSubTable.vue`: 主表格行展开时直接嵌套渲染的联系人列表子组件。
  - `ContactPersonForm.vue`: 客户关键联系人（会员）创建/维护表单。
  - `TenantLinkForm.vue`: 租户实例与客户关联配置表单。
  - `CustomerOrderList.vue`: 客户历史消费订单流转列表（跨模块调用）。

### 5.2 业务职责与功能概述
- 负责企业级 B 端客户（Customer）主数据管理。
- 维护客户类型（企业、政府、教育、非营利、个人）、价值分级与销售流转状态。
- 管理客户组织架构内部的多个关键联系人（Member/联系人），支持设定主要联系人（Primary Contact）。
- 关联客户在平台中开通的多个“租户实例 (Tenant)”和采购“订单 (Order)”。

### 5.3 路由挂载
- **挂载模式**: 动态后端路由。
- **页面路径**: `/customer`（列表）、`/customer/detail/:id`、`/customer/create`、`/customer/edit/:id`。
- **权限标识**: `customer:manage` 或超级管理员。

### 5.4 接口与通信契约
- **API 模块**: `src/api/modules/customer.ts`
- **核心接口汇总**:
  | 业务类别 | 函数名 | 方法 | 路径 | 说明 |
  |---|---|---|---|---|
  | 客户基础 | `getCustomerList` | `GET` | `/customers/` | 客户分页列表（支持 search, status, type, value_level） |
  | 客户基础 | `getCustomerDetail` | `GET` | `/customers/${id}/` | 客户基础详情 |
  | 客户基础 | `createCustomer` | `POST` | `/customers/` | 创建客户主档案 |
  | 客户基础 | `updateCustomer` | `PUT` | `/customers/${id}/` | 完整更新 |
  | 客户基础 | `deleteCustomer` | `DELETE` | `/customers/${id}/` | 单个删除 |
  | 客户基础 | `searchCustomers` | `GET` | `/customers/search/` | 关键词全文搜索 |
  | 批量操作 | `bulkCreateCustomers` | `POST` | `/customers/bulk/create/` | 批量创建 |
  | 批量操作 | `bulkUpdateCustomers` | `PUT` | `/customers/bulk/update/` | 批量修改属性 |
  | 批量操作 | `bulkDeleteCustomers` | `DELETE` | `/customers/bulk/delete/` | `{ customer_ids: number[] }` 批量清除 |
  | 联系人关系 | `getCustomerMemberRelations` | `GET` | `/customers/members/relations/customer-members/` | 查询客户关联的联系人列表 |
  | 联系人关系 | `createCustomerMemberRelation`| `POST` | `/customers/members/relations/` | 建立客户与会员账号的关联 |
  | 联系人关系 | `setPrimaryMemberRelation` | `POST` | `/customers/${cid}/members/${rid}/set-primary/` | 设定为主要业务联系人 |
  | 租户关系 | `getCustomerTenantRelations` | `GET` | `/customers/${cid}/tenants/` | 查询客户开通的租户列表 |
  | 租户关系 | `createCustomerTenantRelation`| `POST` | `/customers/${cid}/tenants/` | 绑定客户与系统租户 |

### 5.5 依赖状态与数据模型
- **Pinia Store**: `useCustomerStore` (`src/store/modules/customer.ts`)
  - 维护 `customerList`、`currentCustomer`、`customerContacts`、`customerTenants` 等聚合状态。
- **数据模型 (`src/types/customer.ts`)**:
  - 状态: `CustomerStatus = 'active' | 'inactive' | 'prospect' | 'churned'`
  - 价值等级: `CustomerValueLevel = 'platinum' | 'gold' | 'silver' | 'bronze'`
  - 客户类型: `CustomerType = 'enterprise' | 'government' | 'education' | 'nonprofit' | 'individual'`

### 5.6 关键业务流程与交互
1. **主子表嵌套展开**: 客户列表主表格配置 `type="expand"`，点击展开时调用 `fetchMemberRelations(row.id)`，就地渲染 `CustomerMembersSubTable`，支持在展开层内一键切换“设为主要联系人”。
2. **多标签档案综合视图**: `detail.vue` 结合 `el-tabs` 组织基础属性、联系人列表、关联租户与历史订单，实现全生命周期 360 度客户画像。

---

## 6. dashboard (运营与系统仪表盘)

### 6.1 真实代码位置与组件清单
- **视图目录**: `src/views/dashboard/`
- **页面组件**:
  - `src/views/dashboard/index.vue`: 系统顶层运营仪表盘容器，基于 Tab 切换承载租户视角与用户视角。
- **核心子组件 (`src/components/Dashboard/`)**:
  - `TenantCharts.vue`: 租户宏观统计分析组件。
  - `UserCharts.vue`: 用户与活跃度统计分析组件。
  - `DateRangePicker.vue`: 日期区间快速选择器。
  - `PeriodSelector.vue`: 统计粒度选择器（日/周/月/年）。
  - `StatisticCard.vue` & `UserStatisticCard.vue`: KPI 核心指标卡片（支持同比/环比及动态图标）。
  - **图表子组件 (`src/components/Dashboard/Charts/`)**:
    - `TenantTrendChart.vue`: 租户增长走势折线/面积图。
    - `TenantStatusChart.vue`: 租户状态分布饼图/环形图。
    - `TenantCreationChart.vue`: 租户创建速率柱状图。
    - `UserGrowthChart.vue`: 用户注册与留存增长趋势图。
    - `UserRoleChart.vue`: 角色分布南丁格尔玫瑰图/环形图。
    - `ActiveUsersChart.vue`: 日活/月活走势图。
    - `LoginHeatmapChart.vue`: 24小时 × 7天用户登录行为热力图。

### 6.2 业务职责与功能概述
- 负责系统核心运营数据大盘的可视化呈现。
- 帮助管理层实时监测租户总量、租户健康状态、用户增长曲线、角色分布矩阵与登录高峰热力分布。

### 6.3 路由挂载
- **挂载模式**: 动态后端路由（默认常驻重定向目标页之一）。
- **路由 Path**: `/dashboard`
- **路由 Meta**:
  - `title`: `"menus.pureDashboard"` / `"dashboard.title"`
  - `icon`: `"ep:data-board"` / `"ri:dashboard-line"`

### 6.4 接口与通信契约
- 聚合消费两大底层 API 模块：
  1. **租户统计 (`src/api/modules/tenant.ts`)**:
     - `fetchTenantTrendData({ startDate, endDate, period })`: 获取租户增长走势。
     - `fetchTenantStatusDistribution()`: 获取状态分布占比。
     - `fetchTenantCreationRate({ startDate, endDate, period })`: 创建速率分析。
     - `calculateTenantSummary()`: 计算租户大盘核心汇总指标。
  2. **用户统计 (`src/api/modules/user.ts`)**:
     - `fetchUserGrowthTrend({ startDate, endDate, period })`: 用户增长趋势。
     - `fetchUserRoleDistribution()`: 角色构成占比。
     - `fetchActiveUsers({ startDate, endDate, period })`: 活跃用户曲线。
     - `fetchLoginHeatmap({ startDate, endDate })`: 登录热力数据。
     - `calculateUserSummary()`: 用户大盘汇总数据。

### 6.5 依赖状态与交互生命周期
- **响应式状态**: 组件内通过 `dayjs` 维护 `startDate`、`endDate`、`period`（默认最近 3 个月）。
- **健壮性交互机制**:
  - **防抖检索**: 使用 `@pureadmin/utils` 的 `debounce` 封装日期变动与周期切换回调，防止用户频繁切换日期造成请求风暴。
  - **请求重试容错**: 内置 `MAX_RETRY_ATTEMPTS = 3` 重试计数器，在接口网络抖动时自动重新发起拉取。
  - **图表生命周期联动**: 监听 Tab 切换，只有在激活 `activeTab === 'user'` 时才按需渲染 `UserCharts`，并在组件卸载或窗口大小变动（`resize`）时释放/更新 ECharts 实例。

---

## 7. feedback (反馈与软件支持体系)

### 7.1 真实代码位置与组件清单
- **视图目录**: `src/views/feedback/`
- **庞大子系统组件清单**:
  - **反馈主线 (`feedbacks/`)**:
    - `src/views/feedback/feedbacks/index.vue`: 反馈列表检索看板（按类型、状态、优先级、排序筛选，卡片式交互）。
    - `src/views/feedback/feedbacks/detail.vue`: 反馈工单全信息详情（盖楼回复、投票支持、状态流转、附件预览）。
    - `src/views/feedback/feedbacks/submit.vue`: 前台/管理端提交新反馈。
  - **数据大盘 (`dashboard/` & `statistics/`)**:
    - `src/views/feedback/dashboard/index.vue`: 反馈服务台大盘概览。
    - `src/views/feedback/statistics/index.vue`: 反馈趋势与应用分布统计图。
  - **邮件子系统 (`email/`)**:
    - `src/views/feedback/email/templates/index.vue`: 邮件通知模板管理（变量插值配置、预览）。
    - `src/views/feedback/email/logs/index.vue`: 邮件发送记录追踪（成功/失败、重试投递）。
  - **健康度与中间件监控 (`health/`)**:
    - `src/views/feedback/health/index.vue`: 系统健康总览、Redis 内存与客户端监控、Database 连通性监控。
  - **事件通知与订阅 (`notification/`)**:
    - `src/views/feedback/notification/config/index.vue`: 事件订阅规则与接收人通道配置。
  - **软件产品与版本发布 (`software/`)**:
    - `src/views/feedback/software/products/index.vue`, `create.vue`, `edit.vue`, `detail.vue`: 关联软件产品管理。
    - `src/views/feedback/software/categories/index.vue`: 软件所属行业/功能分类。
    - `src/views/feedback/software/versions/index.vue`: 软件各版本发布流转与更新日志。

### 7.2 业务职责与功能概述
- 构成面向客户与内部支撑团队的企业级工单反馈与交付生态。
- 反馈分类涵盖 Bug 报告、功能请求、改进建议、问题咨询；具备投票（Vote）、多层级技术回复（Reply）、附件上传闭环。
- 深度绑定邮件系统自动通知，具备系统健康探测监控（对 Redis 缓存状态及数据库探活）。

### 7.3 路由挂载
- **挂载模式**: 动态后端路由。
- **页面路由**:
  - `/feedback/feedbacks` (反馈列表)
  - `/feedback/dashboard` (反馈监控大盘)
  - `/feedback/software/products` (软件产品)
  - `/feedback/email/templates` (邮件模板)
  - `/feedback/health` (系统探活)

### 7.4 接口与通信契约
- **API 模块**: `src/api/modules/feedback.ts`
- **核心接口汇总**:
  | 业务领域 | 函数名 | 方法 | 路径 | 核心行为 |
  |---|---|---|---|---|
  | 反馈核心 | `getFeedbackList` | `GET` | `/feedbacks/feedbacks/` | 多维查询工单列表 |
  | 反馈核心 | `getFeedbackDetail` | `GET` | `/feedbacks/feedbacks/${id}/` | 获取单张工单完整数据 |
  | 反馈核心 | `changeFeedbackStatus`| `PATCH`| `/feedbacks/feedbacks/${id}/status/` | 修改工单流转状态 |
  | 反馈核心 | `voteFeedback` | `POST` | `/feedbacks/feedbacks/${id}/vote/` | 用户对需求点赞投票 |
  | 反馈互动 | `getFeedbackReplies`| `GET` | `/feedbacks/feedbacks/${id}/replies/` | 获取工单评论回复盖楼 |
  | 反馈互动 | `createFeedbackReply`| `POST` | `/feedbacks/feedbacks/${id}/replies/` | 发送回复 |
  | 邮件系统 | `getEmailTemplateList`| `GET` | `/feedbacks/email-templates/` | 获取邮件通知模板 |
  | 邮件系统 | `resendEmail` | `POST` | `/feedbacks/email-logs/${id}/resend/`| 失败邮件重新投递 |
  | 系统健康 | `getSystemHealth` | `GET` | `/feedbacks/health/` | 检测整体系统与 DB 状态 |
  | 系统健康 | `getRedisStatus` | `GET` | `/feedbacks/health/redis/` | 读取 Redis 内存占用与连接数 |
  | 软件版本 | `getSoftwareVersionList`| `GET` | `/feedbacks/software-versions/` | 获取版本迭代流水 |
  | 软件版本 | `releaseSoftwareVersion`| `POST`| `/feedbacks/software-versions/${id}/release/` | 正式发布新版本 |

### 7.5 依赖状态与数据模型
- **模型文件**: `src/types/feedback.ts`
  - 工单状态: `FeedbackStatus = 'submitted' | 'reviewing' | 'confirmed' | 'in_progress' | 'resolved' | 'closed' | 'rejected' | 'duplicate'`
  - 优先级: `FeedbackPriority = 'critical' | 'high' | 'medium' | 'low'`
  - 反馈类型: `FeedbackType = 'bug' | 'feature' | 'improvement' | 'question' | 'other'`

---

## 8. license (授权与证书许可管理)

### 8.1 真实代码位置与组件清单
- **视图目录**: `src/views/license/`
- **页面组件清单**:
  - **许可证方案 (Plans)**:
    - `src/views/license/plans/index.vue`: 商业计划列表（展示类型、支持最大机器数、有效期、方案状态）。
    - `src/views/license/plans/create.vue`: 新建方案。
    - `src/views/license/plans/edit.vue`: 编辑方案。
    - `src/views/license/plans/detail.vue`: 方案详情。
  - **许可证密钥管理 (Licenses)**:
    - `src/views/license/licenses/index.vue`: 许可证实例主表（复合查询、复制密钥、下载证书、撤销、延期）。
    - `src/views/license/licenses/create.vue`: 签发许可证。
    - `src/views/license/licenses/edit.vue`: 编辑许可证参数。
    - `src/views/license/licenses/detail.vue`: 许可证使用详情。
  - **机器硬件指纹绑定 (Machines)**:
    - `src/views/license/machines/index.vue`: 终端机器绑定记录、硬件指纹识别与封禁。
    - `src/views/license/machines/detail.vue`: 机器详细特征与激活历史。
  - **激活流水 (Activations)**:
    - `src/views/license/activations/index.vue`: 许可证联网激活日志、IP/时间戳记录、手动下线（Deactivate）。
    - `src/views/license/activations/detail.vue`: 激活单次详情。
  - **安全审计日志 (Audit Logs)**:
    - `src/views/license/audit-logs/index.vue`: 证书全生命周期审计流水。
    - `src/views/license/audit-logs/detail.vue`: 变更前后 Diff 追溯。
  - **授权分析大盘 (Dashboard)**:
    - `src/views/license/dashboard/index.vue`: 授权激活趋势与收入报表统计看板。

### 8.2 业务职责与功能概述
- 负责端侧与离线商业软件的核心 License 知识产权保护与授权分发。
- 支持单条与批量生成证书密钥（Key）、方案复制（Duplicate）、证书格式（Blob: JSON / TXT / XML）下载。
- 支持硬件防伪绑定（根据 Machine ID, MAC, CPU 等硬件哈希），支持超限阻止、有效期延展（Extend）及证书主动撤销（Revoke）。

### 8.3 路由挂载
- **挂载模式**: 动态后端路由。
- **页面路径**:
  - `/license/licenses`: 许可证实例
  - `/license/plans`: 商业方案
  - `/license/machines`: 机器绑定
  - `/license/activations`: 激活流水
  - `/license/audit-logs`: 审计日志
  - `/license/dashboard`: 授权统计大盘
- **权限标识**: `hasPerms("license:view")` 等，无权限强制踢回 `/dashboard`。

### 8.4 接口与通信契约
- **API 模块**: `src/api/modules/license.ts` (路由前缀 `/licenses/admin/...` 及 `/licenses/statistics/...`)
- **核心接口汇总**:
  | 业务类别 | 函数名 | 方法 | 路径 | 参数与说明 |
  |---|---|---|---|---|
  | 方案管理 | `getPlanList` | `GET` | `/licenses/admin/plans/` | 获取方案列表 |
  | 方案管理 | `createPlan` | `POST` | `/licenses/admin/plans/` | 创建方案（试用、订阅、买断） |
  | 方案管理 | `duplicatePlan` | `POST` | `/licenses/admin/plans/${id}/duplicate/` | 一键复制克隆方案 |
  | 许可证 | `getLicenseList` | `GET` | `/licenses/admin/licenses/` | 列表查询（按应用、计划、状态、签发时间排序） |
  | 许可证 | `createLicense` | `POST` | `/licenses/admin/licenses/` | 签发单个许可证 |
  | 许可证 | `batchCreateLicenses`| `POST` | `/licenses/admin/licenses/batch/` | `{ quantity, ... }` 批量签发 |
  | 许可证 | `downloadLicense` | `GET` | `/licenses/admin/licenses/${id}/download/` | `responseType: 'blob'`, 导出证书文件 |
  | 许可证 | `revokeLicense` | `POST` | `/licenses/admin/licenses/${id}/revoke/` | `{ reason: string }` 撤销许可证 |
  | 许可证 | `extendLicense` | `POST` | `/licenses/admin/licenses/${id}/extend/` | `{ days: number }` 延长有效期 |
  | 许可证 | `batchRevokeLicenses`| `POST`| `/licenses/admin/licenses/batch_operation/`| 批量撤销 |
  | 机器绑定 | `getMachineBindingList`| `GET`| `/licenses/admin/machine-bindings/` | 查询终端设备绑定 |
  | 机器绑定 | `blockMachineBinding` | `POST`| `/licenses/admin/machine-bindings/${id}/block/` | 封锁机器指纹 |
  | 激活记录 | `getActivationList` | `GET` | `/licenses/admin/activations/` | 激活历史流水 |
  | 激活记录 | `deactivateActivation`| `POST`| `/licenses/admin/activations/${id}/deactivate/`| 强制反激活下线 |
  | 审计日志 | `getAuditLogList` | `GET` | `/licenses/admin/audit-logs/` | 审计留痕追溯 |
  | 统计报表 | `getActivationTrend` | `GET` | `/licenses/statistics/activation-trend/` | 激活走势 |
  | 统计报表 | `getRevenueReport` | `GET` | `/licenses/statistics/revenue-report/` | 收入转化走势 |

### 8.5 依赖状态与数据模型
- **Pinia Store**: `useLicenseStore` (`src/store/modules/license.ts`)
  - 维持 `licenses`、`plans`、`machineBindings`、`activations`、`auditLogs`、`statistics`。
- **数据模型 (`src/types/license.ts`)**:
  - 许可证状态: `LicenseStatus = 'generated' | 'activated' | 'suspended' | 'revoked' | 'expired'`
  - 计划类型: `PlanType = 'trial' | 'subscription' | 'perpetual'`

### 8.6 关键业务流程与交互
1. **多格式证书二进制导出**: `handleDownloadLicense` 调用后通过 `axios` 的 `responseType: "blob"` 接收二进制流，浏览器端动态创建虚拟锚点触发客户端另存为。
2. **弹窗输入强制校验**: 撤销必须弹出 `ElMessageBox.prompt` 录入撤销原因；延期必须输入正整数天数（正则 `/^\d+$/` 校验），提交服务端更新 `new_expiry`。

---

## 9. login (登录鉴权与重定向)

### 9.1 真实代码位置与组件清单
- **视图目录**: `src/views/login/`
- **文件清单**:
  - `src/views/login/index.vue`: 登录页面 SFC，整合背景动效、多语言国际化下拉切换、暗黑模式切换、登录表单、键盘回车监听。
  - `src/views/login/utils/motion.ts`: 基于 Vue 3 函数式动画组件（封装 Transition 与动画延迟，实现表单控件级联入场动画）。
  - `src/views/login/utils/rule.ts`: 账号和密码的前端表单校验规则集。
  - `src/views/login/utils/static.ts`: 登录背景矢量图（Wave）、插画（Illustration）、头像占位（Avatar）静态资源引用。
- **关联基础设施**:
  - `src/router/index.ts`: 全局路由导航守卫 `router.beforeEach`、白名单机制。
  - `src/router/utils.ts`: 动态路由初始化引擎 `initRouter()`。
  - `src/store/modules/user.ts`: 用户鉴权状态 Pinia Store。
  - `src/utils/auth.ts`: Token 与凭证存储规范（Cookies 与 LocalStorage 联动）。
  - `src/api/user.ts`: 基础鉴权 API。

### 9.2 业务职责与功能概述
- 负责系统的登录鉴权认证总入口。
- 用户输入账密通过安全正则校验后，调用 `/auth/login/` 交换 JWT Token（`token` 与 `refresh_token`）。
- 登录成功后，触发动态权限路由树加载（`initRouter`），将后端路由表动态挂载进 Vue Router，并重定向至具备访问权限的第一个顶级菜单或上次重定向前的来源路径。

### 9.3 路由挂载与白名单
- **静态路由注册 (`src/router/modules/remaining.ts`)**:
  ```ts
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101
    }
  }
  ```
- **路由守卫拦截链 (`src/router/index.ts`)**:
  - 白名单: `const whiteList = ["/login"];`
  - 若已存在登录态（Cookie 中存在 `multipleTabsKey` 且 LocalStorage 存在 `userInfo`）：
    - 访问 `/login` 时，调用 `toCorrectRoute()` 拦截并保持在当前页，禁止重复登录。
    - 页面刷新且 `wholeMenus.length === 0` 时，触发 `initRouter()` 重新拉取动态路由。
  - 若未登录且访问非白名单页面，清空 Token 并通过 `next({ path: "/login" })` 强制重定向至登录页。

### 9.4 接口与通信契约
- **API 文件**: `src/api/user.ts`
  | 函数名 | 方法 | 路径 | 载荷 | 返回契约 |
  |---|---|---|---|---|
  | `getLogin` | `POST` | `/auth/login/` | `{ username, password }` | `ApiResponse<LoginResponseData>` |
  | `refreshTokenApi` | `POST` | `/auth/refresh/` | `{ refresh: string }` | `ApiResponse<RefreshTokenResponseData>` |
- **响应体数据结构 (`LoginResponseData`)**:
  ```ts
  {
    token: string;          // 业务访问 Access Token
    refresh_token: string;  // 用于静默续期的 Refresh Token
    user: {
      id: number;
      username: string;
      email: string;
      is_admin: boolean;
      is_super_admin: boolean;
      is_member: boolean;
      tenant: number;
      roles?: string[];
      avatar?: string;
    }
  }
  ```

### 9.5 依赖状态与存储模型
- **Pinia Store**: `useUserStore` (`src/store/modules/user.ts`)
  - `state`:
    - `id`, `username`, `nickname`, `email`, `avatar`
    - `is_admin`, `is_super_admin`, `is_member`
    - `roles`: 角色判定逻辑：`user.is_super_admin ? "super_admin" : user.is_admin ? "admin" : "member"`
    - `permissions`: 默认初始化 `["*:*:*"]`
  - `actions`:
    - `loginByUsername(data)`: 登录、存入 LocalStorage (`access_token`, `refresh_token`, `user_info`)、调用 `setToken(userData)` 写入 Cookies。
    - `logOut()`: 彻底清除本地 Token、清空路由表（`resetRouter`）、清空多标签页（MultiTags）、重定向到 `/login`。
    - `handRefreshToken(data)`: 静默刷新 Token。
- **表单校验规则 (`src/views/login/utils/rule.ts`)**:
  - 密码强规则正则:
    ```ts
    export const REGEXP_PWD =
      /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;
    ```
    （要求 8-18 位，数字、字母、特殊符号组合，严禁纯单一字符集或中文字符）。

### 9.6 关键业务流程与交互
1. **防抖与键盘监听**:
   - 使用 `@pureadmin/utils` 的 `debounce` 封装登录事件 `immediateDebounce`（1000ms 防抖）。
   - 通过 `@vueuse/core` 的 `useEventListener` 监听全局 `Enter` 与 `NumpadEnter` 回车键提交登录。
2. **登录推进链**:
   - 表单校验通过 -> `useUserStoreHook().loginByUsername` 写入 Token -> 调用 `initRouter()` 异步获取后端菜单路由 -> 路由就绪后调用 `router.push(getTopMenu(true).path)` -> 弹出成功提示并解除禁用状态。

---

## 调研总结与架构一致性评估

通过对 Part A 的 9 个业务模块的完整静态逆向比对，总结出系统呈现出高度统一的工程设计模式：
1. **分层严格**: 视图层（`src/views/`）专注交互展示；全局状态层（`src/store/modules/`）专注跨组件数据流与异步动作响应；接口层（`src/api/modules/`）严格基于封装后的 `http`（Axios 单例）进行强类型通信。
2. **RBAC 鉴权机制清晰**:
   - 页面级：基于静态白名单与动态后端路由 (`/menus/admin/routes/`)，结合 `userStore.is_super_admin` 与 `to.meta.roles`。
   - 按钮级：统一通过 `hasPerms` 工具函数和 `userStore.is_super_admin` 双轨制进行细粒度控制。
3. **交互规范完备**: 表格多选、复合条件防抖检索、二次确认弹窗、强类型 TypeScript 约束及完备的国际化（i18n）覆盖。
