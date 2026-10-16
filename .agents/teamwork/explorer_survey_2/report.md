# 官方 vue-pure-admin 完整版 (v7.0.0) 架构调研与基座重构方案报告

**报告编号**: SURVEY-EXPLORER-2-001  
**调研日期**: 2026-10-16  
**调研负责人**: Survey Explorer 2  
**上游基准基线**: `https://github.com/pure-admin/vue-pure-admin` (v7.0.0, commit/release 2026-04-07)  
**当前项目基线**: `lipeaks_admin` (pure-admin-thin v6.0.0)

---

## 摘要与核心结论

本次调研针对官方最新 `vue-pure-admin` 完整版（v7.0.0）及其前沿工具链（Vite 8、Rolldown、Oxc、TypeScript 6、Vue 3.5、Tailwind CSS v4 等）展开了全方位的代码逆向比对分析。主要调研成果如下：

1. **新一代现代化构建工具链升级**：官方 v7.0.0 全面转向 Vite 8 + Rolldown + Oxc 底座，配置结构由 `build.rollupOptions` 升级为 `build.rolldownOptions`，TypeScript 升级至 v6 并启用 `allowImportingTsExtensions`，CSS 全面采纳 Tailwind CSS v4 的纯 CSS-first 架构。
2. **依赖生态与构建脚本**：相比精简版（thin），完整版增量引入了包括 `@logicflow/core`、`@vue-flow/core`、`@infectoone/vue-ganttastic`、`vxe-table`、`@wangeditor/editor`、`vditor`、`deep-chat`、`xlsx`、`wavesurfer.js` 在内的 40 余项高阶库，并在 `optimizeDeps.include` 中完成预构建优化。
3. **官方全量资产盘点**：包含 26 个高阶公共组件库（位于 `src/components/`）以及 26 个全场景功能与展示视图目录（位于 `src/views/`）。
4. **Demo 路由规整与“示例/开发参考”收拢架构**：官方原生散落在 `src/router/modules/` 中的 23 个独立顶级路由模块，必须收拢并迁入独立的二级命名空间 `src/router/reference/`，由统一的一级入口 `src/router/modules/reference.ts`（URL: `/reference`，`rank: 999`）统一接管，彻底杜绝 Demo 污染侧边栏，保障 17 个业务模块的纯净与优先展示。
5. **v7.0.0 规范调整与破坏性变更**：
   - Vue Router 导航守卫全面弃用 `next()`，改用基于 `return`（Boolean / RouteLocationRaw）的声明式跳转机制；
   - TSX 全局类型定义重构，引入 PascalCase 到 kebab-case 的模板字面量映射；
   - 全局配置参数重命名（`ShowModel` -> `TagsStyle`, `OverallStyle` -> `ThemeMode`）；
   - **关键防线**：官方 v7.0.0 的原生简化拦截器绝不能替换现有高可用 DRF 网络适配层（必须平移保全 TokenManager 静默双 Token 预警刷新、DRF 异常反解责任链与 CSRF 自动提取注入机制）。

---

## 一、 官方最新完整版 (v7.0.0) 架构调研

### 1.1 核心框架与前沿技术栈矩阵

