# 创建测试应用数据

## 方法1: 使用前端界面（推荐）

1. 登录系统
2. 进入"应用管理"
3. 点击"创建应用"按钮
4. 填写表单：
   - **应用名称**: 测试应用（必填）
   - **应用代码**: test_app（必填）
   - **当前版本**: 1.0.0
   - **状态**: 运行中
   - **负责人**: 测试人员
5. 提交

## 方法2: 使用curl命令

```bash
# 设置你的Token
TOKEN="你的access_token"

# 创建应用
curl -X POST "http://localhost:8000/api/v1/applications/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试应用",
    "code": "test_app",
    "description": "这是一个测试应用",
    "current_version": "1.0.0",
    "status": "active",
    "owner": "测试人员",
    "team": "开发团队"
  }'
```

## 方法3: 使用Django Shell

```bash
# 进入后端项目目录
cd /path/to/lipeaks_backend

# 激活虚拟环境（如果有）
source venv/bin/activate

# 启动Django Shell
python manage.py shell
```

在Shell中执行：

```python
from apps.application.models import Application
from apps.tenant.models import Tenant

# 获取第一个租户（或你想要的租户）
tenant = Tenant.objects.first()
print(f"使用租户: {tenant.name if tenant else '无租户'}")

# 创建测试应用
app = Application.objects.create(
    name="测试应用",
    code="test_app",
    description="这是一个测试应用，用于验证系统功能",
    current_version="1.0.0",
    status="active",
    owner="测试人员",
    team="开发团队",
    tenant=tenant,  # 关联租户
    is_active=True
)

print(f"创建成功! ID: {app.id}, 名称: {app.name}")

# 创建更多测试数据
statuses = ["development", "testing", "active", "maintenance"]
for i in range(2, 6):
    Application.objects.create(
        name=f"测试应用 {i}",
        code=f"test_app_{i}",
        description=f"这是测试应用 {i}",
        current_version="1.0.0",
        status=statuses[(i-2) % len(statuses)],
        owner="测试人员",
        team="开发团队",
        tenant=tenant,
        is_active=True
    )

print(f"共创建 5 个测试应用")

# 查看创建的应用
apps = Application.objects.filter(tenant=tenant)
for app in apps:
    print(f"  - {app.code}: {app.name} [{app.status}]")
```

## 方法4: 批量创建脚本

保存为 `create_test_apps.py`:

```python
import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.application.models import Application
from apps.tenant.models import Tenant

def create_test_applications(tenant_id=None):
    """创建测试应用数据"""
    
    # 获取租户
    if tenant_id:
        tenant = Tenant.objects.get(id=tenant_id)
    else:
        tenant = Tenant.objects.first()
    
    if not tenant:
        print("❌ 未找到租户，请先创建租户")
        return
    
    print(f"✅ 使用租户: {tenant.name} (ID: {tenant.id})")
    
    # 测试数据
    test_apps = [
        {
            "name": "客户关系管理系统",
            "code": "crm_system",
            "description": "用于管理客户信息和销售流程的CRM系统",
            "status": "active",
            "current_version": "2.1.0",
            "owner": "张三",
            "team": "CRM开发团队",
            "website": "https://crm.example.com",
            "contact_email": "crm@example.com"
        },
        {
            "name": "库存管理系统",
            "code": "inventory_mgmt",
            "description": "实时库存跟踪和管理系统",
            "status": "active",
            "current_version": "1.5.2",
            "owner": "李四",
            "team": "仓储团队"
        },
        {
            "name": "移动应用",
            "code": "mobile_app",
            "description": "企业移动端应用",
            "status": "testing",
            "current_version": "0.9.0",
            "owner": "王五",
            "team": "移动开发团队"
        },
        {
            "name": "数据分析平台",
            "code": "analytics_platform",
            "description": "业务数据分析和报表系统",
            "status": "development",
            "current_version": "0.5.0",
            "owner": "赵六",
            "team": "数据团队"
        },
        {
            "name": "旧版系统",
            "code": "legacy_system",
            "description": "即将被替换的旧系统",
            "status": "deprecated",
            "current_version": "3.0.0",
            "owner": "系统管理员",
            "team": "维护团队"
        }
    ]
    
    created_count = 0
    for app_data in test_apps:
        # 检查是否已存在
        code = app_data["code"]
        if Application.objects.filter(code=code, tenant=tenant).exists():
            print(f"⏭️  跳过已存在: {app_data['name']} ({code})")
            continue
        
        # 创建应用
        app = Application.objects.create(
            **app_data,
            tenant=tenant,
            is_active=True
        )
        print(f"✅ 创建: {app.name} ({app.code}) - {app.status}")
        created_count += 1
    
    print(f"\n🎉 完成！共创建 {created_count} 个应用")
    
    # 显示所有应用
    print(f"\n📋 当前租户的所有应用:")
    apps = Application.objects.filter(tenant=tenant).order_by('-created_at')
    for i, app in enumerate(apps, 1):
        print(f"  {i}. {app.name} ({app.code}) - {app.get_status_display()} - v{app.current_version}")

if __name__ == "__main__":
    import sys
    
    tenant_id = int(sys.argv[1]) if len(sys.argv) > 1 else None
    create_test_applications(tenant_id)
```

运行方法：
```bash
# 使用第一个租户
python create_test_apps.py

# 指定租户ID
python create_test_apps.py 1
```

## 验证

创建完成后，刷新应用列表页面，应该能看到新创建的应用。

## 清理测试数据

如果需要删除测试数据：

```python
# Django Shell
from apps.application.models import Application

# 删除所有测试应用（谨慎使用！）
Application.objects.filter(code__startswith='test_app').delete()

# 或删除特定代码的应用
Application.objects.filter(code='test_app').delete()
```
