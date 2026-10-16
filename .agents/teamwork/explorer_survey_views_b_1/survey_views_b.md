# 业务视图模块静态逆向深度调研报告 (Part B: 8个业务模块)

**调研基准路径**：`d:\Github\lipeaks_admin\`  
**报告产出时间**：2026-10-16  
**调研模式**：基于源码绝对事实静态逆向（Strict Code Ground-Truth Only）  
**覆盖模块范围**：
10. `member` (会员/用户中心)
11. `menu` (动态菜单配置)
12. `notification` (消息与系统通知)
13. `order` (订单与交易流转)
14. `permission` (权限规则与分配)
15. `tenant` (多租户管理体系)
16. `welcome` (引导页/欢迎页)
17. `error` (全局异常处理：403, 404, 500)

---

## 10. 会员/用户中心 (member)

### 10.1 真实代码位置与组件清单
- **视图目录**：`src/views/member/`
  - `src/views/member/index.vue`：会员主列表视图（含高级筛选、多租户搜索、分页、对话框内嵌创建与编辑表单、批量删除）
  - `src/views/member/detail.vue`：会员详情视图（基本信息卡片、关联客户关系列表、关联订单列表、头像管理、密码重置）
  - `src/views/member/create.vue`：独立页面级会员创建视图（内嵌 `MemberForm` 并处理提交与路由回跳）
  - `src/views/member/edit.vue`：独立页面级会员编辑视图（详情加载与表单数据同步更新）
- **核心依赖业务组件**：`src/components/MemberManagement/`
  - `MemberForm.vue`：会员创建/编辑复用表单组件
  - `MemberStatusTag.vue`：会员状态语义化徽章组件（active: 绿色/成功, suspended: 橙色/警告, inactive: 灰色/信息）
  - `AvatarUpload.vue`：头像上传组件（支持本地预览与 FormData 封装）
  - `CustomerRelationForm.vue`：会员-客户关系关联对话框表单
  - `ConfirmDialog.vue`：统一二次确认操作对话框
  - `src/components/OrderManagement/MemberOrderList.vue`：会员名下历史订单列表子组件
- **状态层 (Store)**：`src/store/modules/member.ts`（配合 `useMemberStoreHook`）、`src/store/modules/tenant.ts`、`src/store/modules/user.ts`
- **接口层 (API)**：`src/api/modules/member.ts`
- **类型定义 (Types)**：`src/types/member.ts`

### 10.2 业务职责与功能概述
会员模块管理系统面向租户级与平台级的会员档案与用户关系：
1. **会员档案管理**：涵盖用户名、昵称、真实姓名（姓/名）、邮箱、手机号、微信号、状态、所属租户及备注信息的统一维护。
2. **多租户数据隔离与超管穿透**：普通租户管理员仅管理当前租户成员；超级管理员（`is_super_admin`）可使用远程搜索下拉框按租户检索成员。
3. **CRM 客户关系映射**：维护会员与企业的关联关系（`MemberCustomerRelation`），支持为一个会员绑定多个客户档案并指定主要客户（`setPrimaryCustomerRelation`）。
4. **安全与凭证管理**：支持重置会员密码（调用 `partialUpdateMember` 传入 `password` 与 `confirm_password`）。
5. **多媒体资产**：支持会员独立头像异步上传（`multipart/form-data` 至 `/admin/members/{id}/avatar/upload/`）。
6. **业务上下游协同**：在会员详情页中一站式穿透展示该会员在交易中心的关联订单。

### 10.3 路由挂载
- **挂载模式**：动态路由（由后端 `/menus/admin/routes/` 返回并由前端 `modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}")` 动态解析加载）。
- **路由规范**：
  - 列表页：`path: "/member/index"`, `name: "MemberIndex"`, `meta: { title: "menus.memberManagement", icon: "ep:user" }`
  - 详情页：`path: "/member/detail/:id"`, `name: "MemberDetail"`, `meta: { title: "menus.memberDetail", hiddenTag: true, showLink: false }`
  - 创建页：`path: "/member/create"`, `name: "MemberCreate"`, `meta: { title: "menus.createMember", showLink: false }`
  - 编辑页：`path: "/member/edit/:id"`, `name: "MemberEdit"`, `meta: { title: "menus.editMember", hiddenTag: true, showLink: false }`

### 10.4 接口与通信契约 (`src/api/modules/member.ts`)
| 接口函数 | 请求方法 | 路由地址 | 请求参数 | 契约返回结构 | 业务说明 |
|---|---|---|---|---|---|
| `getMemberList` | `GET` | `/admin/members/` | `MemberListParams` (`search`, `status`, `tenant_id`, `page`, `page_size`, `sort_by`, `sort_order`) | `PaginationResponse<Member>` | 分页获取会员列表 |
| `getMemberDetail` | `GET` | `/admin/members/{id}/` | URL 路径参数 `id: number` | `ApiResponse<Member>` | 获取指定会员完整信息 |
| `createMember` | `POST` | `/admin/members/` | `MemberCreateUpdateParams` (`username`, `nick_name`, `email`, `password`, `confirm_password`, `phone`, `status`, `notes` 等) | `ApiResponse<Member>` | 新增会员账号 |
| `updateMember` | `PUT` | `/admin/members/{id}/` | `id: number`, `MemberCreateUpdateParams` | `ApiResponse<Member>` | 完整覆盖更新会员信息 |
| `partialUpdateMember` | `PATCH` | `/admin/members/{id}/` | `id: number`, `Partial<MemberCreateUpdateParams>` | `ApiResponse<Member>` | 局部更新（包含密码重置） |
| `deleteMember` | `DELETE` | `/admin/members/{id}/` | `id: number` | `ApiResponse<any>` | 单条删除指定会员 |
| `bulkUpdateMembers` | `PUT` | `/admin/members/bulk/update/` | `{ member_ids: number[], ...fields }` | `ApiResponse<MemberBulkOperationResponse>` | 批量修改状态或所属租户 |
| `bulkDeleteMembers` | `DELETE` | `/admin/members/bulk/delete/` | `{ member_ids: number[] }` | `ApiResponse<MemberBulkOperationResponse>` | 批量物理/逻辑删除 |
| `uploadMemberAvatar` | `POST` | `/admin/members/{id}/avatar/upload/` | `FormData` (包含 `avatar` 文件对象) | `ApiResponse<MemberAvatarUploadResponse>` | 上传并关联用户头像 |
| `getMemberCustomerRelations`| `GET` | `/customers/members/relations/member-customers/?member_id={id}` | `memberId: number`, 分页参数 | `ApiResponse<any[]>` | 获取会员关联客户列表 |
| `createMemberCustomerRelation`| `POST` | `/customers/members/relations/` | `{ member_id, customer_id, role, is_primary, remarks }` | `ApiResponse<MemberCustomerRelation>` | 新增客户关系绑定 |
| `deleteMemberCustomerRelations`| `POST` | `/customers/members/relations/member-customers/delete/` | `{ member_id: number, customer_ids: number[] }` | `ApiResponse<any>` | 批量解除客户绑定 |
| `setPrimaryCustomerRelation` | `POST` | `/members/{id}/customers/{relId}/set-primary/` | `id`, `relId` | `ApiResponse<MemberCustomerRelation>` | 设为主要服务客户 |

