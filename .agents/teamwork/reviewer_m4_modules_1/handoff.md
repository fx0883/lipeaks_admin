# 业务模块技术文档（M4）高级审查与对抗性评审报告

**审查者**: teamwork_preview_reviewer (Reviewer & Adversarial Critic)  
**审查时间**: 2026-10-16T08:43:00Z  
**审查目标**: `docs/business-modules/` 目录下全部 17 篇业务模块深度解析文档  
**最终评审结论**: **REQUEST_CHANGES**（整体质量极高，事实契合度达 97.2%，但存在 3 处与源码事实不一致的细节缺陷，需快速订正后方可通过验收）

---

## 1. Observation (客观观察与全量事实核验)

通过编写自动化静态分析脚本与人工深度逐行核查，对 `docs/business-modules/` 下 17 篇文档与实际代码库（`src/`）进行了矩阵式交叉比对：

### 1.1 覆盖度与章节七大要素统计
- **文档完整性**: 17 篇文档全部存在（100% 覆盖），无一遗漏。
  - `admin-user.md` (11,234 B)
  - `application.md` (10,137 B)
  - `check-system.md` (11,486 B)
  - `cms.md` (11,836 B)
  - `customer.md` (10,625 B)
  - `dashboard.md` (8,259 B)
  - `error.md` (10,952 B)
  - `feedback.md` (10,750 B)
  - `license.md` (11,557 B)
  - `login.md` (9,883 B)
  - `member.md` (16,289 B)
  - `menu.md` (13,774 B)
  - `notification.md` (13,824 B)
  - `order.md` (15,582 B)
  - `permission.md` (12,840 B)
  - `tenant.md` (14,265 B)
  - `welcome.md` (6,247 B)
- **要素完备性**: 17 篇文档全部具备以下 7 大核心要素：
  1. 业务职责与核心能力
  2. 源码结构与子组件分工（含 ASCII 目录树与职责明细表）
  3. 路由注册与前置守卫拦截
  4. API 通信契约与数据模型
  5. 状态管理（Pinia Store 或响应式 State）
  6. 关键业务流程与时序图（Mermaid）
  7. 权限控制与按钮级鉴权（`v-perms` / `hasPerms` / `is_super_admin`）

### 1.2 磁盘代码路径比对 (SFC / TS / Workers)
- **扫描路径总数**: 210 个文件。
- **与物理磁盘吻合**: 208 个文件存在（99.05% 正确率）。
- **路径不吻合记录 (Observation O-1)**:
  - 文件：`docs/business-modules/permission.md` 行 41-42：
    ```text
    │   ├── ReAuth/src/index.tsx            # <Auth> 权限声明式组件封装
    │   └── RePerms/src/index.tsx           # <Perms> 权限声明式组件封装
    ```
    物理磁盘实际结构：
    `src/components/ReAuth/` 包含 `index.ts` 与 `src/auth.tsx`（不存在 `index.tsx`）；
    `src/components/RePerms/` 包含 `index.ts` 与 `src/perms.tsx`（不存在 `index.tsx`）。

### 1.3 接口契约通信方法比对 (API Function Exports)
- **核验接口总数**: 17 篇文档的表格与代码清单中总计提及 177 个 API 方法。
- **与 `src/api/` 实际导出吻合**: 172 个方法完全吻合（97.18% 正确率）。
- **接口不吻合记录 (Observation O-2 & O-3)**:
  - **O-2 (`docs/business-modules/feedback.md` 行 128, 130, 134)**:
    - 文档记录：`| 回复 | createFeedbackReply | POST | /feedbacks/feedbacks/${id}/replies/ |`
      代码实际：在 `src/api/modules/feedback.ts` 行 193 导出为 `addFeedbackReply`。
    - 文档记录：`| 邮件 | resendEmail | POST | /feedbacks/email-logs/${id}/resend/ |`
      代码实际：在 `src/api/modules/feedback.ts` 中无 `resendEmail` 方法（该文件内关于 `email-logs` 仅实现了 `getEmailLogList` 与 `getEmailLogDetail`）。
    - 文档记录：`| 版本 | releaseSoftwareVersion | POST | /feedbacks/software-versions/${id}/release/ |`
      代码实际：在 `src/api/modules/feedback.ts` 中无 `releaseSoftwareVersion` 方法（该文件内关于 `software-versions` 仅实现了列表、详情、增删改）。
  - **O-3 (`docs/business-modules/tenant.md` 行 163-164)**:
    - 文档记录：
      - `| fetchTenantStatusData | GET | /admin/charts/tenant-status/ |`
      - `| fetchTenantCreationData | GET | /admin/charts/tenant-creation/ |`
      代码实际：在 `src/api/modules/tenant.ts` 行 114 与行 179，导出的方法名与请求路径为：
      - `fetchTenantStatusDistribution` -> `/admin/charts/tenant-status-distribution/`
      - `fetchTenantCreationRate` -> `/admin/charts/tenant-creation-rate/`
      （注：在同目录下的 `dashboard.md` 中引用此两方法时名称与路径是正确的）。

