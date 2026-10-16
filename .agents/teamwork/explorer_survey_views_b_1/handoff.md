# Handoff Report — Part B 业务模块静态逆向调研 (explorer_survey_views_b_1)

## 1. Observation (客观观察事实)

通过对 `lipeaks_admin` 代码库的静态逆向分析，确认 Part B 范围全部 8 个模块的真实代码实现细节如下：

1. **模块 10: 会员管理 (member)**
   - 视图代码位于 `src/views/member/`，包含 `index.vue` (764 行)、`detail.vue` (606 行)、`create.vue` (129 行)、`edit.vue` (184 行)。
   - 业务组件位于 `src/components/MemberManagement/`，包含 `MemberForm.vue`、`MemberStatusTag.vue`、`AvatarUpload.vue`、`CustomerRelationForm.vue`、`ConfirmDialog.vue`，并引入了 `src/components/OrderManagement/MemberOrderList.vue`。
   - 接口契约位于 `src/api/modules/member.ts` (287 行)，声明了 `getMemberList`、`getMemberDetail`、`createMember`、`updateMember`、`partialUpdateMember`、`deleteMember`、`bulkUpdateMembers`、`bulkDeleteMembers`、`uploadMemberAvatar`、`getMemberCustomerRelations`、`createMemberCustomerRelation`、`deleteMemberCustomerRelations`、`setPrimaryCustomerRelation`。
   - 状态模型位于 `src/types/member.ts` 与 `src/store/modules/member.ts`，权限控制为 `hasManagePermission = computed(() => userStore.is_super_admin || hasPerms("member:manage"))` 与 `isSuperAdmin = computed(() => userStore.is_super_admin)`。

2. **模块 11: 动态菜单配置 (menu)**
   - 视图代码位于 `src/views/menu/index.vue` (1021 行)，内嵌 `ConfirmDialog.vue` 与 `MenuForm.vue`。
   - 页面级权限直接由代码守卫：`if (!isSuperAdmin.value) { ElMessage.error("无权限访问此页面"); router.push("/dashboard"); }`。
   - 按钮级权限全面使用指令 `v-perms="['super_admin']"`。
   - 核心能力：表格模式与树形模式双向切换、`el-tree` 拖拽节点重排并在 `handleDragEnd` 中自动更新 `parent_id`、JSON 导入（`FileReader` 解析 + `/menus/import/`）与导出（`Blob`）、级联删除（`/menus/{id}/?cascade=true`）、状态切换（`/menus/{id}/toggle_status/`）。
   - 接口契约位于 `src/api/modules/menu.ts` (232 行)，定义了 `getMenuList`, `getMenuTree`, `getMenuDetail`, `createMenu`, `updateMenu`, `deleteMenu`, `toggleMenuStatus`, `importMenus`, `exportMenus`, `getUserMenus`, `assignUserMenus`。

3. **模块 12: 消息与系统通知 (notification)**
   - 视图代码位于 `src/views/notification/`，包含 `list/index.vue` (505 行)、`editor/index.vue` (384 行)、`detail/index.vue` (581 行)。
   - 业务逻辑采用 Composables 架构：`src/composables/useNotification.ts` (`useNotificationList`, `useNotificationDetail`, `useNotificationActions`) 与 `src/composables/useApplication.ts` (`useApplicationSelector`)。
   - 核心状态机：`draft`（草稿，支持编辑、发布、删除、增删成员）、`published`（已发布，支持归档、统计已读未读率）、`archived`（已归档，历史封存）。
   - 触达范围：`tenant`（租户广播）、`application`（关联应用广播）、`members`（特定成员定向名单）。
   - 接口契约位于 `src/api/modules/notification.ts` (166 行)，包含 `getNotificationList`, `createNotification`, `getNotificationDetail`, `updateNotification`, `deleteNotification`, `publishNotification`, `archiveNotification`, `getNotificationRecipients`, `addNotificationRecipients`, `removeNotificationRecipients`, `getNotificationStatistics`。