### 10.5 依赖状态与数据模型
- **Pinia Store (`memberStore`)**：
  - `memberList: { data: Member[], total: number, page: number, pageSize: number, total_pages?: number }`
  - `currentMember: Member | null`
  - `customerRelations: MemberCustomerRelation[]`
  - `loading: { list: boolean, detail: boolean, create: boolean, update: boolean, delete: boolean, relations: boolean }`
- **核心数据模型 (`Member`)**：
  ```ts
  export interface Member {
    id: number;
    username: string;
    nick_name: string;
    email: string;
    phone?: string;
    avatar?: string;
    wechat_id?: string;
    status: "active" | "suspended" | "inactive";
    tenant_id?: number;
    tenant_name?: string;
    parent?: number | null;
    is_sub_account?: boolean;
    created_at?: string;
    last_login?: string;
    notes?: string;
  }
  ```

### 10.6 关键交互与业务生命周期
1. **加载与分页检索**：组件挂载 `onMounted` 触发 `fetchMemberList`。支持回车检索和重置。
2. **多租户隔离与动态检索**：仅 `isSuperAdmin` 渲染租户下拉框，通过 `remoteTenantSearch` 异步远程请求 `tenantStore.fetchTenantList`。
3. **弹窗与独立页面双通道**：
   - 列表页内提供轻量级对话框（`createDialog` / `editDialog`）内嵌 `MemberForm` 快速操作；
   - 亦提供独立路由页面（`create.vue` / `edit.vue`）支持复杂场景，表单提交后优先通过 `FormData` 上传头像，再跳转详情。
4. **详情页 Tab 联动**：详情页包含 `basic`（档案详情）、`relations`（客户绑定与解绑）、`orders`（历史订单）三大标签，按需动态加载数据。

### 10.7 权限控制点
- **功能级/按钮级权限判断**：
  ```ts
  const hasManagePermission = computed(() => userStore.is_super_admin || hasPerms("member:manage"));
  const isSuperAdmin = computed(() => userStore.is_super_admin);
  ```
- **权限受控操作**：
  - “创建会员”按钮：受 `hasManagePermission` 控制显示；
  - “批量删除”按钮：受 `hasManagePermission` 控制显示；
  - “租户筛选下拉框”：仅 `isSuperAdmin` 可见；
  - 详情页“编辑”、“删除”、“添加关系”、“重置密码”、“上传头像”：受 `hasManagePermission` 严格保护。

---

## 11. 动态菜单配置 (menu)

### 11.1 真实代码位置与组件清单
- **视图目录**：`src/views/menu/`
  - `src/views/menu/index.vue`：统一动态菜单管理工作台（包含平面表格模式、树形结构模式、树节点拖拽重排、配置导入导出、级联删除）
- **核心依赖业务组件**：`src/components/MenuManagement/`
  - `ConfirmDialog.vue`：菜单删除/级联删除/状态切换确认对话框
  - `MenuForm.vue`：菜单项属性配置表单（包含名称、代码、路由路径、组件映射、权限码、转场动画、元信息等）
- **状态层 (Store)**：`src/store/modules/menu.ts`、`src/store/modules/user.ts`
- **接口层 (API)**：`src/api/modules/menu.ts`
- **类型定义 (Types)**：`src/types/menu.ts`

### 11.2 业务职责与功能概述
菜单模块是系统动态路由与导航菜单的“大脑”与元数据核心：
1. **双模式展示**：提供平铺列表（`el-table` + 分页检索）与分级菜单树（`el-tree` + 树节点实时拖拽排序）的无缝切换。
2. **节点拖拽重排**：支持在树形模式下直接拖拽节点调整层级与先后顺序，并在 `node-drag-end` 时精确识别 `inner`（设为子菜单）与同级兄弟位置并自动同步更新后端。
3. **级联操作与防御**：支持单节点删除与级联删除（`cascade: true`，递归清理所有子孙菜单）。
4. **状态秒切**：支持一键启用/禁用菜单（`/menus/{id}/toggle_status/`）。
5. **配置资产化导入导出**：支持将整套菜单拓扑导出为 JSON 文件下载，或上传 JSON 配置文件批量导入并动态重建系统路由树。
6. **用户与角色授权绑定**：支持查看特定管理员的菜单授权（`getUserMenus`）并为其分配专属菜单权限（`assignUserMenus`）。

### 11.3 路由挂载
- **挂载模式**：动态路由加载，挂载在系统管理或开发配置顶层。
- **页面安全守卫**：
  ```ts
  // 非超级管理员禁止访问
  if (!isSuperAdmin.value) {
    ElMessage.error("无权限访问此页面");
    router.push("/dashboard");
  }
  ```

