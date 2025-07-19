# 环境准备

本文档详细介绍在将 Lipeaks Admin 部署到 cPanel 环境前需要准备的环境和步骤。

## 1. 本地开发环境准备

### 1.1 安装必要工具

在本地计算机上安装以下工具：

- **Git**：用于获取项目源代码
- **Node.js**：版本 16.x 或更高（推荐 18.x）
- **pnpm**：用于项目依赖管理
- **FileZilla** 或其他 FTP 客户端：用于上传文件到 cPanel

#### Windows 安装步骤

```bash
# 安装 Node.js
# 从 https://nodejs.org 下载并安装

# 安装 pnpm
npm install -g pnpm

# 安装 Git
# 从 https://git-scm.com 下载并安装
```

#### macOS 安装步骤

```bash
# 使用 Homebrew 安装 Node.js
brew install node

# 安装 pnpm
npm install -g pnpm

# 安装 Git（如果尚未安装）
brew install git
```

#### Linux 安装步骤

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 Git（如果尚未安装）
sudo apt-get install git
```

### 1.2 获取项目源代码

从版本控制系统克隆 Lipeaks Admin 项目：

```bash
# 克隆前端代码
git clone https://github.com/your-organization/lipeaks_admin.git
cd lipeaks_admin

# 安装项目依赖
pnpm install
```

## 2. cPanel 账户准备

### 2.1 cPanel 账户要求

确认您的 cPanel 主机计划满足以下要求：

- **Python 支持**：Python 3.8+ 与 pip
- **MySQL 数据库**：最低 MySQL 5.7 或 MariaDB 10.3
- **SSH 访问**：用于高级部署和维护操作
- **足够的存储空间**：最低 1GB（取决于您的数据量）
- **足够的处理能力**：推荐至少 1 CPU 核心和 2GB RAM

### 2.2 登录 cPanel 并熟悉界面

1. 使用您的主机提供商提供的凭据登录 cPanel 控制面板
2. 熟悉以下主要功能区域：
   - **文件管理** - 用于上传和管理文件
   - **数据库** - MySQL 数据库创建和管理
   - **软件** - Python 应用设置
   - **域名** - 域名和 DNS 设置
   - **安全** - SSL/TLS 证书管理

![cPanel主界面示例](../assets/cpanel_dashboard.png)

## 3. 域名准备

### 3.1 注册域名

如果您还没有域名，需要通过域名注册商注册一个域名。

### 3.2 域名解析设置

1. 在您的域名注册商控制面板中，将域名的 DNS 记录指向您的 cPanel 主机
2. 添加 A 记录，将主域名指向您的 cPanel 服务器 IP 地址
3. 如果需要子域名，也添加相应的 A 记录

> **注意**：DNS 传播可能需要 24-48 小时才能完全生效

## 4. cPanel 安全设置

### 4.1 创建专用 FTP 账户

为部署创建一个专用的 FTP 账户，而不是使用主 cPanel 账户：

1. 在 cPanel 中找到 **"FTP 账户"** 选项
2. 创建一个新的 FTP 用户，指定用户名和强密码
3. 设置目录限制为项目根目录（通常是 `public_html`）

### 4.2 配置 SSH 密钥（如果可用）

如果您的 cPanel 账户支持 SSH 访问，配置 SSH 密钥可提高安全性：

1. 在本地生成 SSH 密钥对：
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```
2. 在 cPanel 中找到 **"SSH 访问"** 或 **"SSH/Shell 访问"**
3. 导入您的公钥

## 5. 配置 MySQL 数据库

### 5.1 创建数据库

1. 在 cPanel 中找到 **"MySQL 数据库"** 选项
2. 创建一个新的数据库，例如 `lipeaks_db`
3. 记下数据库名称，通常格式为 `cpanelusername_databasename`

### 5.2 创建数据库用户

1. 在同一页面，创建一个新的数据库用户
2. 使用强密码，并记下用户凭据
3. 分配该用户对新创建数据库的完全权限

## 6. 设置 Python 应用（如果可用）

如果您的 cPanel 提供 **"Setup Python App"** 功能：

1. 在 cPanel 中找到 **"Setup Python App"** 选项
2. 点击 **"Create Application"**
3. 选择 Python 版本（推荐 3.8+）
4. 设置应用路径，例如 `/lipeaks_backend`
5. 记下应用 URL 和环境路径

## 7. 确认环境变量

Lipeaks Admin 需要多个环境变量来正确配置：

1. 前端环境变量：
   - `VITE_BASE_API`：后端 API 的基础 URL

2. 后端环境变量：
   - 数据库配置（主机、名称、用户、密码）
   - 密钥和安全设置
   - 媒体文件存储路径

## 8. 检查清单

在继续下一步之前，确保您已完成以下所有准备工作：

- [ ] 本地开发环境已安装必要工具
- [ ] 项目源代码已克隆并可用
- [ ] cPanel 账户已验证并满足要求
- [ ] 域名已配置 DNS 设置
- [ ] FTP/SSH 访问已配置
- [ ] MySQL 数据库和用户已创建
- [ ] Python 应用环境已准备（如可用）

## 下一步

完成环境准备后，请继续阅读[前端部署](./02_frontend_deployment.md)文档，开始部署前端应用。 