4. **模块 13: 订单与交易流转 (order)**
   - 视图代码位于 `src/views/order/`，包含 `index.vue` (518 行)、`detail.vue` (243 行)、`create.vue` (76 行)、`edit.vue` (107 行)、`statistics.vue` (481 行)。
   - 业务组件位于 `src/components/OrderManagement/`，包含 `OrderForm.vue`, `OrderDetail.vue`, `OrderFilter.vue`, `OrderStatusTag.vue`, `OrderHistory.vue`, `OrderChangeLog.vue`, `OrderVersionCompare.vue`, `ImportDialog.vue`, `BatchUpdateDialog.vue`。
   - 业务特性：涵盖文档翻译/口译/校对/本地化等商务字段、客户总额与外包译员费用实时计算毛利/毛利率、全流程历史快照比对（`OrderVersionCompare`）与一键版本还原（`restoreOrderVersion`）、Excel 导入与范围导出、统计大屏（周/月/年环比增长率）。
   - 接口契约位于 `src/api/modules/order.ts` (272 行)。

5. **模块 14: 权限规则与分配 (permission)**
   - 视图代码位于 `src/views/permission/`，包含 `page/index.vue` (67 行)、`button/index.vue` (100 行)、`button/perms.vue` (110 行)。
   - 页面级角色鉴权：`page/index.vue` 演示角色切换、清理 `storageLocal().removeItem("async-routes")`、调用 `initRouter()` 重载路由树。
   - 按钮级双轨体系：
     - `button/index.vue`：基于路由 `meta.auths`，提供 `<Auth>`, `hasAuth`, `v-auth` 三种形式。
     - `button/perms.vue`：基于登录态 `userStore.permissions`，提供 `<Perms>`, `hasPerms`, `v-perms` 三种形式，支持 `*:*:*` 超管通配。

6. **模块 15: 多租户管理体系 (tenant)**
   - 视图代码位于 `src/views/tenant/`，包含 `index.vue` (563 行)、`detail.vue` (651 行)、`create.vue` (90 行)、`edit.vue` (119 行)。
   - 核心组件位于 `src/components/TenantManagement/` (`TenantForm.vue`, `TenantQuotaForm.vue`, `QuotaProgress.vue`, `ConfirmDialog.vue`)。
   - 严格超管守卫：所有页面入口校验 `if (!isSuperAdmin.value) { ElMessage.error("无权限访问此页面"); router.push("/dashboard"); }`。
   - 租户管理：包含状态机（`active`, `suspended`, `deleted`）、状态切换（`/suspend/`, `/activate/`）、资源配额监管（`max_users`, `max_admins`, `max_storage_mb`, `max_products` 与已用存储监控）、租户下用户检索（`/users/`）。
   - 接口契约位于 `src/api/modules/tenantManagement.ts` (161 行) 与 `src/api/modules/tenant.ts` (297 行)。

7. **模块 16: 引导页/欢迎页 (welcome)**
   - 视图代码位于 `src/views/welcome/index.vue` (10 行)，定义了 `name: "Welcome"` 并渲染 `<h1>Lipeaks_admin</h1>`。
   - 静态路由挂载于 `src/router/modules/home.ts`，重定向自 `/`，`meta.rank: 0`。
   - 路由守卫拦截：在 `src/router/index.ts` 第 166-168 行，若环境变量 `VITE_HIDE_HOME === "true"` 且用户直接访问 `/welcome`，系统强制重定向至 `/error/404`。

8. **模块 17: 全局异常处理 (error)**
   - 视图代码位于 `src/views/error/`，包含 `403.vue` (28 行)、`404.vue` (10 行)、`500.vue` (20 行)。
   - 统一封装通用异常组件 `src/components/ErrorHandling/ErrorPage.vue` (406 行)。
   - 静态路由挂载于 `src/router/modules/error.ts`。
   - 路由守卫拦截：在 `src/router/index.ts` 第 162-164 行，若当前登录用户角色不满足目标路由的 `meta.roles`，强制重定向至 `/error/403`。
   - 业务容错行为：403 提供唤起邮件联系管理员；500 提供一键重新加载（`window.location.reload()`）并展示错误代码与发生时间戳。

---

## 2. Logic Chain (推理链条)

