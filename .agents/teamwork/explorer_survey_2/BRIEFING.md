# BRIEFING — 2026-10-16T09:42:00Z

## Mission
针对官方最新 vue-pure-admin 完整版 (v7.0.0 / Vite 8 / Rolldown / TS 6 / Vue 3.5 / Tailwind CSS v4) 展开全面架构调研，梳理依赖体系、构建配置、组件库与示例页面、路由收拢策略及 v7 破坏性规范调整，形成工程级勘验报告。

## 🔒 My Identity
- Archetype: explorer
- Roles: survey, read-only investigation, architecture analysis
- Working directory: d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_2
- Original parent: 98bcf59d-d770-40bc-8682-1d24e416edc9
- Milestone: M1 勘查调研阶段

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- 严格在工作目录 .agents/teamwork/explorer_survey_2 内操作，严禁污染源码目录
- 恪守 KISS 原则，事实为本
- 所有回复、思考过程及任务清单，均须使用中文

## Current Parent
- Conversation ID: 98bcf59d-d770-40bc-8682-1d24e416edc9
- Updated: 2026-10-16T09:42:00Z

## Investigation State
- **Explored paths**:
  - `d:\Github\lipeaks_admin\.agents\teamwork\ORIGINAL_REQUEST.md`
  - 官方上游仓库全量源码及 CHANGELOG (`vue-pure-admin` v7.0.0)
  - `package.json`, `vite.config.ts`, `tsconfig.json`, `build/plugins.ts`, `build/optimize.ts`, `src/style/tailwind.css`
  - 官方组件库 `src/components/`（26 个组件目录）、示例页面 `src/views/`（26 个页面目录）
  - 官方路由机制 `src/router/modules/`（24 个文件）与 `src/router/utils.ts`, `src/router/index.ts`
  - 现存项目 `lipeaks_admin` 的 DRF 核心网络底座 `src/utils/http/index.ts`（681 行）与路由动态映射逻辑
- **Key findings**:
  - Vite 8 + Rolldown 带来 `build.rolldownOptions` 与异步配置入口变更
  - TS 6 + Vue 3.5 引入 `allowImportingTsExtensions` 与 TSX kebab-case 类型映射
  - 官方 Demo 路由必须移入 `src/router/reference/` 并由单一入口 `src/router/modules/reference.ts`（`rank: 999`）统一收拢
  - Vue Router 导航守卫全面改用 `return` 语法弃用 `next()`
  - DRF 高可用网络层（TokenManager 静默刷新 + 401 队列 + 异常反解责任链 + CSRF）必须完整保全平移
- **Unexplored areas**: 无，上游及现有相关源码已 100% 勘查确证

## Key Decisions Made
- 确立“创建 `src/router/reference/` 目录隔离 23 个 Demo 模块，由 `src/router/modules/reference.ts` 统一输出为顶级二级折叠菜单”的最佳方案
- 确立“DRF 网络适配层必须整包平移保全，严禁被官方简版覆盖”的工程红线

## Artifact Index
- `.agents/teamwork/explorer_survey_2/DISPATCH.md` — 初始调度任务记录
- `.agents/teamwork/explorer_survey_2/BRIEFING.md` — 长期工作记忆
- `.agents/teamwork/explorer_survey_2/progress.md` — 进度与存活心跳
- `.agents/teamwork/explorer_survey_2/report.md` — 最终调研报告
- `.agents/teamwork/explorer_survey_2/handoff.md` — 5段式交接文档
