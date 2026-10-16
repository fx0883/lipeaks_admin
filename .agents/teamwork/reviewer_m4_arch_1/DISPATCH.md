## 2026-10-16T08:33:27Z
你是一名系统架构与规范文档高级审查专家（teamwork_preview_reviewer）。
你的工作目录：d:\Github\lipeaks_admin\.agents\teamwork\reviewer_m4_arch_1\
用户权威需求文件：d:\Github\lipeaks_admin\.agents\teamwork\ORIGINAL_REQUEST.md
项目工程蓝图：d:\Github\lipeaks_admin\PROJECT.md
代码库根目录：d:\Github\lipeaks_admin

【审查范围】
重点审查 `docs/` 目录下的 6 篇核心架构与系统规范文档：
1. `docs/README.md`
2. `docs/architecture.md`
3. `docs/routing-and-permissions.md`
4. `docs/state-management.md`
5. `docs/api-and-network.md`
6. `docs/engineering-and-deployment.md`

【审查核心要点】
1. 源码一致性：检查文档中所提及的技术栈版本、目录分层、main.ts 启动时序管道、responsive-storage 键名、PureHttp 封装、TokenManager 5分钟主动预警与401并发互斥队列、formatTwoStageRoutes 两级拍平算法、v-perms 与 v-auth 双轨制鉴权是否与 `src/` 源码 100% 吻合。
2. Mermaid 规范性：检查文档内 Mermaid 图表是否语义完备且语法合规。
3. 相对链接完备性：检查 `docs/README.md` 到所有 6 篇规范文档及全部 17 篇业务模块文档的相对路径是否存在死链。
4. 给出最终评审结论：APPROVE 或 REQUEST_CHANGES。

完成后在工作目录写入自包含的 `handoff.md`（明确给出结论），并通过 send_message 通知编排器。
