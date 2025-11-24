# 应用管理菜单配置修复指南

## 问题描述

当前菜单显示了两个项目：
1. "应用列表" （父级菜单）
2. "应用管理" > "应用列表" （子菜单）

这导致了菜单重复显示。

## 解决方案

在后端菜单管理中，需要修改 `/application/index` 菜单项的配置。

### 方案A: 只显示父菜单（推荐）

**修改目标**: `/application/index` (应用列表)

**修改字段**:
```json
{
  "path": "/application/index",
  "name": "ApplicationList",
  "meta": {
    "title": "application.menu.applicationList",
    "showLink": false,  // ← 改为 false
    "icon": "ep:baseball",
    "showParent": false  // ← 改为 false
  }
}
```

**效果**: 
- 左侧菜单只显示 "应用管理"
- 点击后直接跳转到应用列表页面

### 方案B: 显示父子两级菜单

**修改目标**: `/application` (应用管理)

**修改字段**:
```json
{
  "path": "/application",
  "name": "Application",
  "meta": {
    "title": "application.menu.applicationmanage",
    "showLink": true,
    "icon": "ri:apps-line"
  },
  "redirect": ""  // ← 移除 redirect
}
```

保持子菜单的 `showLink: true`

**效果**:
- 左侧菜单显示 "应用管理" （可展开）
  - "应用列表" （子菜单）

## 操作步骤

### 1. 登录管理后台

访问菜单管理页面

### 2. 找到"应用列表"菜单项

搜索或浏览找到 `路径: /application/index` 的菜单项

### 3. 编辑菜单配置

根据上面的方案A或方案B，修改对应的字段：
- `showLink`
- `showParent` 
- `redirect` (父菜单)

### 4. 保存并刷新前端

保存菜单配置后，刷新前端页面（清除缓存）

## 推荐配置

```json
{
  "path": "/application",
  "name": "Application",
  "meta": {
    "title": "application.menu.applicationmanage",
    "rank": 8,
    "showLink": true,
    "icon": "ri:apps-line",
    "showParent": true
  },
  "component": "/src/layout/index.vue",
  "redirect": "/application/index",
  "children": [
    {
      "path": "/application/index",
      "name": "ApplicationList",
      "meta": {
        "title": "application.menu.applicationList",
        "rank": 0,
        "showLink": false,    // ← 关键：不在菜单显示
        "showParent": false,  // ← 关键
        "icon": "ep:baseball"
      },
      "component": "/src/views/application/index.vue"
    }
  ]
}
```

## 验证

修改后，左侧菜单应该只显示一个 "应用管理" 项目，点击后直接进入应用列表页面。