### 11.4 接口与通信契约 (`src/api/modules/menu.ts`)
| 接口函数 | 请求方法 | 路由地址 | 请求参数 | 契约返回结构 | 业务说明 |
|---|---|---|---|---|---|
| `getMenuList` | `GET` | `/menus/` | `MenuListParams` (`search`, `is_active`, `parent_id`, `page`, `page_size`) | `PaginationResponse<Menu>` | 分页获取平面菜单列表 |
| `getMenuTree` | `GET` | `/menus/tree/` | `{ is_active?: boolean }` | `ApiResponse<MenuTree[]>` | 获取多级嵌套菜单树 |
| `getMenuDetail` | `GET` | `/menus/{id}/` | `id: number` | `ApiResponse<Menu>` | 获取单项菜单详细配置 |
| `createMenu` | `POST` | `/menus/` | `MenuCreateUpdateParams` | `ApiResponse<Menu>` | 创建菜单或子菜单项 |
| `updateMenu` | `PUT` | `/menus/{id}/` | `id: number`, `MenuCreateUpdateParams` | `ApiResponse<Menu>` | 全量修改菜单配置与层级 |
| `patchMenu` | `PATCH` | `/menus/{id}/` | `id: number`, `Partial<MenuCreateUpdateParams>` | `ApiResponse<Menu>` | 局部更新菜单字段 |
| `deleteMenu` | `DELETE` | `/menus/{id}/` | `params: { cascade: boolean }` | `ApiResponse<any>` | 删除菜单（支持级联删除） |
| `toggleMenuStatus`| `PATCH` | `/menus/{id}/toggle_status/` | `{ is_active: boolean }` | `ApiResponse<Menu>` | 启用或禁用该菜单 |
| `batchMenus` | `POST` | `/menus/batch/` | `{ create?: [], update?: [], delete?: [] }` | `ApiResponse<{ created, updated, deleted }>` | 批量综合增删改 |
| `importMenus` | `POST` | `/menus/import/` | `FormData` 包含 JSON 配置文件 | `ApiResponse<{ imported, created, updated }>` | 批量导入菜单配置 |
| `exportMenus` | `GET` | `/menus/export/` | 无 | `Blob` (application/json) | 导出全量菜单配置 |
| `getUserMenus` | `GET` | `/menus/admins/{userId}/menus/` | `userId: number` | `ApiResponse<{ user_id, username, menus }>` | 查询用户的菜单权限分配 |
| `assignUserMenus`| `POST` | `/menus/admins/{userId}/menus/` | `{ menu_ids: number[] }` | `ApiResponse<{ assigned_menus }>` | 为用户授予菜单权限 |

### 11.5 依赖状态与数据模型
- **核心数据模型 (`Menu` / `MenuTree`)**：
  ```ts
  export interface Menu {
    id: number;
    name: string;           // 路由名称（英文字符，保持唯一）
    code: string;           // 权限标识编码
    path: string;           // 路由 URL 路径（如 /system/user）
    component: string;      // 组件路径（相对于 src/views/）
    redirect: string | null;// 重定向路径
    title: string;          // 国际化标题或菜单显示文本
    icon: string | null;    // 图标类名或 SVG 标识
    extra_icon: string | null;
    rank: number;           // 排序权重
    show_link: boolean;     // 是否在侧边栏显示
    show_parent: boolean;   // 是否显示父级
    roles: string[];        // 绑定的角色列表
    auths: string[];        // 绑定的按钮级权限码列表
    keep_alive: boolean;    // 是否开启组件缓存
    frame_src: string | null;// 外链 iframe 地址
    parent_id: number | null;// 父级菜单 ID
    is_active: boolean;     // 是否启用
  }
  export interface MenuTree extends Menu {
    children: MenuTree[];
  }
  ```

### 11.6 关键交互与业务生命周期
1. **拖拽重排链路**：
   - 用户在 `el-tree` 拖动节点完成触发 `@node-drag-end="handleDragEnd"`；
   - 根据 `dropType`（`inner` 或同级前后），动态计算新 `parent_id`；
   - 触发 `menuStore.updateMenuAction` 提交更新，若失败则自动回退并调用 `fetchMenuTree` 还原。
2. **文件上传解析链路**：
   - `handleFileChange` 捕获本地 JSON 文件；
   - 通过浏览器原生 `FileReader.readAsText` 预先验证 JSON 格式合法性，再经由 `FormData` 提交 `importMenusAction`。

### 11.7 权限控制点
- **页面级守卫**：`isSuperAdmin = computed(() => userStore.is_super_admin)`，非超管直接强制路由跳转 `/dashboard` 并提示“无权限访问此页面”。
- **按钮级权限指令**：菜单中所有高危变更操作均加装了 `v-perms="['super_admin']"` 严格指令校验：
  - 新增菜单：`v-perms="['super_admin']"`
  - 导入/导出：`v-perms="['super_admin']"`
  - 批量删除：`v-perms="['super_admin']"`
  - 列表行内编辑/删除/切换状态：`v-perms="['super_admin']"`
  - 树形节点操作（编辑、删除、添加子菜单）：`v-perms="['super_admin']"`

---

## 12. 消息与系统通知 (notification)

### 12.1 真实代码位置与组件清单
- **视图目录**：`src/views/notification/`
  - `src/views/notification/list/index.vue`：通知全量监控工作台（综合条件过滤、分页、发布/归档/删除操作）
  - `src/views/notification/editor/index.vue`：通知创建与编辑视图（支持草稿保存、一键创建并直接发布、动态表单校验）
  - `src/views/notification/detail/index.vue`：通知综合详情与统计面板（含基本元数据、正文、实时阅读率统计卡片、接收者列表与草稿期增删成员）
- **组合式函数 (Composables)**：
  - `src/composables/useNotification.ts`：包含 `useNotificationList`, `useNotificationDetail`, `useNotificationActions`, `useNotificationRecipients`
  - `src/composables/useApplication.ts`：包含 `useApplicationSelector`
- **接口层 (API)**：`src/api/modules/notification.ts`
- **类型定义 (Types)**：`src/types/notification.ts`

### 12.2 业务职责与功能概述
通知模块是系统运营与公告触达体系的核心支撑：
1. **多层级触达范围 (Scope)**：
   - **面向租户 (`tenant`)**：系统自动将该通知广播给当前租户下所有处于激活状态的会员（`Member`）；
   - **面向应用 (`application`)**：与具体应用系统绑定，向该应用涉及的租户成员定向广播；
   - **面向特定成员 (`members`)**：允许管理员在草稿期精准勾选目标成员添加至接收者白名单中。
