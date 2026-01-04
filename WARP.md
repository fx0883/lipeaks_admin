# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

lipeaks_admin 是基于 [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 精简版的后台管理系统，使用 Vue 3 + TypeScript + Vite 6 构建。

**核心技术栈：** Vue 3.5, TypeScript 5, Vite 6, Pinia 3, Vue Router 4, Element Plus 2, Tailwind CSS 4, Vue I18n 11, Axios

**环境要求：** Node.js ^18.18.0 || ^20.9.0 || >=22.0.0, pnpm >=9

## Common Commands

```bash
# 开发
pnpm dev                    # 启动开发服务器 (端口 8848)
pnpm serve                  # 同上

# 构建
pnpm build                  # 生产构建
pnpm build:staging          # Staging 环境构建
pnpm preview                # 预览构建结果
pnpm preview:build          # 构建并预览

# 代码质量
pnpm lint                   # 运行所有 lint 检查
pnpm lint:eslint            # ESLint 检查
pnpm lint:prettier          # Prettier 格式化
pnpm lint:stylelint         # Stylelint 检查
pnpm typecheck              # TypeScript 类型检查

# 其他
pnpm report                 # 构建并生成包分析报告
pnpm clean:cache            # 清理缓存并重新安装依赖
```

## Architecture

### 目录结构
```
src/
├── api/modules/        # API 接口模块 (按业务划分)
├── components/         # 公共组件 (Re前缀为基础组件)
├── composables/        # 组合式函数
├── config/             # 全局配置
├── directives/         # 自定义指令 (auth, perms)
├── layout/             # 布局组件
├── plugins/            # 插件 (i18n, echarts, elementPlus)
├── router/modules/     # 路由模块
├── store/modules/      # Pinia 状态模块
├── types/              # TypeScript 类型定义
├── utils/http/         # HTTP 客户端封装
└── views/              # 页面视图 (按业务模块组织)

build/                  # Vite 构建配置
locales/                # i18n 语言文件 (YAML 格式)
mock/                   # Mock 数据
```

### 核心模块

**HTTP 请求** (`src/utils/http/`)
- 基于 Axios 封装，自动处理 Token 刷新和请求重试
- 统一响应格式：`{ success: boolean, code: number, message: string, data: T }`
- `tokenManager.ts` - Token 管理器，处理 JWT Token 的存储、刷新和并发请求队列
- `errorHandlers.ts` - 错误处理器链，统一处理 API 错误
- `errorCodes.ts` - 错误码映射表

**路由系统** (`src/router/`)
- 静态路由在 `modules/` 目录自动导入（使用 `import.meta.glob`）
- 动态路由基于用户权限生成
- 路由元信息：`title`(i18n key), `icon`, `roles`, `auths`, `keepAlive`, `showLink`
- 三级及以上路由自动扁平化为二级

**权限控制**
- `<Auth :value="['admin']">` - 基于角色控制
- `<Perms :value="['user:create']">` - 基于权限点控制
- `v-auth` / `v-perms` 指令
- 角色层级：`super_admin` > `admin` > `member`

**状态管理** (`src/store/modules/`)
- `user.ts` - 用户认证状态、登录/登出、Token 管理
- `permission.ts` - 权限和动态路由、菜单生成
- `app.ts` - 应用设置 (语言、布局)
- `multiTags.ts` - 多标签页状态

### API 开发模式

后端使用 Django REST Framework，响应格式需适配 DRF 分页：

```typescript
// src/api/modules/example.ts
import { http } from "@/utils/http";
import type { ApiResponse, DRFPaginationResponse } from "@/types/api";

// GET 请求
export const getList = (params: { page: number; limit: number }) => {
  return http.get<DRFPaginationResponse<Item>>("/items/", { params });
};

// POST 请求
export const create = (data: CreateDto) => {
  return http.post<ApiResponse<Item>>("/items/", { data });
};

// PATCH 请求
export const update = (id: number, data: Partial<UpdateDto>) => {
  return http.patch<ApiResponse<Item>>(`/items/${id}/`, { data });
};
```

**DRF 分页响应格式：**
```typescript
{ count: number; next?: string; previous?: string; results: T[] }
```

### 调试工具

使用 `src/utils/logger.ts` 进行日志记录：
```typescript
import logger from "@/utils/logger";
logger.debug("调试信息", data);
logger.info("信息");
logger.error("错误", error);
```

## 环境配置

- `.env.development` - 开发环境 (`VITE_BASE_API=http://localhost:8000/api/v1/`)
- `.env.production` - 生产环境
- `.env.staging` - 预发布环境
- `VITE_PORT` - 开发服务器端口 (默认 8848)
- `VITE_ROUTER_HISTORY` - 路由模式 (`hash` 或 `h5`)

## 国际化

- 语言文件：`locales/zh-CN.yaml`, `locales/en.yaml`
- 使用：`{{ t("common.save") }}` 或 `t("routes.dashboard")`
- 动态切换无需刷新页面

## 语言偏好

所有交互请使用中文回复。
