# 应用管理 API 详细文档（三）- 统计和文章

**基础URL**: `http://localhost:8000`  
**API前缀**: `/api/v1`  
**认证方式**: Bearer Token (JWT)

---

## 7. 获取应用统计信息

### 基本信息

- **端点**: `/api/v1/applications/{id}/statistics/`
- **方法**: `GET`
- **权限**: 认证用户（租户管理员和普通成员）
- **说明**: 获取指定应用的统计信息，包括许可证、反馈和文章数量

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ 是 | 应用ID |

### 请求示例

#### cURL命令

```bash
# 获取应用1的统计信息
curl -X GET 'http://localhost:8000/api/v1/applications/1/statistics/' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -s | jq .
```

#### JavaScript (Axios)

```javascript
const response = await axios.get(`/api/v1/applications/${id}/statistics/`, {
  headers: {
    'Authorization': 'Bearer <YOUR_TOKEN>'
  }
});

console.log('许可证总数:', response.data.data.licenses.total);
console.log('活跃许可证:', response.data.data.licenses.active);
console.log('反馈总数:', response.data.data.feedbacks.total);
console.log('未关闭反馈:', response.data.data.feedbacks.open);
console.log('文章总数:', response.data.data.articles.total);
```

#### Vue 3 (Composition API)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface Statistics {
  licenses: {
    total: number;
    active: number;
  };
  feedbacks: {
    total: number;
    open: number;
  };
  articles: {
    total: number;
  };
}

const applicationId = ref(1);
const statistics = ref<Statistics | null>(null);

const fetchStatistics = async () => {
  try {
    const response = await axios.get(
      `/api/v1/applications/${applicationId.value}/statistics/`
    );
    statistics.value = response.data.data;
  } catch (error) {
    console.error('获取统计信息失败:', error);
  }
};

onMounted(() => {
  fetchStatistics();
});
</script>

<template>
  <div v-if="statistics">
    <h3>应用统计</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <h4>许可证</h4>
        <p>总数: {{ statistics.licenses.total }}</p>
        <p>活跃: {{ statistics.licenses.active }}</p>
      </div>
      <div class="stat-card">
        <h4>反馈</h4>
        <p>总数: {{ statistics.feedbacks.total }}</p>
        <p>未关闭: {{ statistics.feedbacks.open }}</p>
      </div>
      <div class="stat-card">
        <h4>文章</h4>
        <p>总数: {{ statistics.articles.total }}</p>
      </div>
    </div>
  </div>
</template>
```

### 响应格式

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "licenses": {
      "total": 15,
      "active": 12
    },
    "feedbacks": {
      "total": 23,
      "open": 8
    },
    "articles": {
      "total": 10
    }
  }
}
```

#### 响应字段说明

##### licenses 对象（许可证统计）

| 字段 | 类型 | 说明 |
|------|------|------|
| total | integer | 与该应用关联的许可证总数 |
| active | integer | 处于活跃状态的许可证数量 |

**计算逻辑**:
- `total`: 所有状态的许可证（包括过期、禁用等）
- `active`: 仅统计当前有效且未过期的许可证

##### feedbacks 对象（反馈统计）

| 字段 | 类型 | 说明 |
|------|------|------|
| total | integer | 与该应用关联的反馈总数 |
| open | integer | 未关闭的反馈数量 |

**计算逻辑**:
- `total`: 所有状态的反馈
- `open`: 状态为open、in_progress等未关闭状态的反馈

##### articles 对象（文章统计）

| 字段 | 类型 | 说明 |
|------|------|------|
| total | integer | 与该应用关联的文章总数 |

**计算逻辑**:
- `total`: 通过ArticleApplication关联表统计的文章数量

#### 错误响应

##### 404 应用不存在
```json
{
  "success": false,
  "code": 4004,
  "message": "未找到",
  "data": null,
  "error_code": "NOT_FOUND"
}
```

##### 403 无权访问
```json
{
  "success": false,
  "code": 4003,
  "message": "权限不足：无权访问该应用",
  "data": null,
  "error_code": "PERMISSION_DENIED"
}
```

---

## 8. 获取应用关联文章