2. **严格的生命周期状态机**：
   - **草稿 (`draft`)**：初始状态，允许自由编辑内容、变更范围、增删特定接收者，可执行发布或删除；
   - **已发布 (`published`)**：正式生效状态，内容完全冻结防篡改，系统自动开始跟踪已读/未读状态与送达率，支持归档操作；
   - **已归档 (`archived`)**：归档冻结状态，成员端不再展示。
3. **多维属性**：支持 5 种通知类型（信息、警告、错误、更新、公告）、4 级优先级（低、普通、高、紧急）、以及可选的邮件联动发送标志（`send_email`）。
4. **指标与转化追踪**：在详情视图中实时统计总接收者数（`total_recipients`）、已读数（`read_count`）、未读数（`unread_count`）及已读百分比（`read_rate`）。

### 12.3 路由挂载
- **挂载模式**：动态路由系统加载。
- **路由命名规范**：
  - 列表：`path: "/notification/list"`, `name: "NotificationList"`
  - 创建：`path: "/notification/create"`, `name: "NotificationCreate"`
  - 编辑：`path: "/notification/edit/:id"`, `name: "NotificationEdit"`
  - 详情：`path: "/notification/detail/:id"`, `name: "NotificationDetail"`

### 12.4 接口与通信契约 (`src/api/modules/notification.ts`)
| 接口函数 | 请求方法 | 路由地址 | 请求参数 | 契约返回结构 | 业务说明 |
|---|---|---|---|---|---|
| `getNotificationList` | `GET` | `/admin/notifications/` | `NotificationListParams` (`application`, `scope`, `status`, `type`, `priority`, `page`, `page_size`) | `NotificationListResponse` | 条件分页获取通知列表 |
| `createNotification` | `POST` | `/admin/notifications/` | `NotificationCreateParams` (`title`, `content`, `scope`, `application`, `notification_type`, `priority`, `send_email`) | `NotificationResponse` | 创建通知草稿 |
| `getNotificationDetail` | `GET` | `/admin/notifications/{id}/` | `id: number` | `NotificationResponse` | 获取单条通知详情及元数据 |
| `updateNotification` | `PATCH` | `/admin/notifications/{id}/` | `id: number`, `NotificationUpdateParams` | `NotificationResponse` | 更新草稿通知字段 |
| `deleteNotification` | `DELETE` | `/admin/notifications/{id}/` | `id: number` | `ApiResponse<null>` | 删除草稿通知 |
| `publishNotification`| `POST` | `/admin/notifications/{id}/publish/` | `id: number` | `NotificationResponse` | 发布通知（状态转为 published） |
| `archiveNotification`| `POST` | `/admin/notifications/{id}/archive/` | `id: number` | `NotificationResponse` | 归档通知（状态转为 archived） |
| `getNotificationRecipients`| `GET` | `/admin/notifications/{id}/recipients/` | `id: number`, 分页参数 | `NotificationRecipientListResponse` | 获取通知接收者阅读名单 |
| `addNotificationRecipients`| `POST` | `/admin/notifications/{id}/add-recipients/` | `{ member_ids: number[] }` | `NotificationRecipientsActionResponse` | 为特定成员范围通知添加人员 |
| `removeNotificationRecipients`| `POST` | `/admin/notifications/{id}/remove-recipients/` | `{ member_ids: number[] }` | `NotificationRecipientsActionResponse` | 移除已添加的成员接收者 |
| `getNotificationStatistics`| `GET` | `/admin/notifications/{id}/statistics/` | `id: number` | `NotificationStatisticsResponse` | 查询该通知阅读率与送达统计 |

### 12.5 依赖状态与数据模型
- **核心数据模型 (`Notification`)**：
  ```ts
  export interface Notification {
    id: number;
    title: string;
    content?: string;
    scope: "tenant" | "application" | "members";
    scope_display: string;
    application: number | null;
    application_name: string | null;
    notification_type: "info" | "warning" | "error" | "update" | "announcement";
    type_display: string;
    priority: "low" | "normal" | "high" | "urgent";
    priority_display: string;
    status: "draft" | "published" | "archived";
    status_display: string;
    send_email: boolean;
    recipient_count: number;
    read_count: number;
    created_at: string;
    published_at: string | null;
  }
  ```

### 12.6 关键交互与业务生命周期
1. **状态流转守卫**：
   - 列表页与详情页中，仅当 `status === 'draft'` 时显示“编辑”、“发布”、“删除”以及“添加接收者”；
   - 仅当 `status === 'published'` 时显示“归档”按钮；
   - 状态为 `archived` 时全流程锁定，仅供历史审计查看。
2. **发布前强校验**：当选择 `scope === 'members'` 时，系统禁止直接执行“创建并发布”，强制要求先创建草稿并添加接收者后再发布。

---

## 13. 订单与交易流转 (order)

### 13.1 真实代码位置与组件清单
- **视图目录**：`src/views/order/`
  - `src/views/order/index.vue`：订单主工作台（多维度复杂组合过滤、排序、批量更新、批量删除、Excel 导入与导出、统计快捷入口）
  - `src/views/order/create.vue`：新建订单视图（内嵌 `OrderForm` 并支持保存后直跳详情）
  - `src/views/order/edit.vue`：编辑订单视图（同步更新并加载最新详情）
  - `src/views/order/detail.vue`：订单全景详情工作台（集成基本详情、全量历史版本记录、差量变更日志、双版本字段对比）
  - `src/views/order/statistics.vue`：订单业务与财务统计大屏（指标卡片、周期与环比分析、服务与状态分布图表）
- **核心依赖业务组件**：`src/components/OrderManagement/`
  - `OrderForm.vue`：全量订单字段录入表单
  - `OrderDetail.vue`：订单档案详情展示
  - `OrderFilter.vue`：订单高级复合过滤器
  - `OrderStatusTag.vue`：支付与业务状态徽章
  - `OrderHistory.vue`：历史版本时间线列表与一键版本还原
  - `OrderChangeLog.vue`：订单字段级审计变更日志
  - `OrderVersionCompare.vue`：历史版本与现行版本双向差异对比器
  - `ImportDialog.vue`：Excel 订单数据批量导入与模板下载弹窗
  - `BatchUpdateDialog.vue`：批量修改订单属性对话框
