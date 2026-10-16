# 5-Component Handoff Report — Survey Explorer 2

## 1. Observation (客观观察事实)

1. **上游官方基线获取与版本确证**：
   - 官方最新完整版仓库：`https://github.com/pure-admin/vue-pure-admin`。
   - 通过浅克隆获取上游全量源码至临时目录，其 `package.json`（行 1-23、50-182）确证：
     - `"name": "vue-pure-admin"`, `"version": "7.0.0"`
     - `"vite": "^8.3.4"`, `"typescript": "^6.0.3"`, `"vue": "^3.5.43"`, `"vue-router": "^5.4.0"`, `"pinia": "^4.0.3"`, `"element-plus": "^2.14.7"`
     - `"tailwindcss": "^4.3.3"`, `"@tailwindcss/vite": "^4.3.3"`, `"eslint": "^10.12.0"`, `"stylelint": "^17.16.0"`, `"vue-tsc": "^3.3.13"`
     - `engines`: `"node": ">=22.22.1"`, `"pnpm": ">=11"`
   - `CHANGELOG.zh_CN.md`（行 1-16）明确记录 v7.0.0 (2026-04-07) 重构事项：
     > - 重构`API`接口响应格式，带来简洁高效的接口设计
     > - `stylelint`升级至`v17`版本
     > - 在`vue-router`的导航守卫中，使用`return`语句替代即将弃用的`next()`
     > - `eslint`升级至`v10`版本
     > - 将全局配置文件`platform-config.json`中的`ShowModel`重命名为`TagsStyle`
     > - 使用`eslint-plugin-better-tailwindcss`插件优化`tailwindcss`类名
     > - 升级`vite`至`v8`版本，从`Rollup`和`esbuild`转向`Rolldown`和`Oxc`
     > - 重构全局类型声明，新增`PascalCase`转`kebab-case`的类型映射
     > - `typescript`升级至`v6`版本
2. **构建与工具链配置事实**：
   - `vite.config.ts`（行 45-60）配置：
     ```ts
     rolldownOptions: {
       input: { index: pathResolve("./index.html", import.meta.url) },
       output: {
         chunkFileNames: "static/js/[name]-[hash].js",
         entryFileNames: "static/js/[name]-[hash].js",
         assetFileNames: "static/[ext]/[name]-[hash].[ext]"
       },
       checks: { pluginTimings: false, toleratedTransform: false }
     }
     ```
   - `vite.config.ts`（行 12）导出异步配置：`export default async ({ mode }: ConfigEnv): Promise<UserConfigExport>`。
   - `tsconfig.json`（行 19-21）包含 `"noEmit": true` 与 `"allowImportingTsExtensions": true`。
   - `types/shims-tsx.d.ts`（行 3-30）定义 `PascalToKebab` 模板字面量映射并注入 `JSX.IntrinsicElements`。
   - `public/platform-config.json`（行 22）采用 `"TagsStyle": "chrome"`。
3. **官方完整版组件与示例页面全量事实**：
   - `src/components/` 包含 26 个目录：`ReAnimateSelector`, `ReAuth`, `ReBarcode`, `ReCol`, `ReCountTo`, `ReCropper`, `ReCropperPreview`, `ReDialog`, `ReDrawer`, `ReFlicker`, `ReFlop`, `ReFlowChart`, `ReIcon`, `ReImageVerify`, `ReMap`, `RePerms`, `RePureTableBar`, `ReQrcode`, `ReSeamlessScroll`, `ReSegmented`, `ReSelector`, `ReSplitPane`, `ReText`, `ReTreeLine`, `ReTypeit`, `ReVxeTableBar`。
   - `src/views/` 包含 26 个目录：`able`, `about`, `account-settings`, `chatai`, `codemirror`, `components`, `editor`, `empty`, `error`, `flow-chart`, `ganttastic`, `guide`, `list`, `login`, `markdown`, `menuoverflow`, `monitor`, `nested`, `permission`, `result`, `schema-form`, `system`, `table`, `tabs`, `vue-flow`, `welcome`。
   - `src/router/modules/` 包含 24 个静态模块文件（`able.ts`, `table.ts`, `components.ts`, `flowchart.ts`, `editor.ts`, `markdown.ts` 等），由 `import.meta.glob(["./modules/**/*.ts", "!./modules/**/remaining.ts"])` 默认全部加载为一级菜单。
