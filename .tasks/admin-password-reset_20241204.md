# 管理员密码重置功能实现

## 任务信息
- **任务名称**: 添加管理员密码重置功能
- **任务日期**: 2024-12-04
- **分支名称**: feature/admin-password-reset_20241204
- **任务状态**: ✅ 已完成

## 用户需求
用户要求在管理员用户管理页面添加修改租户管理员密码的功能。
- **页面URL**: http://localhost:8848/#/admin-user/index
- **用户原话**: "没有修改租户管理员密码的功能，请加上。"

## 实施方案

### 1. 国际化文本
添加中英文翻译文本，用于密码重置功能的UI显示。

#### 修改文件
- `locales/zh-CN.yaml`
- `locales/en.yaml`

#### 新增翻译键
- `adminUser.resetPassword`: 重置密码
- `adminUser.confirmResetPassword`: 确认重置密码
- `adminUser.confirmResetPasswordMessage`: 确认重置密码提示
- `adminUser.resetPasswordSuccess`: 重置成功消息
- `adminUser.resetPasswordFailed`: 重置失败消息
- `adminUser.newPassword`: 新密码
- `adminUser.newPasswordPlaceholder`: 新密码占位符
- `adminUser.confirmNewPassword`: 确认新密码
- `adminUser.confirmNewPasswordPlaceholder`: 确认新密码占位符

### 2. 重置密码对话框组件
创建独立的密码重置对话框组件，提供用户友好的密码输入界面。

#### 新建文件
- `src/components/AdminUserManagement/ResetPasswordDialog.vue`

#### 组件功能
- 使用 Element Plus 的 Dialog 和 Form 组件
- 包含两个密码输入框：新密码、确认新密码
- 表单验证规则：
  - 密码不能为空
  - 密码长度至少8个字符
  - 两次密码输入必须一致
- 提供确认和取消按钮
- 支持加载状态显示

### 3. Store Action
利用现有的 Store Action，无需额外开发。

#### 已存在的 Action
- `resetAdminUserPasswordAction(id, data)` 在 `src/store/modules/adminUser.ts` 中

### 4. 管理员列表页面集成
在管理员列表页面添加重置密码的入口和逻辑。

#### 修改文件
- `src/views/admin-user/index.vue`

#### 修改内容
1. 导入 `ResetPasswordDialog` 组件
2. 添加状态管理：
   - `resetPasswordDialogVisible`: 对话框显示状态
   - `userForResetPassword`: 待重置密码的用户信息
3. 添加处理函数：
   - `handleResetPassword(row)`: 打开重置密码对话框
   - `handleResetPasswordConfirm(formData)`: 提交密码重置
   - `handleResetPasswordCancel()`: 取消密码重置
4. 在"更多"下拉菜单中添加"重置密码"选项
5. 在模板底部添加 `ResetPasswordDialog` 组件

## 技术实现细节

### API接口
- **端点**: `POST /api/v1/auth/{user_id}/change-password/`
- **函数**: `resetAdminUserPassword(id, data)` 在 `src/api/modules/adminUser.ts`
- **参数类型**: `ResetPasswordParams`
  ```typescript
  interface ResetPasswordParams {
    new_password: string;
    confirm_password: string;
  }
  ```
- **API文档**: `docs/api/reset_tenant_admin_password.md`

### 验证规则
```typescript
const rules = reactive<FormRules>({
  new_password: [
    {
      required: true,
      message: t("adminUser.passwordRequired"),
      trigger: "blur"
    },
    {
      min: 8,
      message: t("adminUser.passwordLength"),
      trigger: "blur"
    }
  ],
  confirm_password: [
    {
      required: true,
      message: t("adminUser.confirmPasswordRequired"),
      trigger: "blur"
    },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
});
```

## 文件变更清单

### 新建文件
1. `src/components/AdminUserManagement/ResetPasswordDialog.vue` - 重置密码对话框组件

### 修改文件
1. `locales/zh-CN.yaml` - 添加中文翻译
2. `locales/en.yaml` - 添加英文翻译
3. `src/views/admin-user/index.vue` - 集成重置密码功能

### 已存在的相关文件（无需修改）
1. `src/api/modules/adminUser.ts` - API函数已存在
2. `src/types/adminUser.ts` - 类型定义已存在
3. `src/store/modules/adminUser.ts` - Store Action已存在

## 功能特点
1. ✅ 独立的密码重置对话框，UI清晰友好
2. ✅ 完整的表单验证，确保密码安全性
3. ✅ 支持中英文双语
4. ✅ 加载状态反馈，提升用户体验
5. ✅ 成功/失败消息提示
6. ✅ 可以为任意管理员用户重置密码

## 测试建议
1. 验证"重置密码"菜单项正确显示在"更多"下拉菜单中
2. 验证点击后打开重置密码对话框
3. 验证表单验证规则：
   - 密码为空时提示错误
   - 密码长度小于8时提示错误
   - 两次密码不一致时提示错误
4. 验证成功重置后显示成功消息
5. 验证取消操作正确关闭对话框
6. 验证重置后用户可以使用新密码登录

## 注意事项
1. 重置密码不需要输入旧密码（管理员操作）
2. 密码最小长度为8个字符
3. 重置密码后用户可立即使用新密码登录
4. 操作日志应该记录在后端（如果有审计功能）

## 更新记录

### 2024-12-05：根据API文档修正实现
**提交**: `ed5cba4`

**修改内容**：
1. 更新API端点路径
   - 旧：`/admin-users/{id}/reset-password/`
   - 新：`/api/v1/auth/{id}/change-password/`

2. 更新请求参数名称
   - 旧：`password`, `password_confirm`
   - 新：`new_password`, `confirm_password`

3. 修改的文件：
   - `src/types/adminUser.ts` - 更新 `ResetPasswordParams` 接口
   - `src/api/modules/adminUser.ts` - 更新API函数端点
   - `src/components/AdminUserManagement/ResetPasswordDialog.vue` - 更新表单字段名

**原因**：确保前端实现与后端API文档 (`docs/api/reset_tenant_admin_password.md`) 保持一致。