- **状态层 (Store)**：`src/store/modules/order.ts`
- **接口层 (API)**：`src/api/modules/order.ts`
- **类型定义 (Types)**：`src/types/order.ts`

### 13.2 业务职责与功能概述
订单模块服务于高端翻译、本地化与语言服务业务的完整商业流转闭环：
1. **订单核心商务要素**：包含自动编码的订单编号（如 `PQ-202507-1234`）、关联客户与联系人、服务类型（文档翻译、口译、校对、本地化等）、语种对（中英、中日等）、工作量计数（字数/天数）、服务时间及交付地点。
2. **双边财务核算体系**：
   - **客户侧收据**：客户单价、客户总价（`customer_total_amount`）、支付状态（`paid`/`unpaid`/`partial`/`refunded`/`cancelled`）、支付渠道与发票状态（`issued`/`pending`/`not_required`）；
   - **供应侧支出**：外包译员姓名、译员费用（`translator_fee`）、译员单价、付款状态与结算方式；
   - **利润与毛利率动态推导**：毛利 = 客户总价 - 译员费用 - 项目费用；系统自动计算 `profit` 与 `profit_rate`。
3. **版本控制与变更审计 (Audit Trail)**：后端为每次订单修改建立独立历史快照；前端支持查看全量历史版本、单字段变更轨迹，以及在版本对比器中直观比较任意历史版本并支持“一键版本还原”（`restoreOrderVersion`）。
4. **数据资产导入导出**：支持标准 `.xlsx` 格式的订单数据导出（支持导出全部或导出选中项）、模板下载与批量导入。
5. **运营统计决策**：提供日/周/月/季度/年度与自定义日期维度的订单量、总交易额、总毛利环比指标分析与图表呈现。

### 13.3 路由挂载
- **挂载模式**：动态路由加载。
- **页面路由地址**：
  - 列表页：`path: "/order"` 或 `path: "/order/index"`
  - 创建页：`path: "/order/create"`
  - 编辑页：`path: "/order/edit/:id"`
  - 详情页：`path: "/order/detail/:id"`
  - 统计大屏：`path: "/order/statistics"`

### 13.4 接口与通信契约 (`src/api/modules/order.ts`)
| 接口函数 | 请求方法 | 路由地址 | 请求参数 | 契约返回结构 | 业务说明 |
|---|---|---|---|---|---|
| `getOrderList` | `GET` | `/orders/` | `OrderListParams` (`ordering`, `page`, `page_size`, 客户/状态/类型过滤) | `PaginationResponse<Order>` | 订单列表检索 |
| `getOrderDetail` | `GET` | `/orders/{id}/` | `id: number` | `ApiResponse<Order>` | 订单全字段详情 |
| `createOrder` | `POST` | `/orders/` | `OrderCreateUpdateParams` | `ApiResponse<Order>` | 新建订单 |
| `updateOrder` | `PUT` | `/orders/{id}/` | `id: number`, `OrderCreateUpdateParams` | `ApiResponse<Order>` | 更新订单 |
| `deleteOrder` | `DELETE` | `/orders/{id}/` | `id: number` | `ApiResponse<any>` | 软删除订单 |
| `bulkUpdateOrders` | `PUT` | `/orders/bulk/update/` | `{ order_ids: number[], ...fields }` | `ApiResponse<OrderBulkOperationResponse>` | 批量修改状态/属性 |
| `bulkDeleteOrders` | `DELETE` | `/orders/bulk/delete/` | `{ order_ids: number[] }` | `ApiResponse<OrderBulkOperationResponse>` | 批量删除指定订单 |
| `exportOrders` | `POST` | `/orders/export/` | `{ order_ids?: number[], format?: string }` | `Blob` (Excel 二进制流) | 导出订单数据文件 |
| `downloadOrderImportTemplate` | `GET` | `/orders/import/template/` | 无 | `Blob` | 下载订单导入 Excel 模板 |
| `importOrders` | `POST` | `/orders/import_data/` | `FormData` 包含 `file` 与 `update_existing` 标识 | `ApiResponse<OrderImportResponse>` | 批量导入 Excel 订单 |
| `getOrderStatistics` | `GET` | `/orders/statistics/` | `{ period?, start_date?, end_date? }` | `ApiResponse<OrderStatistics>` | 获取统计图表与财务摘要 |
| `getOrderReminders` | `GET` | `/orders/reminders/` | `{ days?, limit? }` | `ApiResponse<OrderReminders>` | 临期交付与催款提醒 |
| `getOrderHistoryList`| `GET` | `/orders/{id}/history/` | `id: number`, 分页参数 | `PaginationResponse<OrderHistory>` | 获取订单的历史变更版本快照 |
| `restoreOrderVersion`| `POST`| `/orders/{id}/history/{histId}/restore/` | `id`, `histId` | `ApiResponse<Order>` | 回滚订单至某一历史版本 |

### 13.5 依赖状态与数据模型
- **核心数据模型 (`Order`)**：
  ```ts
  export interface Order {
    id: number;
    order_number: string;
    customer: number;
    customer_name: string;
    customer_contact?: number;
    service_type: "文档翻译" | "口译服务" | "校对服务" | "本地化服务" | "其他";
    language: string;
    customer_total_amount: string;
    translator?: string;
    translator_fee?: string;
    profit?: number;
    profit_rate?: number;
    payment_status: "paid" | "unpaid" | "partial" | "refunded" | "cancelled";
    invoice_status?: "issued" | "pending" | "not_required";
    history_count?: number;
    created_at: string;
  }
  ```

### 13.6 关键交互与业务生命周期
1. **多级版本对比与回滚闭环**：
   - 详情页检测 `order.history_count > 0` 激活 `history`、`changeLog`、`versionCompare` 标签页；
   - 点击任意历史记录的“对比版本”，动态载入 `selectedHistoryId` 并渲染字段高亮差异；
   - 点击“恢复此版本”触发 `restoreOrderVersion`，确认后无缝刷新当前最新订单并切回 `basic` 视图。