1. **动态路由 vs 静态路由分层**：
   - 观察到 `src/router/index.ts` 仅导入 `src/router/modules/` 中的静态路由（`home.ts`, `error.ts`, `errorExample.ts`, `remaining.ts`）；
   - `src/router/utils.ts` 第 34 行配置了 `const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}")`，并通过 `initRouter()` 从后端接口 `/menus/admin/routes/` 动态获取异步路由；
   - 由此推导：`welcome` 与 `error` 属于编译时静态路由，而 `member`, `menu`, `notification`, `order`, `permission`, `tenant` 均属于运行时由后端权限服务派发的动态加载组件。

2. **权限控制体系分层**：
   - 观察到 `menu` 模块中操作按钮统一加装 `v-perms="['super_admin']"`；
   - 观察到 `permission/button/perms.vue` 中明确支持 `permissions[0] === '*:*:*'` 代表全量通配；
   - 观察到 `tenant` 与 `menu` 视图顶部均显式判断 `userStore.is_super_admin` 并做阻断跳转；
   - 由此推导：系统存在“全局超级管理员角色判断”、“基于登录态 permissions 的细粒度权限码校验”以及“基于动态路由元信息 auths 校验”三重防线。

3. **数据一致性与生命周期管理**：
   - 观察到 `notification` 模块对 `scope === 'members'` 强制拦截一键发布，必须先建立接收者名单；
   - 观察到 `order` 模块通过后端快照生成独立的 `history_count`，并在详情页按需渲染版本对比与恢复；
   - 观察到 `tenant` 模块将配额更新与配额实时使用量（`/usage/`）解耦；
   - 证明系统的业务模块具有高度严密的领域模型（Domain Model）设计，并非简单的无状态 CRUD。

---

## 3. Caveats (局限与边界)

1. 本次调研严格基于本地真实代码库静态源码进行逆向剖析，未运行外部生产后端服务，所有 API 接口返回契约以对应 TypeScript 类型定义（`src/types/`）与请求调用代码为准。
2. `welcome/index.vue` 目前源码实现为占位性质的简单落地页（`<h1>Lipeaks_admin</h1>`），其业务价值主要体现在首屏重定向、多 Tab 初始化挂载与 `VITE_HIDE_HOME` 路由守卫拦截。
3. `permission` 模块在前端不仅充当鉴权底层基础设施（`utils/auth.ts`, `router/utils.ts`），同时其在 `views/permission/` 中的组件充当了权限模式验证与测试沙盒（Permission Sandbox）。

---

## 4. Conclusion (调研结论)

Part B 的 8 个业务视图模块逆向深度调研已全景完成，完全满足权威需求文件要求。调研成果已写入结构化报告文档：
- **报告路径**：`d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_views_b_1\survey_views_b.md`
- **成果价值**：全景覆盖每个模块的真实源码位置、组件依赖、动态/静态路由挂载点、API 接口调用方法与路径、Pinia Store 状态模型、业务交互与状态流转生命周期，以及精确的页面级与按钮级权限控制实现细节，可直接用于下游编写工程规范级业务文档。

---

## 5. Verification Method (验证方法)

1. **报告存在性与完整度验证**：
   - 检查 `d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_views_b_1\survey_views_b.md` 是否完整包含第 10 到第 17 章节，且无任何占位符。
2. **源码引用绝对准确性验证**：
   - 验证 `src/views/member/index.vue` 包含 `hasManagePermission` 与 `remoteTenantSearch`；
   - 验证 `src/views/menu/index.vue` 包含 `toggleDisplayMode`, `handleDragEnd`, `importMenusAction`；
   - 验证 `src/views/notification/list/index.vue` 引入 `useNotificationList`；
   - 验证 `src/views/order/detail.vue` 包含 `OrderVersionCompare` 与 `OrderHistory`；
   - 验证 `src/views/permission/button/perms.vue` 引用 `hasPerms` 与 `v-perms`；
   - 验证 `src/views/tenant/detail.vue` 包含 `QuotaProgress` 与 `fetchTenantQuotaUsage`；
   - 验证 `src/router/modules/home.ts` 与 `src/views/welcome/index.vue` 对应；
   - 验证 `src/router/modules/error.ts` 与 `src/components/ErrorHandling/ErrorPage.vue` 对应。