| 技术分类 | 官方 v7.0.0 完整版规范 | 当前 lipeaks_admin (v6.0.0 thin) | 差异与升级动作 |
| :--- | :--- | :--- | :--- |
| **基础 UI 框架** | Vue `^3.5.43` | Vue `^3.5.13` | 平滑升级，利用 Vue 3.5 响应式引擎优化 |
| **构建打包引擎** | Vite `^8.3.4` (Rolldown + Oxc) | Vite `^6.3.3` (Rollup + esbuild) | **重构构建配置**，迁移至 Rust 驱动的 Rolldown |
| **编程语言/类型系统**| TypeScript `^6.0.3` | TypeScript `^5.8.3` | 适配 TS 6 严格模式与模块扩展语法 |
| **路由核心** | Vue Router `^5.4.0` | Vue Router `^4.5.0` | 守卫全面重构为 `return` 语法 |
| **状态管理** | Pinia `^4.0.3` | Pinia `^3.0.2` | 独立 CDN 解耦，直接集成 |
| **UI 组件底座** | Element Plus `^2.14.7` | Element Plus `^2.9.8` | 适配最新 dialog/drawer/message API 变动 |
| **样式与原子化 CSS** | Tailwind CSS `^4.3.3` + Vite 插件 | Tailwind CSS `^4.1.4` | 引入 `eslint-plugin-better-tailwindcss` 校验 |
| **表格增强套件** | `@pureadmin/table: ^3.3.0` + `vxe-table: 4.6.25` | `@pureadmin/table: ^3.2.1` | 引入 vxe-table 大数据虚拟滚动表格 |
| **代码检查工具** | ESLint `v10.12.0` + Stylelint `v17.16.0` | ESLint `v9.25.1` + Stylelint `v16.19.0` | 升级扁平化配置规则集 |
| **类型检查器** | `vue-tsc: ^3.3.13` | `tsc` + `vue-tsc: ^2.2.10` | 统一简化为 `vue-tsc --noEmit --skipLibCheck` |

### 1.2 现代构建工具链配置变革（Vite 8 / Rolldown / Oxc）

#### (1) `vite.config.ts` 变革
- **异步配置入口**：`export default async ({ mode }: ConfigEnv): Promise<UserConfigExport>`。
- **配置项替换**：旧版构建配置中的 `rollupOptions` 全面更名为 `rolldownOptions`：
  ```ts
  build: {
    target: "es2015",
    sourcemap: false,
    chunkSizeWarningLimit: 4000,
    rolldownOptions: {
      input: {
        index: pathResolve("./index.html", import.meta.url)
      },
      output: {
        chunkFileNames: "static/js/[name]-[hash].js",
        entryFileNames: "static/js/[name]-[hash].js",
        assetFileNames: "static/[ext]/[name]-[hash].[ext]"
      },
      checks: {
        pluginTimings: false,
        toleratedTransform: false
      }
    }
  }
  ```
- **CDN 插件按需动态导入**：
  在 `build/plugins.ts` 中改用动态引入：`VITE_CDN ? (await import("./cdn.ts")).cdn : null`，避免开发环境下执行多余加载。
- **自定义元素支持**：
  针对完整版中的 AI 对话库 `deep-chat`，在 Vue 编译器配置中增加了豁免：
  ```ts
  vue({
    template: {
      compilerOptions: {
        isCustomElement: tag => tag === "deep-chat"
      }
    }
  })
  ```
- **显式扩展名规范**：所有 `build/*.ts` 及根配置文件内部模块导入均显式补齐 `.ts` 扩展名（例如 `import { pathResolve } from "./utils.ts"`）。

---

## 二、 官方完整版依赖体系与配置深度比对

### 2.1 依赖体系（`package.json`）差异清单

官方完整版增量引入了以下专用工程依赖库：

#### (1) 业务与展示功能依赖 (dependencies)
1. **可视化与流程编排**：
   - `@amap/amap-jsapi-loader` (`^1.0.1`)：高德地图 JSAPI 异步加载器；
   - `@logicflow/core` (`^2.2.5`) & `@logicflow/extension` (`^2.3.1`)：滴滴开源的交互式流程图引擎；
   - `@vue-flow/core` (`^1.48.2`) & `@vue-flow/background` (`^1.3.2`)：现代流式节点编排框架；
   - `@infectoone/vue-ganttastic` (`^2.3.2`)：Vue 3 响应式甘特图组件；
   - `wavesurfer.js` (`^7.12.12`)：HTML5 音频波形动态分析与可视化；
   - `echarts` (`^6.1.0`)：企业级图表库最新大版本。
2. **多模式编辑器体系**：
   - `@wangeditor/editor` (`^5.1.23`) & `@wangeditor/editor-for-vue` (`^5.1.12`)：轻量级富文本编辑器；
   - `vditor` (`^3.11.3`)：所见即所得 Markdown 编辑器；
   - `codemirror` (`^5.65.21`) & `codemirror-editor-vue3` (`^2.8.0`)：多语言代码高亮与编辑套件。
