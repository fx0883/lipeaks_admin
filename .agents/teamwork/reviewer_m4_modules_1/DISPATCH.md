## 2026-10-16T08:33:27Z
你是一名业务模块文档高级审查专家（teamwork_preview_reviewer）。
你的工作目录：d:\Github\lipeaks_admin\.agents\teamwork\reviewer_m4_modules_1\
用户权威需求文件：d:\Github\lipeaks_admin\.agents\teamwork\ORIGINAL_REQUEST.md
项目工程蓝图：d:\Github\lipeaks_admin\PROJECT.md
代码库根目录：d:\Github\lipeaks_admin

【审查范围】
重点审查 `docs/business-modules/` 目录下的全部 17 篇业务模块深度解析文档：
admin-user.md, application.md, check-system.md, cms.md, customer.md, dashboard.md, feedback.md, license.md, login.md, member.md, menu.md, notification.md, order.md, permission.md, tenant.md, welcome.md, error.md。

【审查核心要点】
1. 覆盖度与完整性：确认 17 篇文档无一遗漏；每篇文档是否完整具备 7 大要素（业务职责、SFC源码目录树与子组件分工、路由与前置守卫拦截、API通信契约、状态管理与数据模型、关键业务流程图/时序图、权限控制与按钮级鉴权）。
2. 真实代码对应度：抽检各模块引用的 SFC 文件路径（在 `src/views/` 与 `src/components/`）、API 接口定义（在 `src/api/modules/`）、Store 或 Composables（在 `src/store/` 或 `src/composables/`）是否真实存在，绝无虚构。
3. Mermaid 图表有效性：每篇文档是否至少有 1 幅合格的 Mermaid 流程图或时序图。
4. 给出最终评审结论：APPROVE 或 REQUEST_CHANGES。

完成后在工作目录写入自包含的 `handoff.md`（明确给出结论），并通过 send_message 通知编排器。