### 基本信息

- **端点**: `/api/v1/applications/{id}/articles/`
- **方法**: `GET`
- **权限**: 认证用户（租户管理员和普通成员）
- **说明**: 获取与指定应用关联的所有文章列表

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ 是 | 应用ID |

### 请求示例

#### cURL命令

```bash
# 获取应用1关联的所有文章
curl -X GET 'http://localhost:8000/api/v1/applications/1/articles/' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -s | jq .
```

#### JavaScript (Axios)

```javascript
const response = await axios.get(`/api/v1/applications/${id}/articles/`, {
  headers: {
    'Authorization': 'Bearer <YOUR_TOKEN>'
  }
});

const articles = response.data.data;
console.log(`找到 ${articles.length} 篇关联文章`);
```

#### Vue 3 (Composition API)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  author: string;
  created_at: string;
  updated_at: string;
}

const applicationId = ref(1);
const articles = ref<Article[]>([]);
const loading = ref(false);

const fetchArticles = async () => {
  loading.value = true;
  try {
    const response = await axios.get(
      `/api/v1/applications/${applicationId.value}/articles/`
    );
    articles.value = response.data.data;
  } catch (error) {
    console.error('获取文章列表失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchArticles();
});
</script>

<template>
  <div v-loading="loading">
    <h3>关联文章 ({{ articles.length }})</h3>
    <div v-if="articles.length === 0" class="empty">
      暂无关联文章
    </div>
    <ul v-else class="article-list">
      <li v-for="article in articles" :key="article.id">
        <h4>{{ article.title }}</h4>
        <p>作者: {{ article.author }}</p>
        <p>状态: {{ article.status }}</p>
        <p>创建时间: {{ article.created_at }}</p>
      </li>
    </ul>
  </div>
</template>
```

### 响应格式

#### 成功响应 (200 OK) - 有数据

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "title": "应用安装指南",
      "slug": "installation-guide",
      "excerpt": "详细的应用安装步骤说明...",
      "content": "完整的文章内容...",
      "status": "published",
      "author": {
        "id": 3,
        "username": "admin_cms",
        "nickname": "管理员"
      },
      "category": {
        "id": 5,
        "name": "教程",
        "slug": "tutorial"
      },
      "tags": [
        {
          "id": 1,
          "name": "安装",
          "slug": "installation"
        },
        {
          "id": 2,
          "name": "入门",
          "slug": "getting-started"
        }
      ],
      "view_count": 156,
      "like_count": 23,
      "comment_count": 8,
      "is_featured": true,
      "is_top": false,
      "published_at": "2025-11-20T10:00:00Z",
      "created_at": "2025-11-19T15:30:00Z",
      "updated_at": "2025-11-23T08:45:00Z"
    },
    {
      "id": 2,
      "title": "常见问题解答",
      "slug": "faq",
      "excerpt": "使用过程中的常见问题及解决方案...",
      "content": "完整的FAQ内容...",
      "status": "published",
      "author": {
        "id": 3,
        "username": "admin_cms",
        "nickname": "管理员"
      },
      "category": {
        "id": 6,
        "name": "帮助文档",
        "slug": "help"
      },
      "tags": [
        {
          "id": 3,
          "name": "FAQ",
          "slug": "faq"
        }
      ],
      "view_count": 234,
      "like_count": 45,
      "comment_count": 12,
      "is_featured": false,
      "is_top": true,
      "published_at": "2025-11-21T14:00:00Z",
      "created_at": "2025-11-21T10:00:00Z",
      "updated_at": "2025-11-23T12:00:00Z"
    }
  ]
}
```

#### 成功响应 (200 OK) - 无数据

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": []
}
```

#### 响应字段说明

##### Article 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 文章ID |
| title | string | 文章标题 |
| slug | string | URL友好的标识符 |
| excerpt | string | 文章摘要 |
| content | string | 文章完整内容（HTML或Markdown） |
| status | string | 文章状态（draft/published/archived） |
| author | object | 作者信息对象 |
| category | object | 分类信息对象 |
| tags | array | 标签数组 |
| view_count | integer | 浏览次数 |
| like_count | integer | 点赞数 |
| comment_count | integer | 评论数 |
| is_featured | boolean | 是否精选 |
| is_top | boolean | 是否置顶 |
| published_at | string | 发布时间 |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |

##### Author 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 作者ID |
| username | string | 用户名 |
| nickname | string | 昵称 |

##### Category 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 分类ID |
| name | string | 分类名称 |
| slug | string | 分类标识符 |

##### Tag 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 标签ID |
| name | string | 标签名称 |
| slug | string | 标签标识符 |

#### 错误响应

##### 404 应用不存在
```json
{
  "success": false,
  "code": 4004,
  "message": "未找到",
  "data": null,
  "error_code": "NOT_FOUND"
}
```

---

## 实际测试示例

### 测试1：获取统计信息

```bash
# 获取应用1的统计信息
curl -X GET 'http://localhost:8000/api/v1/applications/1/statistics/' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImFkbWluX2NtcyIsImV4cCI6MTc2NDQ5MjA3MSwibW9kZWxfdHlwZSI6InVzZXIiLCJpc19hZG1pbiI6dHJ1ZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19zdGFmZiI6dHJ1ZX0.sG3xbmD1mdvGgvj_i_lKfDfSZ_6cRnakqPHWy5BSObM' \
  -s | jq .