3. **表格与数据导出**：
   - `vxe-table` (`4.6.25`)：高性能表格组件（支持虚拟滚动、万级数据秒渲染）；
   - `xlsx` (`^0.18.5`)：Excel 电子表格解析、读取与批量导出；
   - `vue-virtual-scroller` (`^3.0.5`)：海量列表虚拟平铺滚动；
   - `vue-waterfall-plugin-next` (`^2.6.9`)：瀑布流自适应布局插件。
4. **UI 特效与实用交互工具**：
   - `deep-chat` (`^2.5.1`)：开箱即用的现代化 AI 对话/LLM 交互界面；
   - `swiper` (`^14.3.0`)：触控滑块与轮播切换组件；
   - `typeit` (`^8.8.7`)：打字机文本动态逐字显现；
   - `intro.js` (`^7.2.0`)：用户引导指引蒙层；
   - `cropperjs` (`^1.7.0`)：图片缩放、旋转与精准裁剪；
   - `qrcode` (`^1.5.4`) & `jsbarcode` (`^3.12.3`)：二维码与一维条形码渲染；
   - `vue-pdf-embed` (`^2.1.7`)：PDF 文档嵌入渲染；
   - `vue3-danmaku` (`^1.6.7`)：弹幕展示组件；
   - `vue3-puzzle-vcode` (`^1.1.7`)：拼图滑块验证码；
   - `v-contextmenu` (`^3.2.0`) & `@howdyjs/mouse-menu` (`^2.1.7`)：右键浮动上下文菜单；
   - `vuedraggable` (`^4.1.0`)：基于 Sortable.js 的视图拖拽组件；
   - `xgplayer` (`^3.0.26`)：西瓜播放器视频容器；
   - `plus-pro-components` (`^0.1.31`)：JSON 配置驱动的高阶表单/表格拓展套件；
   - `china-area-data` (`^5.0.1`)：全国行政区划三级联动数据字典；
   - `mint-filter` (`^4.0.3`)：基于 Aho-Corasick 算法的敏感词高效过滤；
   - `mqtt` (`4.3.7`)：MQTT 物联网协议实时长连接通信；
   - `@zxcvbn-ts/core` (`^4.2.0`)：现实世界密码强度估算评估器；
   - `version-rocket` (`^1.7.4`)：生产部署版本更新智能提示器。

#### (2) 开发依赖 (devDependencies)
- `@eslint/js: ^10.0.1`, `eslint: ^10.12.0`, `eslint-config-prettier: ^10.1.8`
- `eslint-plugin-better-tailwindcss: ^4.9.0`
- `stylelint: ^17.16.0`, `stylelint-config-standard-scss: ^17.0.0`
- `typescript: ^6.0.3`, `typescript-eslint: ^8.71.1`
- `vite: ^8.3.4`, `vite-plugin-router-warn: ^3.0.0`
- `vue-tsc: ^3.3.13`

### 2.2 构建预优化 (`build/optimize.ts`) 变更

完整版将 50+ 个核心依赖纳入 `optimizeDeps.include`，避免开发环境首次加载时由于浏览器缓存缺失或零散按需加载引发的页面卡顿与重复构建瀑布流。

### 2.3 TypeScript 编译选项差异 (`tsconfig.json`)

| 配置字段 | 官方 v7.0.0 完整版 | lipeaks_admin 旧版 | 影响与说明 |
| :--- | :--- | :--- | :--- |
| `"allowImportingTsExtensions"` | `true` | 无 | 允许使用显式 `.ts` 扩展名导入文件 |
| `"noEmit"` | `true` | 无 | 交由构建工具发包，TS 纯用于静态检查 |
| `"jsxImportSource"` | `"vue"` | 无 | 明确 JSX 运行时绑定 Vue 3 核心 |
| `"baseUrl"` | 移除 | `"."` | 遵循现代 TS 模块解析，统一由 `paths` 控制 |
| `"importHelpers"` / `"experimentalDecorators"` | 移除 | `true` | 移除已弃用或不必要的历史辅助项 |
| `"include"` | 补充 `"build/*.ts"` | 仅包含 mock, src, types | 将构建脚本纳入统一类型安全管控 |

