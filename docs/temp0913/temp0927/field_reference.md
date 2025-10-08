# 字段使用详细参考

## 📋 字段概览

| 字段名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `plan` | Integer | ✅ | - | 许可证方案ID |
| `customer_info` | Object | ✅ | - | 客户信息对象 |
| `tenant` | Integer | ❌ | 当前用户租户 | 租户ID |
| `max_activations` | Integer | ❌ | 方案默认值 | 最大激活设备数 |
| `validity_days` | Integer | ❌ | 方案默认值 | 有效天数 |
| `notes` | String | ❌ | null | 备注信息 |

## 🔧 字段详细说明

### 1. plan (许可证方案ID)

**类型**: Integer  
**必需**: ✅  
**说明**: 指定要使用的许可证方案

#### 使用方法
```javascript
// 获取可用方案
const plans = await fetch('/api/v1/licenses/admin/plans/');
const planList = await plans.json();

// 选择方案
const selectedPlan = planList.results[0].id;

// 在请求中使用
{
  plan: selectedPlan  // 例如: 2
}
```

#### 实际示例
```javascript
// 基础版方案
{ plan: 1 }

// 专业版方案
{ plan: 2 }

// 企业版方案
{ plan: 3 }
```

#### 验证规则
- 必须是正整数
- 方案必须存在且未被删除
- 用户必须有权限访问该方案
- 方案必须处于active状态

#### 常见错误
```javascript
// ❌ 错误示例
{ plan: "2" }        // 字符串类型
{ plan: 0 }          // 无效ID
{ plan: 999 }        // 不存在的方案
{ plan: null }       // 空值
```

#### 获取方案信息
```javascript
// 获取方案详情
const planDetail = await fetch(`/api/v1/licenses/admin/plans/${planId}/`);
const plan = await planDetail.json();

console.log(`方案名称: ${plan.name}`);
console.log(`默认激活数: ${plan.default_max_activations}`);
console.log(`默认有效期: ${plan.default_validity_days}天`);
```

### 2. customer_info (客户信息)

**类型**: Object  
**必需**: ✅  
**说明**: 包含客户详细信息的对象

#### 子字段说明

| 子字段 | 类型 | 必需 | 最大长度 | 说明 |
|--------|------|------|----------|------|
| `name` | String | ✅ | 100字符 | 客户姓名 |
| `email` | String | ✅ | 254字符 | 客户邮箱 |
| `company` | String | ❌ | 200字符 | 公司名称 |
| `phone` | String | ❌ | 20字符 | 联系电话 |
| `address` | String | ❌ | 500字符 | 详细地址 |
| `contact_person` | String | ❌ | 100字符 | 联系人 |
| `department` | String | ❌ | 100字符 | 部门 |

#### 使用方法
```javascript
// 最简客户信息
{
  customer_info: {
    name: '张三',
    email: 'zhangsan@example.com'
  }
}

// 完整客户信息
{
  customer_info: {
    name: '李四',
    email: 'lisi@company.com',
    company: '北京科技有限公司',
    phone: '+86-138-0013-8000',
    address: '北京市朝阳区中关村大街123号',
    contact_person: '技术部-王经理',
    department: '研发中心'
  }
}
```

#### 实际业务场景

##### 个人客户
```javascript
{
  customer_info: {
    name: '个人开发者-张三',
    email: 'zhangsan.dev@gmail.com',
    company: '个人工作室',
    phone: '138-0013-8001'
  }
}
```

##### 企业客户
```javascript
{
  customer_info: {
    name: '某某科技有限公司',
    email: 'it@company.com',
    company: '某某科技有限公司',
    phone: '010-12345678',
    address: '北京市海淀区中关村软件园',
    contact_person: '技术总监-王五',
    department: 'IT部门'
  }
}
```

##### 教育机构
```javascript
{
  customer_info: {
    name: '某某大学计算机学院',
    email: 'cs@university.edu.cn',
    company: '某某大学',
    phone: '010-88888888',
    address: '北京市海淀区学院路XX号',
    contact_person: '系统管理员-李老师',
    department: '计算机科学与技术学院'
  }
}
```

#### 验证规则
- `name`: 不能为空，最长100字符
- `email`: 必须是有效邮箱格式，最长254字符
- `company`: 可选，最长200字符
- `phone`: 可选，最长20字符，建议包含国际区号
- `address`: 可选，最长500字符
- `contact_person`: 可选，最长100字符
- `department`: 可选，最长100字符

