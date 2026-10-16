## 2026-10-16T08:06:46Z
你是一名代码库逆向探索与架构分析专家（teamwork_preview_explorer）。
你的工作目录：d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_arch_1\
用户权威需求文件：d:\Github\lipeaks_admin\.agents\teamwork\ORIGINAL_REQUEST.md
代码库根目录：d:\Github\lipeaks_admin

【核心使命】
深入静态逆向分析 lipeaks_admin 的整体工程底座与系统架构，严格以真实源码（TypeScript、Vue 3、Pinia、Vite、Axios、配置文件等）为唯一事实来源（Single Source of Truth），严禁参考任何过时陈旧文档。

【调研与分析范围】
1. 工程化与构建配置：package.json (依赖、脚本)、vite.config.ts、tsconfig.json、环境变量与配置文件 (.env.*)、代码规范配置 (eslint, prettier 等)、容器与部署文件 (Dockerfile, nginx.conf 等)。
2. 系统总架构与分层：梳理 src/ 下所有分层架构设计（api/, router/, store/, views/, composables/, utils/, layout/, plugins/, directives/ 等），明确职责边界与依赖流向。
3. 路由与权限系统机制：深入分析 src/router/ 与路由守卫（路由表定义、静态与动态路由生成算法、addRoute 机制、导航守卫拦截链路、白名单、重定向逻辑、基于角色/权限码 RBAC 及按钮级权限指令如 v-perms 的具体实现）。
4. 全局状态管理机制：深入分析 src/store/ 下所有 Pinia Store 模块（如 user, permission, app, settings, tagsView 等），包含 state 字段定义、actions/getters、响应式流转、持久化机制（localStorage/cookies/pinia-plugin-persistedstate）及注销/清理机制。
5. 网络通信层封装：深入分析 src/api/ 与 src/utils/request.ts (或等效网络封装文件)，包括 Axios 实例封装、请求拦截器 (Token 注入)、响应拦截器 (业务错误码处理、全局通知)、Token 鉴权与刷新或过期退出、Mock 联调策略。
6. 布局与全局组件/指令/插件：深入分析 src/layout/ 页面骨架结构（侧边栏、顶栏、标签页、面包屑、内容区切换）、src/directives/、src/plugins/、全局 composables。

【产出要求】
1. 在你的工作目录生成完整的调研分析报告：`d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_arch_1\survey_arch.md`。必须包含精确的源码文件路径、核心导出对象/方法/字段名称，以及构思出的 Mermaid 架构图谱源码。
2. 保持 progress.md 记录你的分析步骤与 liveness 心跳。
3. 完成后在工作目录下写入自包含的 `handoff.md`，并使用 send_message 通知父编排器报告路径及核心结论。