### 2.4 Scripts 脚本对比

- `typecheck` 由 `tsc --noEmit && vue-tsc --noEmit --skipLibCheck` 精简为单一高效的 `vue-tsc --noEmit --skipLibCheck`。
- `build` 补充了构建后自动生成版本比对文件的命令：`&& generate-version-file`（由 `version-rocket` 驱动）。

---

## 三、 官方完整版组件库与示例页面全量勘验

### 3.1 官方公共组件库勘验 (`src/components/`，共 26 个)

官方完整版在 `src/components/` 中提供了极其完备的开箱即用高阶封装组件，具体清单与职责如下：

```
src/components/
├── ReAnimateSelector/      # CSS 动画选择器（支持预置多款动态进入/退出动效）
├── ReAuth/                 # 基于插槽的权限包裹校验组件（角色模式与权限码模式）
├── ReBarcode/              # 条形码生成器（封装 JsBarcode，支持格式与宽高定制）
├── ReCol/                  # 响应式布局栅格列二次封装
├── ReCountTo/              # 数字平滑递增滚动动效（支持千分位与缓动函数）
├── ReCropper/              # 模态弹窗式图片裁剪器（基于 Cropper.js）
├── ReCropperPreview/       # 图片裁剪缩略图与即时预览面板
├── ReDialog/               # 函数式弹窗服务（addDialog，支持拖拽、最大化、多弹窗堆叠与全生命周期拦截）
├── ReDrawer/               # 函数式抽屉服务（addDrawer，支持上下文透传与异步表单联动）
├── ReFlicker/              # 状态呼吸灯与脉冲圆点提示组件
├── ReFlop/                 # 翻牌式动态时间与数字时钟组件
├── ReFlowChart/            # LogicFlow 流程设计画板（支持节点拓扑与边关系管理）
├── ReIcon/                 # 全局统一图标渲染系统（离线 SVG / 在线 Iconify / FontIcon）
├── ReImageVerify/          # Canvas 动态验证码生成组件
├── ReMap/                  # 高德地图容器组件（支持坐标拾取与标记）
├── RePerms/                # 细粒度操作权限判断指令与包裹组件
├── RePureTableBar/         # PureTable 专属增强工具栏（列筛选、密度缩放、固定列、全量文本国际化）
├── ReQrcode/               # 二维码生成组件（支持嵌入中心 Logo、颜色与纠错级别设置）
├── ReSeamlessScroll/       # 高性能平滑无缝滚动容器（适合大屏与通知公告）
├── ReSegmented/            # iOS 风格分段滑动控制器（单选与视图状态切换）
├── ReSelector/             # 范围选择器（用于数据区间跨度选择）
├── ReSplitPane/            # 拖拽式分割面板（支持水平与垂直任意比例分割）
├── ReText/                 # 智能文本截断省略组件（支持 Tooltip 自动浮显）
├── ReTreeLine/             # Element Plus 树形组件连接线美化组件
├── ReTypeit/               # 打字机字符动画输出组件
└── ReVxeTableBar/          # VxeTable 专属增强工具栏（列显示控制与操作集成）
```

### 3.2 官方示例页面全量勘验 (`src/views/`，共 26 个目录)

官方完整版在 `src/views/` 下自带了全套开发参考与功能展示页面：

1. **`able/`**（高频能力集合）：
   - `print/`（页面与局部打印）
   - `watermark/`（局部与防篡改页面水印）
   - `debounce/`（防抖与节流测试）
   - `line-tree/`（树形连接线效果）
   - `ant-anchor/`（仿 Ant Design 锚点定位导航）
   - `excel/`（Excel 文件导入与格式化导出）
   - `pdf/`（PDF 预览与分页控制）
   - `download/`（二进制与静态文件下载）
   - `barcode/` & `qrcode/`（条码与二维码展示）
   - `cropper/`（图片裁剪演练）
   - `draggable/`（表格行/列/卡片拖拽重排）
   - `sensitive/`（敏感词实时检测与高亮替换）
   - `infinite-scroll/`（无限加载瀑布流）