#### 常见错误
```javascript
// ❌ 缺少必需字段
{
  customer_info: {
    name: '张三'  // 缺少email字段
  }
}

// ❌ 邮箱格式错误
{
  customer_info: {
    name: '张三',
    email: 'invalid-email'  // 无效邮箱格式
  }
}

// ❌ 字段过长
{
  customer_info: {
    name: '超过100字符的很长很长的名字...',  // 超过最大长度
    email: 'test@example.com'
  }
}
```

### 3. tenant (租户ID)

**类型**: Integer  
**必需**: ❌  
**默认值**: 当前用户的租户  
**说明**: 指定许可证归属的租户

#### 使用方法
```javascript
// 使用默认租户（推荐）
{
  plan: 2,
  customer_info: {...}
  // tenant字段省略，自动使用当前用户租户
}

// 指定特定租户（超级管理员可用）
{
  plan: 2,
  customer_info: {...},
  tenant: 3  // 指定租户ID
}
```

#### 权限说明
- **租户管理员**: 只能使用自己的租户，不能指定其他租户
- **超级管理员**: 可以指定任意租户
- **自动获取**: 如果不指定，系统自动使用当前用户的租户

#### 实际示例
```javascript
// 超级管理员为不同租户创建许可证
const tenants = [
  { id: 1, name: '租户A' },
  { id: 2, name: '租户B' },
  { id: 3, name: '租户C' }
];

// 为租户A创建
{
  plan: 2,
  tenant: 1,
  customer_info: {
    name: '租户A的客户',
    email: 'customer@tenantA.com'
  }
}

// 为租户B创建
{
  plan: 3,
  tenant: 2,
  customer_info: {
    name: '租户B的客户',
    email: 'customer@tenantB.com'
  }
}
```

#### 验证规则
- 必须是正整数
- 租户必须存在且未被删除
- 用户必须有权限访问该租户
- 租户必须处于active状态

### 4. max_activations (最大激活数)

**类型**: Integer  
**必需**: ❌  
**默认值**: plan.default_max_activations  
**说明**: 指定许可证允许的最大激活设备数

#### 使用方法
```javascript
// 使用方案默认值（推荐）
{
  plan: 2,
  customer_info: {...}
  // max_activations省略，使用plan.default_max_activations
}

// 自定义激活数
{
  plan: 2,
  customer_info: {...},
  max_activations: 5  // 自定义为5台设备
}
```

#### 实际业务场景

##### 个人用户
```javascript
{
  plan: 1,  // 个人版方案
  max_activations: 1,  // 只允许1台设备
  customer_info: {...}
}
```

##### 小团队
```javascript
{
  plan: 2,  // 团队版方案
  max_activations: 5,  // 允许5台设备
  customer_info: {...}
}
```

##### 企业用户
```javascript
{
  plan: 3,  // 企业版方案
  max_activations: 100,  // 允许100台设备
  customer_info: {...}
}
```

##### 教育机构
```javascript
{
  plan: 4,  // 教育版方案
  max_activations: 200,  // 允许200台设备（实验室）
  customer_info: {...}
}
```

#### 验证规则
- 必须是正整数
- 最小值: 1
- 最大值: 根据方案限制（通常不超过1000）
- 不能小于当前已激活的设备数（更新时）

#### 常见使用模式
```javascript
// 根据用户类型设置不同激活数
const getMaxActivations = (userType) => {
  switch (userType) {
    case 'individual': return 1;
    case 'small_team': return 5;
    case 'enterprise': return 50;
    case 'education': return 200;
    default: return undefined; // 使用方案默认值
  }
};

{
  plan: planId,
  max_activations: getMaxActivations('enterprise'),
  customer_info: {...}
}
```

### 5. validity_days (有效天数)

**类型**: Integer  
**必需**: ❌  
**默认值**: plan.default_validity_days  
**说明**: 指定许可证的有效期天数

#### 使用方法
```javascript
// 使用方案默认有效期（推荐）
{
  plan: 2,
  customer_info: {...}
  // validity_days省略，使用plan.default_validity_days
}

// 自定义有效期
{
  plan: 2,
  customer_info: {...},
  validity_days: 365  // 1年有效期
}
```

#### 常见有效期配置

##### 试用版许可证
```javascript
{
  plan: 1,
  validity_days: 30,  // 30天试用
  customer_info: {...}
}
```

##### 标准年度许可证
```javascript
{
  plan: 2,
  validity_days: 365,  // 1年
  customer_info: {...}
}
```

##### 长期企业许可证
```javascript
{
  plan: 3,
  validity_days: 1095,  // 3年
  customer_info: {...}
}
```

##### 永久许可证
```javascript
{
  plan: 4,
  validity_days: 36500,  // 100年（相当于永久）
  customer_info: {...}
}
```