### 1.4 Store 状态仓储比对
- **核验 Store 引用**: `adminUser.ts`, `application.ts`, `cms.ts`, `customer.ts`, `license.ts`, `user.ts`, `member.ts`, `menu.ts`, `order.ts`, `permission.ts`, `tenant.ts`, `multiTags.ts` 共 12 个 Pinia Store 模块。
- **与物理磁盘吻合**: 100% 存在，无任何臆造或虚构 Store。未采用独立全局 Store 的模块（如 `notification.md`, `error.md`, `check-system.md` 等）忠实描述了局部响应式状态与数据模型。

### 1.5 Mermaid 图表静态有效性
- **图表总数**: 24 幅（所有文档均至少有 1 幅，其中 7 篇文档配有 2 幅）。
  - 时序图 (sequenceDiagram): 16 幅
  - 流程图 (flowchart TD/LR): 6 幅
  - 状态机图 (stateDiagram-v2): 2 幅
- **语法校验**: 方括号、圆括号、花括号开闭严格配对（0 不平衡错误），箭头连线与状态转移语法规范。

---

## 2. Logic Chain (推导逻辑链)

1. **前提假设**: 用户权威需求规范 `ORIGINAL_REQUEST.md` R1 明确要求“严禁参考旧版文档或外部陈旧说明，严格以实际 TypeScript、Vue 3、Pinia 及实际代码实现为唯一事实来源（Single Source of Truth）”。
2. **事实对比**:
   - 推导步骤 1: `permission.md` 将组件内部文件名标注为 `src/index.tsx`，与源码物理文件 `src/auth.tsx` / `src/perms.tsx` 存在命名不一致（引用了不存在的文件），依据事实标准判定为 **Minor Finding**。
   - 推导步骤 2: `tenant.md` 中的 `fetchTenantStatusData` 与 `fetchTenantCreationData` 以及路径 `/admin/charts/tenant-status/` 无法在实际代码中找到对应的 API 导出与路由，直接复制其代码将导致 `TS2305: Module has no exported member` 或运行时 404，判定为 **Major Finding**。
   - 推导步骤 3: `feedback.md` 中引用的 `createFeedbackReply`（实为 `addFeedbackReply`）会导致编译导入报错；而 `resendEmail` 与 `releaseSoftwareVersion` 在现存代码中并未实现，文档超前/虚构了接口定义，判定为 **Major Finding**。
3. **诚信审查 (Integrity Check)**:
   - 全文 17 篇文档绝无使用通用模板应付（如每篇均有精准贴合业务领域的领域数据类型、状态机、复杂的业务时序图、特定的财务毛利算法或树形拖拽机制）。
   - 没有发现作弊、伪造输出、硬编码 facade 等诚信违规行为。文档工作扎实深入。
4. **结论推导**: 虽整体质量极高，但在第一性原理与严格事实标准下，文档仍有 2 处 Major、1 处 Minor 代码事实偏差，因此必须给出 **REQUEST_CHANGES**，驱动上游完成闭环修复。

---

## 3. Findings & Required Changes (整改清单)

### [Major] Finding 1: `feedback.md` API 方法名及未实现接口偏差
- **文件位置**: `docs/business-modules/feedback.md`，第 128, 130, 134 行
- **缺陷现象**:
  1. 第 128 行将回复接口写为 `createFeedbackReply`，源码 `src/api/modules/feedback.ts` 中实际函数名为 `addFeedbackReply`；
  2. 第 130 行列出的 `resendEmail`（`/feedbacks/email-logs/${id}/resend/`）与第 134 行列出的 `releaseSoftwareVersion`（`/feedbacks/software-versions/${id}/release/`）在源码中并不存在。
- **整改建议**:
  1. 将 `createFeedbackReply` 更正为 `addFeedbackReply`；
  2. 在表格中移除 `resendEmail` 和 `releaseSoftwareVersion`，或明确注明其为“后端保留扩展规划接口，当前前端尚未封装”。