2. **`components/`**（UI 组件实战）：
   - `message/`（ElMessage 与自定义弹层封装演练）
   - `dialog/`（ReDialog 函数式弹框场景）
   - `drawer/`（ReDrawer 函数式抽屉场景）
   - `animatecss/`（动画选择器）
   - `count-to/`（数字翻滚计数）
   - `segmented/`（分段选择器）
   - `seamless-scroll/`（无缝滚动公告）
   - `split-pane/`（可调节分割面板）
   - `text/`（文本省略提示）
   - `video/`（西瓜播放器音视频播放）
   - `map/`（高德地图标记）
3. **`table/`**（表格全景示例）：
   - `index.vue`（基础 PureTable）
   - `high.vue`（高阶表格：合并单元格、多级表头、列拖拽）
   - `edit.vue`（单元格即时编辑与行内表单校验）
   - `virtual.vue`（基于 VxeTable 的万行数据虚拟列表秒级渲染）
4. **`schema-form/`**（配置化表单）：
   - 基于 PlusProComponents 的 JSON 驱动表单生成、联动校验与分步表单。
5. **`flow-chart/` & `vue-flow/`**（可视化图表与工作流）：
   - 基于 LogicFlow 与 VueFlow 的流程图绘制、节点拖拽、属性编辑与连线引擎。
6. **`editor/`, `markdown/`, `codemirror/`**（编辑器套件）：
   - 富文本编辑器、所见即所得 Markdown 编辑器与多语言代码高亮编辑器。
7. **`ganttastic/`**（甘特图）：
   - 交互式任务时间轴与进度条拖拽排期。
8. **`chatai/`**（智能对话）：
   - 基于 DeepChat 的现代 LLM 对话界面。
9. **`list/`**（列表形态）：
   - 卡片式网格列表与经典搜索列表。
10. **`monitor/`, `system/`, `nested/`, `tabs/`, `result/`, `guide/`, `menuoverflow/`** 等支撑演示视图。

---

## 四、 官方 Demo 路由规整与“示例/开发参考”收拢架构方案

### 4.1 核心问题诊断与冲突剖析

官方完整版的默认静态路由加载逻辑位于 `src/router/index.ts`：
```ts
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  { eager: true }
);
```
官方将 23 个独立的 Demo 路由配置文件平铺在 `src/router/modules/` 目录下（`able.ts`, `table.ts`, `components.ts`, `flowchart.ts`, `nested.ts` 等），各自拥有独立的 `rank: 1 ~ 27`，全部被作为一级顶级菜单渲染到侧边栏。

**如果不做规整处理**：
- 侧边栏将被 23 个 Demo 菜单充斥覆盖；
- 系统的 17 个主业务模块（`admin-user`, `application`, `tenant`, `order`, `customer`, `license` 等）将被挤压或严重割裂；
- 系统失去商业生产系统的纯粹性，给运营和最终用户带来严重混淆。

### 4.2 路由收拢架构设计方案

为实现“**保留官方全量 Demo 供开发参考，但绝不污染主业务路由与菜单**”，采取以下架构方案：

```mermaid
graph TD
    subgraph 路由物理组织 (src/router/)
        subgraph modules 自动扫描目录 (src/router/modules/)
            Home[home.ts - 首页]
            Remaining[remaining.ts - 登录/异常页]
            RefModule[reference.ts - 示例开发参考统一入口]
        end
        
        subgraph reference 专属隔离目录 (src/router/reference/)
            AbleDemo[able.ts]
            TableDemo[table.ts]
            CompDemo[components.ts]
            FormDemo[form.ts]
            FlowDemo[flowchart.ts & vueflow.ts]
            EditorDemo[editor.ts & markdown.ts]
            AiDemo[chatai.ts]
            OtherDemo[nested.ts, list.ts, etc.]
        end
        
        RefModule -->|统一聚合引用| reference
    end

    subgraph 菜单与路由呈现
        BizRoutes[后端动态返回 17 个业务模块] -->|Rank 1 ~ 100| SideBar[侧边栏菜单主视图]
        Home -->|Rank 0 首位| SideBar
        RefModule -->|Rank 999 兜底置底| SideBar
    end
```

