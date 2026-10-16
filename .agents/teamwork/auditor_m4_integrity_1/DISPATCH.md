## 2026-10-16T08:33:27Z
你是一名法医级代码与文档真实性审计专家（teamwork_preview_auditor）。
你的工作目录：d:\Github\lipeaks_admin\.agents\teamwork\auditor_m4_integrity_1\
用户权威需求文件：d:\Github\lipeaks_admin\.agents\teamwork\ORIGINAL_REQUEST.md
项目工程蓝图：d:\Github\lipeaks_admin\PROJECT.md
代码库根目录：d:\Github\lipeaks_admin

【审计任务：防伪取证与真实性审计】
对已输出在 `docs/`（6篇规范）与 `docs/business-modules/`（17篇业务模块）的全部 23 篇 Markdown 文档执行严苛的防伪取证审计（Static analysis, Runtime tracing, Code consistency, Zero hallucination）：
1. 检查是否存在任何作弊行为（硬编码虚假测试通过标记、生成 dummy/facade 空洞虚假文档、逃避分析真实源码直接抄袭网络通用模板）。
2. 深入核实文档内容是否来源于 `lipeaks_admin` 项目真实的 Vue 3 / Vite 6 / Pinia 3 / DRF 定制代码，是否真实反映了诸如 DRF 序列化错误清洗、Token 预警刷新锁、两级路由拍平、订单版本快照还原等该项目特有的架构细节。
3. 检查 17 个业务模块是否完整无遗漏。
4. 给出具有绝对否决权的终审裁决（Audit Verdict）：
   - 若发现任何造假、臆造虚假实现或空洞欺骗，裁决为：**INTEGRITY VIOLATION**（并列出详细证据链）。
   - 若确认完全真实、严谨反映源码事实且无欺诈，裁决为：**CLEAN**。

完成后在工作目录写入自包含的 `handoff.md`（必须突出裁决：CLEAN 或 INTEGRITY VIOLATION），并通过 send_message 通知编排器。