```

**实际响应**:
```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "licenses": {
      "total": 0,
      "active": 0
    },
    "feedbacks": {
      "total": 3,
      "open": 3
    },
    "articles": {
      "total": 0
    }
  }
}
```

**测试结果**: ✅ 成功获取统计信息

### 测试2：获取关联文章

```bash
# 获取应用1的关联文章
curl -X GET 'http://localhost:8000/api/v1/applications/1/articles/' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImFkbWluX2NtcyIsImV4cCI6MTc2NDQ5MjA3MSwibW9kZWxfdHlwZSI6InVzZXIiLCJpc19hZG1pbiI6dHJ1ZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19zdGFmZiI6dHJ1ZX0.sG3xbmD1mdvGgvj_i_lKfDfSZ_6cRnakqPHWy5BSObM' \
  -s | jq .
```

**实际响应**:
```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": []
}
```

**测试结果**: ✅ 成功获取文章列表（当前为空）

---

## 使用场景示例

### 场景1：应用详情页展示统计卡片

在应用详情页面，通常需要展示应用的关键统计信息：

```vue
<template>
  <div class="application-detail">
    <!-- 应用基本信息 -->
    <el-card class="info-card">
      <h2>{{ application.name }}</h2>
      <p>{{ application.description }}</p>
    </el-card>

    <!-- 统计信息卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon">🔑</div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.licenses.active }}</div>
            <div class="stat-label">活跃许可证</div>
            <div class="stat-total">
              / {{ statistics.licenses.total }} 总计
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.feedbacks.open }}</div>
            <div class="stat-label">待处理反馈</div>
            <div class="stat-total">
              / {{ statistics.feedbacks.total }} 总计
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics.articles.total }}</div>
            <div class="stat-label">相关文章</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const applicationId = ref(1);
const statistics = ref({
  licenses: { total: 0, active: 0 },
  feedbacks: { total: 0, open: 0 },
  articles: { total: 0 }
});

onMounted(async () => {
  const response = await axios.get(
    `/api/v1/applications/${applicationId.value}/statistics/`
  );
  statistics.value = response.data.data;
});
</script>
```

### 场景2：检查应用是否有待处理的反馈

```javascript
async function checkPendingFeedbacks(applicationId) {
  const response = await axios.get(
    `/api/v1/applications/${applicationId}/statistics/`
  );
  
  const { feedbacks } = response.data.data;
  
  if (feedbacks.open > 0) {
    ElNotification({
      title: '提示',
      message: `应用有 ${feedbacks.open} 个待处理的反馈`,
      type: 'warning'
    });
  }
  
  return feedbacks.open;
}
```

### 场景3：显示应用关联的文档文章

```vue
<template>
  <div class="related-articles">
    <h3>相关文档 ({{ articles.length }})</h3>
    
    <el-empty 
      v-if="articles.length === 0" 
      description="暂无相关文档"
    />
    
    <el-timeline v-else>
      <el-timeline-item
        v-for="article in articles"
        :key="article.id"
        :timestamp="article.published_at"
        placement="top"
      >
        <el-card>
          <h4>{{ article.title }}</h4>
          <p class="excerpt">{{ article.excerpt }}</p>
          <div class="meta">
            <el-tag v-for="tag in article.tags" :key="tag.id" size="small">
              {{ tag.name }}
            </el-tag>
            <span class="stats">
              <el-icon><View /></el-icon> {{ article.view_count }}
              <el-icon><ChatDotRound /></el-icon> {{ article.comment_count }}
            </span>
          </div>
          <el-button 
            type="primary" 
            link 
            @click="viewArticle(article.id)"
          >
            查看详情 →
          </el-button>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const articles = ref([]);

