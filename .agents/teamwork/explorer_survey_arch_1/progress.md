# Investigation Progress

Last visited: 2026-10-16T16:19:15+08:00

## Tasks
- [x] 初始化环境与工作文件 (DISPATCH.md, BRIEFING.md, progress.md)
- [x] 模块 1：工程化与构建配置逆向调研 (package.json, vite.config.ts, tsconfig, env, eslint/prettier/stylelint/commitlint, docker/nginx, build 目录源码分析)
- [x] 模块 2：系统分层与依赖流向分析 (src/ 目录结构, main.ts, 启动装配链路, 各层职责边界)
- [x] 模块 3：网络通信层封装分析 (PureHttp 类, Axios 实例, TokenManager 并发刷新与预刷新, ErrorHandlerChain 责任链, 错误码映射与 DRF 解析)
- [x] 模块 4：全局状态管理机制分析 (Pinia store, user/permission/app/settings/multiTags/epTheme 及 9 大业务 Store, responsive-storage 响应式持久化, 登出清理)
- [x] 模块 5：路由与权限系统分析 (静态 glob 导入, 动态 getAsyncRoutes, addAsyncRoutes 与模块映射, 扁平化两级路由转换, 导航守卫 beforeEach, 双重按钮权限 v-perms / v-auth)
- [x] 模块 6：布局与全局组件/指令/插件分析 (src/layout/ 3 种布局与响应式自适应, 全局指令, 核心插件, 业务与通用 Composables)
- [x] 产出架构报告 survey_arch.md (包含 Mermaid 图谱与源码证据链)
- [x] 产出 5 要素交接文档 handoff.md 并通知父编排器