2. **批量选定与范围导出**：用户勾选多条记录时，工具栏动态统计选定行数，并支持局部选定导出（只传 `order_ids`）或全量过滤导出。

---

## 14. 权限规则与分配 (permission)

### 14.1 真实代码位置与组件清单
- **视图目录**：`src/views/permission/`
  - `src/views/permission/page/index.vue`：页面/角色级动态权限演示与角色模拟切换视图
  - `src/views/permission/button/index.vue`：路由级按钮权限（Route Auths）三种鉴权范式验证组件
  - `src/views/permission/button/perms.vue`：用户登录态级按钮权限（User Perms）三种鉴权范式验证组件
- **路由鉴权与工具层**：`src/router/utils.ts`（包含 `hasAuth`, `getAuths`, `initRouter`）、`src/utils/auth.ts`（包含 `hasPerms`）
- **状态层 (Store)**：`src/store/modules/permission.ts`、`src/store/modules/user.ts`

### 14.2 业务职责与功能概述
权限模块构成了整个管理系统基于角色的访问控制（RBAC）与精细化按钮鉴权的理论基准与测试验证中心：
1. **页面级角色权限路由流转 (`page/index.vue`)**：
   - 演示不同角色（`admin` 管理员角色 vs `common` 普通角色）访问权限；
   - 切换角色后自动清除本地缓存路由（`storageLocal().removeItem("async-routes")`），清空所有已缓存页面（`clearAllCachePage()`），并重新调用 `initRouter()` 重新向后端拉取并注入该角色的动态路由与侧边栏菜单。
2. **路由定义级按钮权限体系 (`button/index.vue`)**：
   - 数据源：来源于路由配置元数据 `meta.auths`（如 `["permission:btn:add", "permission:btn:edit", "permission:btn:delete"]`）；
   - 三种判断方式：
     - **组件包裹式**：`<Auth value="...">` / `<Auth :value="[...]">`
     - **脚本函数式**：`v-if="hasAuth('permission:btn:add')"`
     - **指令式**：`v-auth="'permission:btn:add'"`
3. **用户登录态级按钮权限体系 (`button/perms.vue`)**：
   - 数据源：来源于用户成功登录后存储在 `userStore.permissions`（或 `userInfo.permissions`）中的全局权限编码列表；
   - 超管通配符支持：当首项为 `*:*:*` 时，代表具备系统全量按钮级无阻碍操作特权；
   - 三种判断方式：
     - **组件包裹式**：`<Perms value="...">` / `<Perms :value="[...]">`
     - **脚本函数式**：`v-if="hasPerms('permission:btn:add')"`
     - **指令式**：`v-perms="'permission:btn:add'"`

### 14.3 路由挂载
- **挂载配置**（在 `mock/asyncRoutes.ts` 与后端路由契约中定义）：
  - 顶级父目录：`path: "/permission"`, `meta: { title: "menus.purePermission", icon: "ep:lollipop", rank: 10 }`
  - 页面权限：`path: "/permission/page/index"`, `name: "PermissionPage"`, `meta: { title: "menus.purePermissionPage", roles: ["admin", "common"] }`
  - 按钮权限目录：`path: "/permission/button"`, `meta: { title: "menus.purePermissionButton", roles: ["admin", "common"] }`
    - 路由按钮：`path: "/permission/button/router"`, `name: "PermissionButtonRouter"`, `component: "permission/button/index"`, `meta: { title: "menus.purePermissionButtonRouter", auths: ["permission:btn:add", "permission:btn:edit", "permission:btn:delete"] }`
    - 登录按钮：`path: "/permission/button/login"`, `name: "PermissionButtonLogin"`, `component: "permission/button/perms"`, `meta: { title: "menus.purePermissionButtonLogin" }`

### 14.4 权限判定函数与指令底层实现原理
1. **`hasAuth(value: string | string[])` (`src/router/utils.ts`)**：
   - 获取当前匹配路由记录中的 `meta.auths`；
   - 判断传入的权限值是否存在于当前路由的 `auths` 数组中。
2. **`hasPerms(value: string | string[])` (`src/utils/auth.ts`)**：
   - 提取 `storageLocal().getItem(userKey).permissions`；
   - 若列表中包含 `*:*:*` 则无条件判定通过返回 `true`；
   - 否则做集合交集判断（`isIncludeAllChildren` 或包含判断）。
3. **`v-auth` 与 `v-perms` 自定义指令**：
   - 在元素挂载钩子（`mounted`）中计算权限，若判定失败则直接执行 `el.parentNode?.removeChild(el)` 彻底从 DOM 树物理移除节点，杜绝前端越权。

---

## 15. 多租户管理体系 (tenant)

### 15.1 真实代码位置与组件清单
- **视图目录**：`src/views/tenant/`
  - `src/views/tenant/index.vue`：租户总览与管理工作台（多状态筛选、分页列表、直接内嵌弹窗创建/编辑、租户激活/暂停/删除高危动作）
  - `src/views/tenant/create.vue`：独立全页租户创建视图（内嵌 `TenantForm`）
  - `src/views/tenant/edit.vue`：独立全页租户修改视图（支持全字段表单同步与提交）
  - `src/views/tenant/detail.vue`：租户多维度综合监管中心（基础档案、多资源配额进度与调整表单、租户关联用户列表）
- **核心依赖业务组件**：`src/components/TenantManagement/`
  - `TenantForm.vue`：租户基本属性录入表单
  - `TenantQuotaForm.vue`：租户资源配额分配表单
  - `QuotaProgress.vue`：配额消耗百分比进度条仪表盘
  - `ConfirmDialog.vue`：高危管理动作二次确认对话框
- **状态层 (Store)**：`src/store/modules/tenant.ts`、`src/store/modules/user.ts`
- **接口层 (API)**：
  - `src/api/modules/tenantManagement.ts`（业务 CRUD、配额、用户列表、状态控制）
  - `src/api/modules/tenant.ts`（多租户商业分析与趋势统计图表）
- **类型定义 (Types)**：`src/types/tenant.ts`