### [Major] Finding 2: `tenant.md` 图表 API 方法名与 URL 偏差
- **文件位置**: `docs/business-modules/tenant.md`，第 163-164 行
- **缺陷现象**:
  表格中记录为：
  - `fetchTenantStatusData` | `/admin/charts/tenant-status/`
  - `fetchTenantCreationData` | `/admin/charts/tenant-creation/`
  而在 `src/api/modules/tenant.ts`（及 `dashboard.md`）中，真实导出为：
  - `fetchTenantStatusDistribution` | `/admin/charts/tenant-status-distribution/`
  - `fetchTenantCreationRate` | `/admin/charts/tenant-creation-rate/`
- **整改建议**:
  将 `tenant.md` 4.2 节表格中的函数名与 Endpoint 同步修正为与 `src/api/modules/tenant.ts` 完全一致的 `fetchTenantStatusDistribution` 与 `fetchTenantCreationRate`。

### [Minor] Finding 3: `permission.md` 组件内部文件命名微小笔误
- **文件位置**: `docs/business-modules/permission.md`，第 41-42 行
- **缺陷现象**:
  ```text
  │   ├── ReAuth/src/index.tsx
  │   └── RePerms/src/index.tsx
  ```
- **整改建议**:
  修正为真实物理文件路径：
  ```text
  │   ├── ReAuth/src/auth.tsx             # <Auth> 权限声明式组件封装 (外层通过 index.ts 导出)
  │   └── RePerms/src/perms.tsx           # <Perms> 权限声明式组件封装 (外层通过 index.ts 导出)
  ```

---

## 4. Caveats (审查边界与假设)

1. **后端实现假设**: 本次审查重点核验前端代码（`src/`）与文档的契约一致性。对于后端 Django 实际提供的 REST API 是否支持额外路由，因代码库内未包含后端 Django 项目源码，无法反查后端是否存在未在前端声明的接口。
2. **动态路由由后端下发**: 业务菜单（如 `/menus/admin/routes/`）在运行时由服务端动态下发并挂载，文档中展示的路由配置是根据前端组件结构与代码中声明的 `RouteConfigsTable` 进行的规范化还原。

---

## 5. Conclusion (评审结论)

**评审结论: REQUEST_CHANGES**

- **综合评价**:
  M4 阶段产出的 17 篇业务模块文档架构体系严整、业务还原度极其深刻，涵盖了订单双边财务毛利、离线 Web Worker、ECharts 复合统计大屏、多租户与多级路由鉴权体系等诸多极其复杂的企业级特性，24 幅 Mermaid 时序图与状态机图生动有效，整体工程文档水准卓越。
- **阻断原因**:
  存在上述 3 项明确的代码真实性偏差。根据“代码即唯一真理”原则，文档必须消除任何可能误导开发者的不存在方法名或不存在文件路径。
- **放行动作**:
  待文档编写责任者完成上述 3 处细节修正后，即可立即予以 **APPROVE**。

---

## 6. Verification Method (独立复核与验证方法)

任何后续审查者或编排器均可通过以下命令独立复现本次审查中发现的客观事实：

```bash
# 1. 验证 permission.md 引用的 ReAuth 与 RePerms 物理文件名
node -e "
const fs = require('fs');
console.log('ReAuth/src:', fs.readdirSync('src/components/ReAuth/src'));
console.log('RePerms/src:', fs.readdirSync('src/components/RePerms/src'));
"
# 预期输出: [ 'auth.tsx' ] 和 [ 'perms.tsx' ] (证实不存在 index.tsx)

# 2. 验证 tenant.md 引用的图表 API 真实导出名称
node -e "
const fs = require('fs');
const content = fs.readFileSync('src/api/modules/tenant.ts', 'utf-8');
console.log('has fetchTenantStatusDistribution:', content.includes('fetchTenantStatusDistribution'));
console.log('has fetchTenantStatusData:', content.includes('fetchTenantStatusData'));
"
# 预期输出: true 和 false (证实 fetchTenantStatusData 不存在)

# 3. 验证 feedback.md 引用的回复与版本接口真实存在性
node -e "
const fs = require('fs');
const content = fs.readFileSync('src/api/modules/feedback.ts', 'utf-8');
console.log('has addFeedbackReply:', content.includes('addFeedbackReply'));
console.log('has createFeedbackReply:', content.includes('createFeedbackReply'));
console.log('has releaseSoftwareVersion:', content.includes('releaseSoftwareVersion'));
"
# 预期输出: true, false, false (证实 createFeedbackReply 与 releaseSoftwareVersion 错误)
```
