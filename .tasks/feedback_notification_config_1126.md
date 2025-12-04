# 反馈通知配置功能实现任务

## 任务概述

根据 `docs/temp1126/feedback_notification_guide.md` 文档实现前端反馈通知配置管理功能。

## 需求分析

### 功能特点

1. **应用级别配置**：每个应用可独立配置通知
2. **多接收者支持**：每个应用可配置多个邮件接收者
3. **灵活开关控制**：支持全局启用/禁用，也支持单个接收者的启用/禁用
4. **测试功能**：发送测试邮件验证配置

### API 端点（后端已实现）

| 功能 | 方法 | 端点 |
|------|------|------|
| 获取通知配置列表 | GET | `/api/v1/feedbacks/notification-configs/` |
| 创建通知配置 | POST | `/api/v1/feedbacks/notification-configs/` |
| 获取配置详情 | GET | `/api/v1/feedbacks/notification-configs/{id}/` |
| 更新配置 | PATCH | `/api/v1/feedbacks/notification-configs/{id}/` |
| 删除配置 | DELETE | `/api/v1/feedbacks/notification-configs/{id}/` |
| 获取接收者列表 | GET | `/api/v1/feedbacks/notification-configs/{id}/recipients/` |
| 添加接收者 | POST | `/api/v1/feedbacks/notification-configs/{id}/recipients/add/` |
| 更新接收者 | PATCH | `/api/v1/feedbacks/notification-configs/{id}/recipients/{recipient_id}/update/` |
| 删除接收者 | DELETE | `/api/v1/feedbacks/notification-configs/{id}/recipients/{recipient_id}/` |
| 发送测试邮件 | POST | `/api/v1/feedbacks/notification-configs/{id}/test/` |
| 按应用查询配置 | GET | `/api/v1/feedbacks/notification-configs/by-application/{application_id}/` |

---

## 现有代码结构分析

### 相关文件位置

```
src/
├── types/feedback.ts          # 反馈类型定义（需追加通知配置类型）
├── api/modules/feedback.ts    # 反馈API（需追加通知配置API）
├── composables/useFeedback.ts # 反馈Composable（参考结构）
├── composables/useApplication.ts # 应用Composable（用于应用选择）
└── views/feedback/
    ├── email/templates/index.vue  # 参考结构（邮件模板页面）
    ├── feedbacks/                 # 反馈管理
    └── notification/              # 需新建：通知配置目录
        └── config/
            └── index.vue          # 需新建：通知配置页面
```

### 项目使用的技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件**: Element Plus
- **状态管理**: 组合式 API (Composables)
- **HTTP 请求**: 自定义 http 封装 (`@/utils/http`)
- **国际化**: vue-i18n
- **路由**: 动态路由（后端配置菜单）

---

## 实施清单

### 第一阶段：类型定义

1. [ ] 在 `src/types/feedback.ts` 追加通知配置相关类型
   - `FeedbackNotificationConfig` 通知配置接口
   - `NotificationRecipient` 接收者接口
   - `NotificationConfigListParams` 查询参数
   - `NotificationConfigCreateParams` 创建参数
   - `RecipientCreateParams` 接收者创建参数
   - 相关 API 响应类型

### 第二阶段：API 封装

2. [ ] 在 `src/api/modules/feedback.ts` 追加通知配置 API
   - `getNotificationConfigList()` 获取配置列表
   - `createNotificationConfig()` 创建配置
   - `getNotificationConfigDetail()` 获取配置详情
   - `updateNotificationConfig()` 更新配置
   - `deleteNotificationConfig()` 删除配置
   - `getNotificationRecipients()` 获取接收者列表
   - `addNotificationRecipient()` 添加接收者
   - `updateNotificationRecipient()` 更新接收者
   - `deleteNotificationRecipient()` 删除接收者
   - `sendTestNotification()` 发送测试邮件
   - `getNotificationConfigByApplication()` 按应用查询