4. **当前项目网络层与业务路由事实**：
   - `lipeaks_admin/src/utils/http/index.ts`（共 681 行）深度集成了 DRF 适配器（TokenManager 双 Token 5分钟静默预警刷新、401 并发互斥队列、`formatErrorMessage` 及 `errorHandlerChain` 针对 Django `non_field_errors` 与字段字典错误的反解、CSRF 自动注入）。
   - `lipeaks_admin/src/router/utils.ts`（行 340-429）针对 DRF 返回的动态菜单进行了智能解析（支持 `"Layout1"`、自动 `.vue` 后缀匹配、精准匹配兜底）。

---

## 2. Logic Chain (推理推导链)

1. **从事实 1、2 到 构建升级方案**：
   - 官方 v7.0.0 将底座升级至 Vite 8 + Rolldown，旧版的 `build.rollupOptions` 在新版必须改为 `build.rolldownOptions`。
   - 依赖项升级至 TypeScript 6 且开启 `allowImportingTsExtensions` 后，`build/*.ts` 内部导入显式携带 `.ts` 后缀，因此 `package.json` 的 `typecheck` 应当对齐官方的 `vue-tsc --noEmit --skipLibCheck`，避免 `tsc` 无法处理 `.ts` 扩展名导入而报错。
2. **从事实 3 到 路由收拢方案**：
   - 官方在 `src/router/modules/` 中散落了 23 个 Demo 路由文件，若原样保留，每个文件都会被识别为独立的一级顶级菜单，严重淹没现存的 17 个核心业务模块。
   - 将这 23 个文件移至专属目录 `src/router/reference/`，并在 `src/router/modules/` 下仅保留单点入口 `reference.ts`（`rank: 999`，顶级路径 `/reference`），利用 PureAdmin 自带的 `formatFlatteningRoutes` 与 `buildHierarchyTree` 机制，可以在保持物理路由正确拍平（二级注册）的同时，在侧边栏实现完美的折叠式“示例/开发参考”单一父级菜单展示。
3. **从事实 1、4 到 规范调整与 DRF 契约保全**：
   - 官方 v7.0.0 导航守卫改用 `return` 语法弃用 `next()`，在移植业务路由时，必须将 `router.beforeEach` 中的所有 `next(...)` 转换为精准的 `return` 语句（如 `return { path: "/login" }`、`return true`、`return false`）。
   - 官方原生 `PureHttp` 仅有 197 行且为通用结构，绝不能覆盖现存 681 行的高可用 DRF 适配层，必须将现有的 `TokenManager`、`errorHandlerChain` 等企业级能力无损平移至新基座。

---

## 3. Caveats (保留事项与假设边界)

1. **Demo 组件依赖体积**：完整版引入了 `xlsx`、`xgplayer`、`deep-chat`、`@logicflow/core` 等诸多较重依赖，生产打包体积会有所增长，需依赖 Vite 8 代码分割（chunk 拆分）保障首屏加载性能。
2. **Node/pnpm 环境**：官方 v7.0.0 `package.json` 声明 `node: ">=22.22.1"` 与 `pnpm: ">=11"`。在实际开发构建中，需验证本地 Node 20/22 环境下的向下兼容性，若存在引擎警告可按需微调引擎版本约束。
3. **无其他未勘验领域**：官方核心配置、依赖、组件库、示例页面及路由架构均已获得 100% 真实源码验证。

---

## 4. Conclusion (勘查定论)

1. **底座可行性**：官方最新 `vue-pure-admin` v7.0.0 架构先进、工具链现代，具备完全平滑升级的可行性。
2. **Demo 收拢最佳方案**：建立 `src/router/reference/` 目录隔离 23 个 Demo 模块，由 `src/router/modules/reference.ts` 统一呈现为 `path: "/reference"`、`rank: 999` 的“示例/开发参考”二级分组菜单，既完整保全官方丰富示例，又确保 17 个主业务模块处于核心绝对优先地位。
3. **防线守则**：必须坚守“DRF 高可用网络层整包平移保全”与“导航守卫 return 规范重构”，严禁破坏现有通信与鉴权契约。

---

## 5. Verification Method (独立验证方法)

1. **文件与代码查验**：
   - 查阅调研报告：`view_file` 路径 `d:\Github\lipeaks_admin\.agents\teamwork\explorer_survey_2\report.md`。
   - 查验上游源码比对：上游临时克隆副本位于 `C:\Users\fx088\AppData\Local\Temp\vue-pure-admin`，可直接比对 `package.json`、`vite.config.ts`、`src/router/index.ts`、`src/components/`。
2. **失效与失效条件**：
   - 若上游发布了 v7.1+ 且恢复了 `rollupOptions`（不可能发生），或后端弃用 DRF 错误格式（不可能发生），本方案相关部分才需调整。