### 15.2 业务职责与功能概述
租户模块面向 SaaS 架构中的顶层多租户隔离与管控体系：
1. **严格的超级管理员隔离守卫**：本模块所有视图组件均在初始化执行 `if (!isSuperAdmin.value) { ElMessage.error("无权限访问此页面"); router.push("/dashboard"); }`，非平台超级管理员坚决禁入。
2. **租户全生命周期管理**：
   - 租户档案录入（企业名称、联系人姓名、电话、邮箱）；
   - 状态三态机：正常激活（`active`）、暂停服务（`suspended`）、逻辑删除（`deleted`）；
   - 一键冻结与解冻：调用 `/tenants/{id}/suspend/` 暂停租户后，该租户下所有成员与业务操作受阻；调用 `/tenants/{id}/activate/` 重新启用。
3. **多维资源配额监管体系 (`TenantQuota`)**：
   - 严格配额项约束：最大用户数（`max_users`）、最大管理员数（`max_admins`）、最大存储空间（`max_storage_mb`）、最大产品数（`max_products`）；
   - 配额实时监控：调用 `/tenants/{id}/quota/usage/` 获取已用存储量，通过 `QuotaProgress` 渲染警示进度条；
   - 动态扩缩容：通过 `TenantQuotaForm` 实时调整配额阈值。
4. **租户用户下钻查询**：在详情页中穿透获取该租户归属的用户列表（`getTenantUsers`），掌握人员规模与激活情况。
5. **多租户宏观商业图表分析**：提供租户增长趋势、状态分布、新增速率等可视化图表接口。

### 15.3 路由挂载
- **挂载模式**：动态路由系统加载。
- **路由路径**：
  - 列表页：`path: "/tenant"` 或 `path: "/tenant/index"`
  - 创建页：`path: "/tenant/create"`
  - 编辑页：`path: "/tenant/edit/:id"`
  - 详情页：`path: "/tenant/detail/:id"`

### 15.4 接口与通信契约
#### 1) 业务管理接口 (`src/api/modules/tenantManagement.ts`)
| 接口函数 | 请求方法 | 路由地址 | 请求参数 | 契约返回结构 | 业务说明 |
|---|---|---|---|---|---|
| `getTenantList` | `GET` | `/tenants/` | `TenantListParams` (`search`, `status`, `page`, `page_size`) | `PaginationResponse<Tenant>` | 分页获取租户列表 |
| `createTenant` | `POST` | `/tenants/` | `TenantCreateUpdateParams` (`name`, `contact_name`, `contact_email`, `contact_phone`) | `ApiResponse<Tenant>` | 创建新租户 |
| `getTenantDetail` | `GET` | `/tenants/{id}/` | `id: number` | `ApiResponse<Tenant>` | 获取租户档案与用户统计 |
| `getTenantComprehensive`| `GET` | `/tenants/{id}/comprehensive/`| `id: number` | `ApiResponse<Tenant>` | 获取租户档案+配额综合信息 |
| `updateTenant` | `PUT` | `/tenants/{id}/` | `id: number`, `TenantCreateUpdateParams` | `ApiResponse<Tenant>` | 更新租户基础档案 |
| `deleteTenant` | `DELETE` | `/tenants/{id}/` | `id: number` | `ApiResponse<any>` | 删除指定租户 |
| `suspendTenant` | `POST` | `/tenants/{id}/suspend/` | `id: number` | `ApiResponse<Tenant>` | 暂停/冻结租户 |
| `activateTenant` | `POST` | `/tenants/{id}/activate/` | `id: number` | `ApiResponse<Tenant>` | 激活/恢复租户 |
| `getTenantQuota` | `GET` | `/tenants/{id}/quota/` | `id: number` | `ApiResponse<TenantQuota>` | 查询租户分配的资源配额 |
| `updateTenantQuota` | `PUT` | `/tenants/{id}/quota/` | `id: number`, `TenantQuotaUpdateParams` | `ApiResponse<TenantQuota>` | 调整更新租户各项配额上限 |
| `getTenantQuotaUsage`| `GET` | `/tenants/{id}/quota/usage/` | `id: number` | `ApiResponse<TenantQuota>` | 实时获取租户配额实际使用量 |
| `getTenantUsers` | `GET` | `/tenants/{id}/users/` | `id: number`, 分页参数 | `PaginationResponse<TenantUser>` | 获取属于该租户的用户成员 |

#### 2) 图表分析接口 (`src/api/modules/tenant.ts`)
| 接口函数 | 请求方法 | 路由地址 | 请求参数 | 契约返回结构 | 业务说明 |
|---|---|---|---|---|---|
| `fetchTenantTrendData` | `GET` | `/admin/charts/tenant-trend/` | `period` (`monthly`等), `start_date`, `end_date` | `ApiResponse<any>` | 获取租户发展趋势图表折线 |
| `fetchTenantStatusData` | `GET` | `/admin/charts/tenant-status/`| 无 | `ApiResponse<any>` | 租户激活/暂停状态分布图 |
| `fetchTenantCreationData`| `GET` | `/admin/charts/tenant-creation/`| `period`, `start_date`, `end_date` | `ApiResponse<any>` | 租户增长速率柱状图 |

### 15.5 依赖状态与数据模型
- **租户实体 (`Tenant`)**：
  ```ts
  export interface Tenant {
    id: number;
    name: string;
    status: "active" | "suspended" | "deleted";
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    created_at: string;
    updated_at: string;
    user_count?: number;
    admin_count?: number;
  }
  ```
- **租户配额 (`TenantQuota`)**：
  ```ts
  export interface TenantQuota {
    id: number;
    tenant: { id: number; name: string };
    max_users: number;
    max_admins: number;
    max_storage_mb: number;
    max_products: number;
    current_storage_used_mb?: number;
  }
  ```

---

## 16. 引导页/欢迎页 (welcome)

### 16.1 真实代码位置与组件清单
- **视图文件**：`src/views/welcome/index.vue`
  - 源码内容：
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
- **路由挂载文件**：`src/router/modules/home.ts`
- **关联布局框架**：`src/layout/index.vue`