### 第三阶段：Composable

3. [ ] 创建 `src/composables/useFeedbackNotification.ts`
   - `useNotificationConfigList()` 配置列表操作
   - `useNotificationConfigDetail()` 配置详情操作
   - `useNotificationRecipients()` 接收者管理

### 第四阶段：页面组件

4. [ ] 创建 `src/views/feedback/notification/config/index.vue`
   - 配置列表视图（按应用展示）
   - 启用/禁用开关
   - 接收者管理对话框
   - 测试邮件功能

---

## 动态菜单和路由配置指南

此项目使用**后端动态路由**，菜单需要在后端（Django Admin 或 API）配置。

### 需要在后端添加的菜单项

```python
# 在 Django Admin 中添加菜单配置

# 父级菜单（如果 feedback 还没有邮件通知子菜单）
# 菜单名称: 邮件通知
# 路径: /feedback/notification
# 组件: （空，作为父级目录）

# 子菜单：通知配置
{
    "name": "通知配置",
    "path": "/feedback/notification/config",
    "component": "/src/views/feedback/notification/config/index.vue",
    "meta": {
        "title": "通知配置",
        "icon": "ep:message"  # 或其他合适的图标
    }
}
```

### 菜单层级结构建议

```
反馈管理
├── 反馈列表
├── 统计分析
├── 邮件管理
│   ├── 邮件模板
│   ├── 发送日志
│   └── 通知配置 ← 新增
├── 产品管理
│   ├── 产品列表
│   ├── 版本管理
│   └── 分类管理
└── 系统健康
```

### 前端路由组件映射

确保前端的 `src/router/utils.ts` 能正确解析动态路由中的 component 路径。组件路径格式：

```
/src/views/feedback/notification/config/index.vue
```

---

## 提议的解决方案

### UI 设计思路

1. **主列表视图**
   - 以应用为维度展示通知配置
   - 每行显示：应用名称、启用状态、接收者数量、操作按钮
   - 支持为未配置的应用快速创建配置

2. **接收者管理对话框**
   - 显示当前应用的所有接收者
   - 支持添加、编辑、删除接收者
   - 每个接收者可单独启用/禁用

3. **测试邮件功能**
   - 点击"发送测试"按钮
   - 弹出输入框让用户输入测试邮箱
   - 显示发送结果

### 参考现有代码

- 页面结构参考：`src/views/feedback/email/templates/index.vue`
- 应用选择器参考：`src/composables/useApplication.ts`
- API 封装参考：`src/api/modules/feedback.ts`

---

## 任务进度

| 步骤 | 状态 | 备注 |
|------|------|------|
| 需求分析 | ✅ 完成 | 已分析文档和现有代码 |
| 类型定义 | ✅ 完成 | src/types/feedback.ts |
| API 封装 | ✅ 完成 | src/api/modules/feedback.ts (11个API) |
| Composable | ✅ 完成 | src/composables/useFeedbackNotification.ts |
| 页面组件 | ✅ 完成 | src/views/feedback/notification/config/index.vue |
| 测试验证 | ⏳ 待测试 | 需配置后端菜单后验证 |

---

## 完成的文件

1. **类型定义** - `src/types/feedback.ts` (追加约 85 行)
2. **API 封装** - `src/api/modules/feedback.ts` (追加约 170 行)
3. **Composable** - `src/composables/useFeedbackNotification.ts` (约 350 行)
4. **页面组件** - `src/views/feedback/notification/config/index.vue` (约 540 行)

---

## 后端菜单配置指南

完成前端开发后，需要在 **Django Admin** 后台添加菜单项：

### 菜单配置信息

```
名称: 通知配置
路径: /feedback/notification/config
组件: /src/views/feedback/notification/config/index.vue
图标: ep:message (或 ep:bell)
排序: 根据需要设置
```

### 菜单层级

建议作为 **独立一级菜单项**，与反馈管理平级
