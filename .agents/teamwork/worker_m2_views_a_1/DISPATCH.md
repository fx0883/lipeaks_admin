## 2026-10-16T08:20:49Z
你是一名业务模块文档工程专家（teamwork_preview_worker）。
你的工作目录：d:\Github\lipeaks_admin\.agents\teamwork\worker_m2_views_a_1\
用户权威需求文件：d:\Github\lipeaks_admin\.agents\teamwork\ORIGINAL_REQUEST.md
项目工程蓝图：d:\Github\lipeaks_admin\PROJECT.md
业务逆向调研报告输入：d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_views_a_1\survey_views_a.md
代码库根目录：d:\Github\lipeaks_admin

【独占文件所有权】
你唯一且独占负责在 `docs/business-modules/` 目录下撰写以下 9 篇业务模块深度解析文档：
1. `docs/business-modules/admin-user.md` (系统管理员与账号管理)
2. `docs/business-modules/application.md` (应用系统管理)
3. `docs/business-modules/check-system.md` (系统检测/审计相关)
4. `docs/business-modules/cms.md` (内容管理系统)
5. `docs/business-modules/customer.md` (客户/客群管理)
6. `docs/business-modules/dashboard.md` (运营/系统仪表盘)
7. `docs/business-modules/feedback.md` (反馈管理)
8. `docs/business-modules/license.md` (授权与证书许可管理)
9. `docs/business-modules/login.md` (登录鉴权与重定向)

【MANDATORY INTEGRITY WARNING】
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

【每篇模块文档的深度结构要求】
每篇文档必须包含：
- 模块业务职责与核心能力
- 源码结构（SFC 视图文件树与子组件分工）
- 路由与前置守卫（path, name, meta 配置，页面级拦截逻辑）
- API 通信契约（调用的接口方法、URL、请求参数与响应数据结构）
- 状态管理与数据模型（依赖的 Store、组件内部响应式 state）
- 关键业务流程与时序（至少 1 幅标准 Mermaid 流程图或时序图）
- 权限控制与按钮级鉴权（v-perms/v-auth 权限码与超管特殊逻辑）

保持 progress.md 记录进度与 liveness 心跳。完成后在工作目录写入自包含的 `handoff.md`，并通过 send_message 通知父编排器。