### 16.2 业务职责与功能概述
欢迎页（Welcome）作为系统默认的首页落地引导组件：
1. **默认重定向目的地**：在系统根路径 `/` 访问时，静态路由默认通过 `redirect: "/welcome"` 引导用户进入该落地页。
2. **环境开关与隐藏策略**：
   - 依赖环境变量 `VITE_HIDE_HOME`；
   - 在 `home.ts` 中控制是否在侧边栏显示首页标签（`showLink: VITE_HIDE_HOME === "true" ? false : true`）；
   - 在全局前置路由守卫 `src/router/index.ts` 中执行拦截：若开启了隐藏首页，而在浏览器地址栏直接输入 `/welcome`，系统会自动强制重定向到 `/error/404` 页面：
     ```ts
     if (VITE_HIDE_HOME === "true" && to.fullPath === "/welcome") {
       next({ path: "/error/404" });
     }
     ```

### 16.3 路由配置事实
```ts
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

---

## 17. 全局异常处理 (error: 403, 404, 500)

### 17.1 真实代码位置与组件清单
- **视图目录**：`src/views/error/`
  - `src/views/error/403.vue`：403 无访问权限错误视图
  - `src/views/error/404.vue`：404 资源未找到错误视图
  - `src/views/error/500.vue`：500 服务器内部异常视图
- **核心依赖通用异常组件**：`src/components/ErrorHandling/ErrorPage.vue`
- **静态路由模块**：`src/router/modules/error.ts`
- **关联开发示例路由**：`src/router/modules/errorExample.ts`（只在 `import.meta.env.DEV` 环境可见）

### 17.2 业务职责与功能概述
异常处理模块保障整个系统在路由导航、鉴权受阻与网络/服务端崩溃时的容错恢复与友好指引：
1. **统一组件化架构 (`ErrorPage.vue`)**：
   - 所有异常页面统一复用 `ErrorPage.vue` 业务组件，根据 `type` 参数（`403`, `404`, `500`, `network`, `custom`）动态渲染专用状态图标、多语言错误标题与详细错误排查建议；
   - 统一提供导航容灾按钮：“返回上一页”（`router.back()`）、“返回首页”（`router.push("/")`）；
   - 支持技术支持联络扩展区（支持展示动态 `errorCode` 与发生 `timestamp`）。
2. **各状态码专有行为策略**：
   - **403 Forbidden (`403.vue`)**：
     - 适用场景：用户已登录但尝试访问未被授权的角色受限路由或接口返回无权；
     - 特殊动作：配置 `customActions` 渲染“联系管理员”高亮按钮，点击唤起 `window.open('mailto:admin@example.com')`；
     - 守卫集成：在 `src/router/index.ts` 路由守卫中，当目标路由存在 `meta.roles` 且用户角色不匹配时，自动重定向至 `/error/403`：
       ```ts
       if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles)) {
         next({ path: "/error/403" });
       }
       ```
   - **404 Not Found (`404.vue`)**：
     - 适用场景：用户访问不存在的路径，或环境禁用了首页功能后强刷 `/welcome`；
     - 默认提供回退上一页与回退首页入口。
   - **500 Internal Server Error (`500.vue`)**：
     - 适用场景：系统发生未捕获致命运行时异常或后端服务 500 熔断；
     - 恢复动作：提供 `:show-retry="true"`，绑定 `handleRetry` 执行 `window.location.reload()` 尝试刷新恢复页面，并显示技术支持联系区。

### 17.3 静态路由配置事实 (`src/router/modules/error.ts`)
```ts
export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "ri/information-line",
    showLink: false,
    title: $t("menus.pureAbnormal"),
    rank: 9
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      showLink: false,
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: $t("menus.pureFourZeroThree")
      }
    },
    {
      path: "/error/404",
      name: "404",
      showLink: false,
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: $t("menus.pureFourZeroFour")
      }
    },
    {
      path: "/error/500",
      name: "500",
      showLink: false,
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: $t("menus.pureFiveZeroZero")
      }
    }
  ]
} satisfies RouteConfigsTable;
```

---

## 18. Part B 模块对比与工程架构特征总结

| 序号 | 模块名称 | 路由加载机制 | 核心组件位置 | 关联 Store | 按钮级权限机制 | 关键技术亮点 |
|---|---|---|---|---|---|---|
| 10 | **member** | 动态路由 | `src/views/member/` (4个SFC) | `member`, `tenant`, `user` | `hasManagePermission` 计算属性结合 `hasPerms` | 跨租户检索、CRM关系管理、头像二进制异步上传、历史订单联动 |
| 11 | **menu** | 动态路由 | `src/views/menu/index.vue` | `menu`, `user` | `v-perms="['super_admin']"` | 双模式展示(Table/Tree)、树节点拖拽重排、JSON配置文件导入导出、级联删除 |
| 12 | **notification** | 动态路由 | `src/views/notification/` (3个SFC) | Composables 架构 | 业务状态机生命周期过滤 | 租户/应用/特定成员三层范围、状态机(draft/published/archived)、实时送达阅读率统计 |
| 13 | **order** | 动态路由 | `src/views/order/` (5个SFC) | `order` | 业务组件内置控制 | 翻译业务商务模型、双边收支与毛利率实时核算、版本快照比对与一键还原、Excel 导入导出与统计大屏 |
| 14 | **permission** | 动态/Mock路由 | `src/views/permission/` (3个SFC) | `permission`, `user` | `<Auth>`, `<Perms>`, `v-auth`, `v-perms`, `hasAuth`, `hasPerms` | 路由元数据权限与用户登录态全局权限双轨模型、`*:*:*` 超管通配、动态路由即时刷新重载 |
| 15 | **tenant** | 动态路由 | `src/views/tenant/` (4个SFC) | `tenant`, `user` | `isSuperAdmin` 强制页面级守卫 | SaaS 根隔离、激活/暂停状态机、资源配额(用户/存储/产品)监控与调整、商业发展趋势图表 |
| 16 | **welcome** | 静态路由 (`home.ts`) | `src/views/welcome/index.vue` | - | `VITE_HIDE_HOME` 环境变量控制 | 平台首屏引导、环境感知的首页屏蔽与 404 兜底联动 |
| 17 | **error** | 静态路由 (`error.ts`) | `src/views/error/` (3个SFC) | - | 路由守卫自动触发拦截 | 统一 `ErrorPage` 组件复用、403邮件联系管理员、500页面一键刷新重试 |