#### 具体实施路径：

1. **创建独立路由隔离目录 `src/router/reference/`**：
   - 将官方 `src/router/modules/` 下的 23 个 Demo 路由文件整体移入 `src/router/reference/`（避开 `./modules/**/*.ts` 的自动匹配）。
   - 保留各 Demo 模块原有的子路由配置与视图动态导入路径（`() => import("@/views/table/index.vue")` 等）。

2. **新建“示例/开发参考”统一顶级路由文件 `src/router/modules/reference.ts`**：
   - 在 `src/router/modules/` 中仅暴露一个单点入口：
   ```ts
   import { $t } from "@/plugins/i18n";
   import tableRoutes from "../reference/table";
   import componentRoutes from "../reference/components";
   import ableRoutes from "../reference/able";
   import formRoutes from "../reference/form";
   import flowchartRoutes from "../reference/flowchart";
   import vueflowRoutes from "../reference/vueflow";
   import editorRoutes from "../reference/editor";
   import markdownRoutes from "../reference/markdown";
   import codemirrorRoutes from "../reference/codemirror";
   import ganttasticRoutes from "../reference/ganttastic";
   import chataiRoutes from "../reference/chatai";
   import listRoutes from "../reference/list";
   import nestedRoutes from "../reference/nested";
   import resultRoutes from "../reference/result";
   import tabsRoutes from "../reference/tabs";
   import guideRoutes from "../reference/guide";
   import boardRoutes from "../reference/board";
   import pptRoutes from "../reference/ppt";
   import mindRoutes from "../reference/mind";

   export default {
     path: "/reference",
     redirect: "/reference/components/message",
     meta: {
       icon: "ri:tools-line",
       title: $t("menus.pureDevReference") || "示例/开发参考",
       rank: 999, // 严格排在所有业务路由最末尾
       roles: ["admin"] // 可按需限定仅管理员可见
     },
     children: [
       componentRoutes,
       tableRoutes,
       formRoutes,
       ableRoutes,
       flowchartRoutes,
       vueflowRoutes,
       ganttasticRoutes,
       editorRoutes,
       markdownRoutes,
       codemirrorRoutes,
       chataiRoutes,
       listRoutes,
       nestedRoutes,
       resultRoutes,
       tabsRoutes,
       guideRoutes,
       boardRoutes,
       pptRoutes,
       mindRoutes
     ]
   } satisfies RouteConfigsTable;
   ```

3. **路由拍平与多级菜单的天然兼容性**：
   - PureAdmin 原生内置了 `formatTwoStageRoutes` 与 `formatFlatteningRoutes`：
     - **物理路由**：三级及以上的路由在底层会被自动拍平为挂载在根 Layout 下的二级路由，页面跳转与 `<keep-alive>` 缓存完全不受多层嵌套影响；
     - **侧边栏展示**：`constantMenus` 保留原始的父子树状层级，侧边栏菜单将优雅地渲染为折叠的“示例/开发参考”大类，展开后清晰呈现“组件”、“表格”、“表单”、“流程图”等分类子菜单。

4. **URL 命名空间规范**：
   - 将子路由的 `path` 统一规范为 `/reference/<module>/<page>`（例如 `/reference/table/index`、`/reference/components/message`），杜绝与现有及未来业务模块产生路径冲突。
   - 在国际化文件（`locales/zh-CN.yaml` 与 `en.yaml`）中补充：
     - `pureDevReference: 示例/开发参考`
     - `pureDevReference: Dev Reference`

---

## 五、 官方 v7.0.0 规范调整与破坏性变更（Breaking Changes）分析

在基座升级过程中，必须严格遵循以下 5 大规范调整，规避潜在编译与运行时故障：

### 5.1 Vue Router 导航守卫全面改用 `return` 语法

