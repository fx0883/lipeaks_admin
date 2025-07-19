# Lipeaks Admin cPanel 部署概述

本文档提供在 cPanel 托管环境中部署 Lipeaks Admin 项目的概述。由于 cPanel 通常用于共享主机环境，部署流程与 Docker 部署有显著差异。

## 文档索引

本部署指南分为多个部分：

1. [部署概述](./00_deployment_overview.md) (当前文档)
2. [环境准备](./01_environment_preparation.md)
3. [前端部署](./02_frontend_deployment.md)
4. [后端部署](./03_backend_deployment.md)
5. [数据库设置](./04_database_setup.md)
6. [域名与HTTPS配置](./05_domain_https_setup.md)
7. [故障排除](./06_troubleshooting.md)

## 项目架构

Lipeaks Admin 项目由以下主要组件构成：

- **前端应用**：基于 Vue 3 + TypeScript + Vite 构建的单页应用
- **后端API**：基于 Django REST Framework 的 API 服务
- **数据库**：MySQL 数据库用于存储应用数据

## 部署概念与方法

在 cPanel 环境中部署 Lipeaks Admin 项目时，我们采用以下部署策略：

### 前端部署

前端部署采用静态网站托管方式：

1. 在本地构建 Vue 应用生成静态文件
2. 将构建后的静态文件上传到 cPanel 的 `public_html` 目录
3. 配置环境变量和 API 地址

### 后端部署

后端部署采用 Python 应用托管方式：

1. 在 cPanel 中设置 Python 应用
2. 配置虚拟环境和依赖项
3. 设置 WSGI 配置
4. 配置静态文件和媒体文件目录

### 数据库设置

1. 在 cPanel 中创建 MySQL 数据库和用户
2. 导入初始数据库结构
3. 配置后端应用连接数据库

## 部署前提条件

部署 Lipeaks Admin 到 cPanel 环境需要以下条件：

1. **cPanel 账户**：拥有一个支持以下功能的 cPanel 主机账户
   - Python 应用支持（Python 3.8+）
   - MySQL 数据库
   - SSH 访问权限（推荐）

2. **技术要求**：
   - Node.js 和 npm/pnpm（用于本地构建前端）
   - 基本的命令行操作知识
   - 基本的 cPanel 使用经验
   - 熟悉 Git（用于获取源代码）

3. **项目准备**：
   - Lipeaks Admin 项目的源代码
   - 配置文件的备份（如有）
   - 数据库备份（如需迁移现有数据）

## 部署流程概述

完整的部署流程包括以下步骤：

1. **环境准备**
   - 准备本地开发环境
   - 获取项目源代码
   - 熟悉 cPanel 界面和功能

2. **前端部署**
   - 配置前端环境变量
   - 构建前端应用
   - 上传静态文件到 cPanel

3. **后端部署**
   - 在 cPanel 中设置 Python 应用
   - 配置虚拟环境和安装依赖
   - 设置 WSGI 配置文件
   - 迁移数据库

4. **数据库设置**
   - 创建数据库和用户
   - 导入数据结构
   - 配置数据库连接

5. **域名与HTTPS配置**
   - 设置域名解析
   - 安装 SSL 证书
   - 配置强制 HTTPS

6. **后期维护**
   - 日常备份策略
   - 更新流程
   - 性能监控

按照以下各章节的详细指南，您可以成功地将 Lipeaks Admin 部署到 cPanel 环境中。每个章节都提供了详细的步骤、命令和配置示例。

## 下一步

请继续阅读[环境准备](./01_environment_preparation.md)文档，开始准备部署环境。 