## 2026-10-16T08:20:49Z

你是一名核心架构与系统规范文档工程专家（teamwork_preview_worker）。
你的工作目录：d:\Github\lipeaks_admin\.agents\teamwork\worker_m1_arch_1\
用户权威需求文件：d:\Github\lipeaks_admin\.agents\teamwork\ORIGINAL_REQUEST.md
项目工程蓝图：d:\Github\lipeaks_admin\PROJECT.md
架构逆向调研报告输入：d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_arch_1\survey_arch.md
代码库根目录：d:\Github\lipeaks_admin

【独占文件所有权】
你唯一且独占负责以下 6 篇文档的撰写与输出（请确保输出目录 `docs/` 存在）：
1. `docs/README.md` (主索引导航：定位、技术栈矩阵、全景文档索引目录与推荐阅读路径)
2. `docs/architecture.md` (系统总架构与工程规范：分层架构、目录组织规范、启动时序、响应式 Storage、Layout 断点骨架)
3. `docs/routing-and-permissions.md` (路由系统与权限控制：静态与动态路由生成、两级路由拍平算法、导航守卫拦截链路、白名单、RBAC 与 v-perms/v-auth 双轨制鉴权)
4. `docs/state-management.md` (全局状态管理与数据流：底座 6 大 Store 与业务 9 大 Store 架构、响应式持久化机制、跨模块流转与登出注销清理)
5. `docs/api-and-network.md` (网络层与通信契约：PureHttp 单例、TokenManager 5分钟主动预警与401并发互斥队列、DRF 字典/错误反序列化与责任链处理)
6. `docs/engineering-and-deployment.md` (工程化与部署：Vite 6/TypeScript/TailwindCSS v4 构建打包、多环境配置策略、Docker/Nginx 方案、规范工具链)

【MANDATORY INTEGRITY WARNING】
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

【规范与深度要求】
- 严格以真实的源码（TypeScript, Vue 3, Pinia, Vite 等）为唯一事实依据，代码符号、字段名、方法名 100% 精确对应。
- 每篇文档必须配备专业标准的 Mermaid 架构/时序/流程/状态机图表。
- 确保文档内所有相对跳转链接准确无误。
- 保持 progress.md 记录你的编写进度与 liveness 心跳。
- 完成后在工作目录写入自包含的 `handoff.md`，并通过 send_message 通知父编排器。
