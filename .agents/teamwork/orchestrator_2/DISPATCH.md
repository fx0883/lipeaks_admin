## 2026-10-16T09:22:10Z

你作为 Project Orchestrator (编排器)，全权负责执行并将当前项目 `lipeaks_admin`（基于 pure-admin-thin 6.0.0）平滑升级重构为以官方最新 `vue-pure-admin` 完整版（v7.0.0 / Vite 8 / Rolldown / TS 6）为基准的全新底座系统。保留官方组件/功能 Demo 作为独立“示例/开发参考”菜单组，同时完整注入并兼容现存 17 个业务模块与企业级 DRF 网络通信底座。

【工作目录与规范】
- 你的专有工作目录：`d:\Github\lipeaks_admin\.agents\teamwork\orchestrator_2`
- 项目根目录：`d:\Github\lipeaks_admin`
- 权威需求文件：`d:\Github\lipeaks_admin\.agents\teamwork\ORIGINAL_REQUEST.md`（请重点参阅 2026-10-16T09:20:21Z 的 Follow-up 需求）
- 请在此工作目录下维护你的 `BRIEFING.md`、`plan.md` 和 `progress.md`。

【核心任务要求】
1. R1. Git 基线固化与前置安全保障 (Baseline Checkpoint)：
   - 首先对当前工作区的所有未暂存/未提交变更进行一次 Git Commit 固化（提交信息标注为升级前基线），确保历史代码与 `docs/` 文档安全可回溯。
   - 清理源码目录中的非代码历史临时文件（如移除 `src/temp1006/` 临时文档目录、清理废弃的临时集成脚本）。
2. R2. 官方最新 vue-pure-admin 底座同步与环境构建 (Upstream Base Sync)：
   - 获取并引入官方最新 `https://github.com/pure-admin/vue-pure-admin` 架构基座（包含构建依赖、Vite 8/Rolldown/Oxc 配置、TypeScript 6、Vue 3.5、Tailwind CSS v4 等现代工具链）。
   - 升级 `package.json` 全量依赖体系，适配官方规范调整（如 Vue Router 守卫改用 return 语法，全局类型映射调整）。
   - 将官方自带的丰富组件库及配套 Demo 页面完整收拢至独立的“示例/开发参考”菜单组中。
3. R3. 17 个业务视图模块全量注入与兼容性适配 (Business Modules Migration)：
   - 将 17 个核心业务模块及子路由完整迁移并注入到新基座：`admin-user`, `application`, `check-system`, `cms`, `customer`, `dashboard`, `feedback`, `license`, `login`, `member`, `menu`, `notification`, `order`, `permission`, `tenant`, `welcome`, `error`。
   - 迁移全部业务 Pinia Store 模块，确保状态管理、字段与 Getter 无缝适配。
   - 修复基础库升级可能带来的所有类型与组件属性编译报错。
4. R4. DRF 高可用网络层平滑移植与契约保全 (DRF Network Contract Preservation)：
   - 严禁直接使用官方简化的原生拦截器替换现有接口逻辑。必须将高可用 DRF 适配层平移至新基座 `PureHttp` 中：
     1) TokenManager：双 Token 存储、过期前 5 分钟主动预警静默刷新、401 并发互斥重发等待队列。
     2) DRF 异常反解责任链：针对 Django 典型字典错误、字段列表错误、detail 的序列化反解机制。
     3) CSRF 头自动提取与注入：针对 Django Session/Cookie 的 X-CSRFTOKEN 自动提取与请求头注入。
   - 保留全局环境配置及 Docker/Nginx 部署配置文件。

【验收指标】
- `pnpm install` 依赖解析与安装无死锁。
- `pnpm typecheck` 0 报错。
- `pnpm build` 0 错误并产出生产资产。
- 运行时验证：`pnpm dev` 正常启动，登录页正常挂载，17 个业务路由正常访问，Demo 菜单独立可用，DRF 接口请求头及错误解析契约完好。

工作完成后，请产出详尽的 `handoff.md` 并向 Sentinel 汇报完成。