- **变更事实**：在 `vue-router` 最新规范中，导航守卫中的 `next()` 回调已进入废弃周期，v7.0.0 正式全面移除 `next()` 参数。
- **新老代码范式对比**：
  ```ts
  // ❌ 旧版 (v6.0.0 传统回调写法 - src/router/index.ts)
  router.beforeEach((to, _from, next) => {
    if (!token && to.path !== "/login") {
      next({ path: "/login" });
    } else {
      next();
    }
  });

  // ✅ 新版 (v7.0.0 return 响应式写法 - src/router/index.ts)
  router.beforeEach((to, _from) => {
    if (!token && to.path !== "/login") {
      return { path: "/login" };
    }
    return true; // 或直接 return (undefined 代表放行)
  });
  ```
- **核心适配规则**：
  1. 放行继续导航：`return true` 或 `return`；
  2. 中断当前导航：`return false`；
  3. 重定向到新路由：`return { path: "/login" }` 或 `return "/login"`；
  4. 外部链接跳转：执行 `openLink(...)` 后显式 `return false` 终止路由跳转。

### 5.2 全局类型定义重构与 TSX kebab-case 标签类型映射

- **变更事实**：TypeScript 6 与 Vue 3.5 下，官方重构了 `types/` 声明体系。
- **关键新增文件**：`types/shims-tsx.d.ts`：
  ```ts
  type CamelToKebab<S extends string> = ...;
  type PascalToKebab<S extends string> = ...;

  type KebabComponents = {
    [K in keyof import("vue").GlobalComponents as PascalToKebab<
      K & string
    >]: InstanceType<import("vue").GlobalComponents[K]>["$props"] & ReservedProps;
  };

  declare module "vue/jsx-runtime" {
    namespace JSX {
      interface IntrinsicElements extends KebabComponents {}
    }
  }
  ```
- **技术收益**：开发者在 `.tsx` 组件中编写 `<el-button>` 或 `<re-icon>` 等连字符标签时，TypeScript 能够精准推导出对应组件的 Props 类型，消除了 TS 报错并提供代码补全。
- **全局指令规范化**：`types/directives.d.ts` 中通过 `declare module "vue" { interface GlobalDirectives { ... } }` 强类型定义了 `vAuth`, `vPerms`, `vCopy`, `vRipple`, `vOptimize` 等内置指令。

### 5.3 平台配置文件关键属性重命名

- **变更事实**：官方为提升语义清晰度，重构了 `public/platform-config.json` 中的字段：
  - `ShowModel: "smart"` ➜ **重命名为** `TagsStyle: "smart"`（标签页风格：smart 灵动 / card 卡片 / chrome 谷歌）；
  - `OverallStyle: "light"` ➜ **重命名为** `ThemeMode: "light"`（主题模式：light 浅色 / dark 深色 / system 自动）；
  - 新增 `Watermark: false`（全屏水印开关）与 `MapConfigure: { ... }`（高德地图密钥与默认中心点）。
- **联动影响范围**：
  - `src/config/index.ts`（平台配置读取器中的类型定义 `PlatformConfigs`）；
  - `src/store/modules/app.ts` 与 `settings.ts`；
  - `src/layout/components/setting/index.vue`（系统配置面板中的响应式绑定）。

### 5.4 Tailwind CSS v4 现代化演进规则

- **变更事实**：Tailwind CSS v4 移除了传统的 JavaScript 配置文件 `tailwind.config.js`，改为纯 CSS 声明驱动（CSS-first）。
- **开发与样式编写变化**：
  1. 默认边框颜色在 v4 中变为了 `currentColor`，PureAdmin 在 `src/style/tailwind.css` 中显式增加了向下兼容垫片：
     ```css
     @layer base {
       *, ::after, ::before, ::backdrop, ::file-selector-button {
         border-color: var(--color-gray-200, currentColor);
       }
     }
     ```
  2. `!important` 样式书写由前置 `!w-full` 规范为后缀表达式 `w-full!`（如 `dark:hover:bg-[#242424]!`）。
  3. 引入 `eslint-plugin-better-tailwindcss` 进行类名规范检测。

### 5.5 DRF 高可用网络层平滑移植与契约保全红线（关键安全边界）

**特别风险预警**：
官方最新 v7.0.0 完整版的 `src/utils/http/index.ts` 仅实现了最基础的 `{ code: 0, message: "...", data: ... }` 拦截解析逻辑。