#### 有效期计算
```javascript
// 计算过期时间
const calculateExpiryDate = (validityDays) => {
  const now = new Date();
  const expiryDate = new Date(now.getTime() + (validityDays * 24 * 60 * 60 * 1000));
  return expiryDate.toISOString();
};

// 不同期限的示例
const periods = {
  trial: 30,      // 试用期
  monthly: 30,    // 月度
  quarterly: 90,  // 季度
  annual: 365,    // 年度
  biennial: 730,  // 两年
  permanent: 36500 // 永久（100年）
};
```

#### 验证规则
- 必须是正整数
- 最小值: 1天
- 最大值: 36500天（约100年）
- 建议范围: 30-3650天（1个月到10年）

#### 业务场景示例
```javascript
// 根据业务类型设置有效期
const getValidityDays = (licenseType, duration) => {
  const periods = {
    trial: { days: 30, max: 90 },
    standard: { days: 365, max: 1095 },
    enterprise: { days: 365, max: 3650 },
    education: { days: 365, max: 1095 }
  };
  
  return periods[licenseType]?.days || 365;
};

// 教育机构学年许可证
{
  plan: 4,
  validity_days: 365,  // 一学年
  customer_info: {
    name: '某某大学',
    email: 'admin@university.edu'
  }
}
```

### 6. notes (备注信息)

**类型**: String  
**必需**: ❌  
**默认值**: null  
**最大长度**: 1000字符  
**说明**: 许可证的备注信息

#### 使用方法
```javascript
// 无备注
{
  plan: 2,
  customer_info: {...}
  // notes省略
}

// 添加备注
{
  plan: 2,
  customer_info: {...},
  notes: '为重要客户特别创建的企业版许可证，包含所有高级功能'
}
```

#### 实际使用场景

##### 客户类型标识
```javascript
{
  notes: '重要企业客户 - 需要优先技术支持'
}

{
  notes: '试用客户 - 30天后需要跟进续费'
}

{
  notes: '教育机构 - 享受教育折扣'
}
```

##### 特殊要求记录
```javascript
{
  notes: '客户要求支持离线使用，已开启离线模式'
}

{
  notes: '定制版本 - 包含客户专属功能模块'
}

{
  notes: '批量许可证 - 与主合同#2024-001关联'
}
```

##### 历史信息记录
```javascript
{
  notes: '从基础版升级而来，原许可证#123已失效'
}

{
  notes: '续费客户 - 上一期许可证到期时间: 2024-01-15'
}

{
  notes: '紧急创建 - 客户生产环境许可证意外丢失'
}
```

#### 最佳实践

##### 结构化备注
```javascript
// 推荐的备注格式
{
  notes: [
    '客户类型: 企业用户',
    '业务场景: 生产环境',
    '特殊要求: 需要API访问权限',
    '联系人: 技术部-张经理',
    '创建原因: 新项目上线'
  ].join(' | ')
}
```

##### 标签式备注
```javascript
{
  notes: '#企业版 #VIP客户 #技术支持优先 #年度合同'
}
```

#### 验证规则
- 可选字段，可以为空或null
- 最大长度1000字符
- 支持UTF-8字符（中文、英文、符号）
- 不支持HTML标签

## 🔍 字段组合使用

### 常见组合模式

#### 1. 最简配置
```javascript
{
  plan: 2,
  customer_info: {
    name: '张三',
    email: 'zhangsan@example.com'
  }
}
```

#### 2. 标准企业配置
```javascript
{
  plan: 3,
  customer_info: {
    name: '某某科技有限公司',
    email: 'it@company.com',
    company: '某某科技有限公司',
    phone: '010-12345678',
    contact_person: '技术总监'
  },
  max_activations: 50,
  validity_days: 365,
  notes: '企业年度许可证 - 包含全功能模块'
}
```

#### 3. 教育机构配置
```javascript
{
  plan: 4,
  customer_info: {
    name: '某某大学计算机学院',
    email: 'cs@university.edu.cn',
    company: '某某大学',
    department: '计算机学院'
  },
  max_activations: 200,
  validity_days: 365,
  notes: '教育版许可证 - 用于教学和实验'
}
```

## ⚠️ 重要注意事项

### 废弃字段
- **product**: 此字段已废弃，不要在请求中包含
- **自动关联**: 产品信息会从plan.product自动获取

### 字段优先级
1. 明确指定的字段值
2. 方案默认值（default_max_activations, default_validity_days）
3. 系统默认值

### 数据一致性
- 确保customer_info.email的唯一性（在同一租户内）
- max_activations不能超过方案限制
- validity_days必须在合理范围内

---

**下一步**: 查看 [业务场景示例](business_scenarios.md) 了解实际应用场景。