const props = defineProps<{
  applicationId: number;
}>();

const fetchArticles = async () => {
  const response = await axios.get(
    `/api/v1/applications/${props.applicationId}/articles/`
  );
  articles.value = response.data.data;
};

const viewArticle = (articleId: number) => {
  router.push(`/articles/${articleId}`);
};

onMounted(() => {
  fetchArticles();
});
</script>
```

---

## 数据关联说明

### 许可证关联

应用与许可证通过 `License.application_id` 外键关联：

```
Application (id) ←─ License (application_id)
```

**统计规则**:
- `total`: 统计所有 `application_id = {id}` 的许可证
- `active`: 统计 `application_id = {id}` 且 `status = 'active'` 且 `expires_at > now()` 的许可证

### 反馈关联

应用与反馈通过 `Feedback.application_id` 外键关联：

```
Application (id) ←─ Feedback (application_id)
```

**统计规则**:
- `total`: 统计所有 `application_id = {id}` 的反馈
- `open`: 统计 `application_id = {id}` 且 `status NOT IN ('closed', 'resolved')` 的反馈

### 文章关联

应用与文章通过中间表 `ArticleApplication` 关联（多对多）：

```
Application (id) ←─ ArticleApplication (application_id, article_id) ─→ Article (id)
```

**查询逻辑**:
```sql
SELECT articles.* 
FROM articles
JOIN article_applications ON article_applications.article_id = articles.id
WHERE article_applications.application_id = {id}
  AND articles.tenant_id = {tenant_id}
```

---

## 性能优化建议

### 1. 缓存统计数据

统计数据变化频率低，建议使用缓存：

```javascript
// 使用Redis缓存，有效期5分钟
const cacheKey = `app_stats:${applicationId}`;
let statistics = await redis.get(cacheKey);

if (!statistics) {
  const response = await axios.get(`/api/v1/applications/${applicationId}/statistics/`);
  statistics = response.data.data;
  await redis.setex(cacheKey, 300, JSON.stringify(statistics));
}
```

### 2. 按需加载文章列表

文章列表可能较大，建议延迟加载：

```vue
<el-tabs v-model="activeTab">
  <el-tab-pane label="基本信息" name="info">
    <!-- 应用基本信息 -->
  </el-tab-pane>
  
  <el-tab-pane label="相关文档" name="articles" lazy>
    <!-- 切换到此tab时才加载文章 -->
    <RelatedArticles :application-id="applicationId" />
  </el-tab-pane>
</el-tabs>
```

### 3. 定时刷新统计数据

在详情页面自动刷新统计：

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

const refreshInterval = ref(null);

onMounted(() => {
  fetchStatistics();
  // 每30秒自动刷新一次
  refreshInterval.value = setInterval(fetchStatistics, 30000);
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
```

---

## 注意事项

1. **租户隔离**: 统计和文章数据都严格按租户隔离
2. **实时性**: 统计数据为实时计算，不是缓存数据
3. **权限**: 所有认证用户都可以查看统计和文章（包括普通成员）
4. **数据完整性**: 删除应用前需要先处理关联的许可证、反馈和文章
5. **性能**: 统计API会执行多个COUNT查询，建议添加数据库索引优化性能
6. **文章内容**: 文章API返回完整内容，注意数据量
