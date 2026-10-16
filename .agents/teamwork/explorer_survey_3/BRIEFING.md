# BRIEFING — 2026-10-16T09:33:30Z

## Mission
深入勘查 lipeaks_admin 的高可用 DRF 网络通信层、环境配置与运维部署契约，并制定向最新 PureHttp 底座的平移兼容方案。

## 🔒 My Identity
- Archetype: explorer
- Roles: survey, reverse-engineer, analyst
- Working directory: d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_3
- Original parent: 98bcf59d-d770-40bc-8682-1d24e416edc9
- Milestone: baseline-survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code
- Strictly base conclusions on code ground-truth
- Write all outputs to d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_3
- Output in Chinese

## Current Parent
- Conversation ID: 98bcf59d-d770-40bc-8682-1d24e416edc9
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/utils/http/` (tokenManager.ts, index.ts, errorHandlers.ts, errorCodes.ts, retryManager.ts, types.d.ts)
  - `src/main.ts` (initTokenManager 调用)
  - `src/utils/auth.ts`, `src/store/modules/user.ts`
  - `.env`, `.env.development`, `.env.production`, `.env.staging`
  - `public/platform-config.json`, `vite.config.ts`
  - `Dockerfile`, `docker-compose.yml`, `nginx/default.conf`, `.dockerignore`
- **Key findings**:
  - TokenManager 采用单例，双 Token 存储在 localStorage，具备基于 JWT payload exp 的 5 分钟提前静默预警刷新和 60 秒轮询守护；
  - 401 响应通过 `waitForTokenRefresh()` 和 `pendingRequests` 队列实现并发互斥拦截与自动重试；
  - DRF 异常反解函数 `formatErrorMessage` 精确反解 Django `ErrorDetail`、`non_field_errors`、字段字典错误及单引号 Python 字典字符串；
  - CSRF 注入通过正则动态提取 cookie `csrftoken` 注入 `X-CSRFTOKEN` 头；
  - 运维契约：监听端口 8848，Nginx 必须反向代理 `/api/`、`/backend-static/`、`/media/` 到 `http://web:8000`。
- **Unexplored areas**: 无，所有指定核心任务勘查均已完备。

## Key Decisions Made
- 确立 DRF 高可用网络层必须全套保留并平移的设计，禁止使用官方原生简化版覆盖；
- 梳理清晰的平移融入方案与类型兼容策略，保障上层 API 调用无感。

## Artifact Index
- DISPATCH.md — Orchestrator instructions
- BRIEFING.md — Persistent context & memory
- progress.md — Liveness & step tracking
- report.md — Comprehensive survey report
- handoff.md — Standard 5-component handoff