然而，`lipeaks_admin` 项目后端为标准的 Django REST Framework (DRF) 架构，当前生产环境运行的 `PureHttp`（共 681 行）深度集成了经过严苛检验的企业级特性：

```mermaid
flowchart TD
    Req[前端发起 API 请求] --> InterceptReq[请求拦截器]
    InterceptReq --> CheckToken{TokenManager 校验双 Token}
    CheckToken -->|距离过期 <= 5 分钟| SilentRefresh[主动静默预警刷新 Token]
    CheckToken -->|未过期| InjectAuth[注入 Authorization: Bearer token]
    SilentRefresh --> InjectAuth
    InjectAuth --> InjectCSRF[提取 Cookie 自动注入 X-CSRFTOKEN]
    InjectCSRF --> AxiosSend[发送 HTTP 请求]
    
    AxiosSend --> Resp{响应状态}
    Resp -->|200 OK| ParseData[返回 DRF 数据 / 分页 results]
    Resp -->|401 Unauthorized| MutexQueue{401 并发互斥等待队列}
    MutexQueue -->|首个失效请求| RefreshExec[执行 refresh-token 换票]
    MutexQueue -->|并发次生请求| WaitQueue[挂起等待新 Token 重放]
    RefreshExec -->|刷新成功| Replay[批量重发队列中请求]
    RefreshExec -->|刷新失败| ClearAuth[清空认证跳转 /login]
    
    Resp -->|400/403/500 Error| ErrorChain[DRF 异常反解责任链]
    ErrorChain --> ExtractNonField[反解 non_field_errors]
    ErrorChain --> ExtractFieldList[反解 {'field': [ErrorDetail...]}]
    ErrorChain --> ExtractDetail[反解 detail / message 字段]
    ExtractDetail --> NoticeUI[ElMessage 精准错误通知]
```

**移植执行准则**：
1. **绝对禁止**使用官方原生精简版 `PureHttp` 替换现有的 `src/utils/http/`；
2. **整包平移**：必须完整保留并迁移 `src/utils/http/tokenManager.ts`、`src/utils/http/errorCodes.ts`、`src/utils/http/errorHandlers.ts` 及 `src/utils/http/index.ts`；
3. **适配升级点**：仅需微调 `PureHttp` 中与 Axios 1.18+ / TS 6 严格模式匹配的极少数泛型类型定义，确保高可用 DRF 契约 100% 得到继承。

---

## 六、 17 个主业务模块兼容性适配建议

在平滑迁移现存 17 个业务模块（`admin-user`, `application`, `check-system`, `cms`, `customer`, `dashboard`, `feedback`, `license`, `login`, `member`, `menu`, `notification`, `order`, `permission`, `tenant`, `welcome`, `error`）时，重点适配关注项如下：

1. **动态路由映射组件解析器**：
   - 保留 `src/router/utils.ts` 中针对 DRF 后端返回组件路径（如 `"Layout1"`、`"/src/views/tenant/list.vue"`、`"tenant/list"`）的精确匹配算法与 `.vue` 扩展名补全容错逻辑。
2. **Pinia 业务 Store 兼容**：
   - 现存业务 Pinia Store 全面适配 Pinia 4.x，需确保在 Store 外部调用时通过封装好的 `useXxxStoreHook()` 挂载实例。
3. **宏定义与组件属性校验**：
   - 针对 Vue 3.5 的 `defineProps` 响应式解构新特性与 TypeScript 6 严格模式，修复各业务模块中可能存在的隐式 `any` 或可选字段解构缺失。
4. **多语言词条整合**：
   - 将 `lipeaks_admin` 现存庞大的 2800+ 行 `locales/zh-CN.yaml` 业务词条与官方新底座的系统词条完成无缝合并，严防业务多语言词条丢失。

---

## 七、 总结与交接指引

本次调研全面厘清了官方最新 `vue-pure-admin` v7.0.0 完整版的底座特征、构建工具链、组件库资产、示例页面分布、路由规整方案以及破坏性变更点。详细结论已固化为后续基座重构的理论与工程依据。
