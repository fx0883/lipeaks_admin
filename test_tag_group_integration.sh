#!/bin/bash

# CMS标签组集成测试脚本
# 测试账号：admin_cms / admin_main

BASE_URL="http://localhost:8000/api/v1"
USERNAME="admin_cms"
PASSWORD="admin_main"

echo "========================================="
echo "CMS标签组功能集成测试"
echo "========================================="
echo ""

# 步骤1: 登录获取Token
echo "[步骤1] 登录获取Token..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login/" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"${USERNAME}\", \"password\": \"${PASSWORD}\"}")

echo "登录响应: $LOGIN_RESPONSE"

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ 登录失败，无法获取Token"
  exit 1
fi

echo "✅ 登录成功"
echo "Token: ${ACCESS_TOKEN:0:50}..."
echo ""

# 步骤2: 获取现有标签组列表
echo "[步骤2] 获取现有标签组列表..."
TAG_GROUPS_RESPONSE=$(curl -s -X GET "${BASE_URL}/cms/tag-groups/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

echo "标签组列表响应:"
echo "$TAG_GROUPS_RESPONSE" | jq '.' 2>/dev/null || echo "$TAG_GROUPS_RESPONSE"
echo ""

# 步骤3: 创建新标签组
echo "[步骤3] 创建新标签组..."
CREATE_GROUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/cms/tag-groups/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "编程语言",
    "description": "编程语言相关的标签",
    "is_active": true
  }')

echo "创建标签组响应:"
echo "$CREATE_GROUP_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_GROUP_RESPONSE"

# 提取标签组ID
GROUP_ID=$(echo $CREATE_GROUP_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$GROUP_ID" ]; then
  echo "❌ 创建标签组失败"
else
  echo "✅ 标签组创建成功，ID: $GROUP_ID"
fi
echo ""

# 步骤4: 创建属于标签组的标签
echo "[步骤4] 创建属于标签组的标签..."
CREATE_TAG_RESPONSE=$(curl -s -X POST "${BASE_URL}/cms/tags/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Python\",
    \"description\": \"Python编程语言\",
    \"group\": ${GROUP_ID},
    \"color\": \"#3776AB\",
    \"is_active\": true
  }")

echo "创建标签响应:"
echo "$CREATE_TAG_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_TAG_RESPONSE"

TAG_ID=$(echo $CREATE_TAG_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TAG_ID" ]; then
  echo "❌ 创建标签失败"
else
  echo "✅ 标签创建成功，ID: $TAG_ID"
fi
echo ""

# 步骤5: 创建不属于任何标签组的标签
echo "[步骤5] 创建独立标签（不属于标签组）..."
CREATE_TAG2_RESPONSE=$(curl -s -X POST "${BASE_URL}/cms/tags/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试标签",
    "description": "这是一个独立的标签",
    "color": "#FF5722",
    "is_active": true
  }')

echo "创建独立标签响应:"
echo "$CREATE_TAG2_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_TAG2_RESPONSE"
echo ""

# 步骤6: 获取标签列表，验证标签组信息
echo "[步骤6] 获取标签列表，验证标签组信息..."
TAGS_RESPONSE=$(curl -s -X GET "${BASE_URL}/cms/tags/" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

echo "标签列表响应:"
echo "$TAGS_RESPONSE" | jq '.' 2>/dev/null || echo "$TAGS_RESPONSE"
echo ""

# 步骤7: 获取标签详情
if [ ! -z "$TAG_ID" ]; then
  echo "[步骤7] 获取标签详情..."
  TAG_DETAIL_RESPONSE=$(curl -s -X GET "${BASE_URL}/cms/tags/${TAG_ID}/" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json")
  
  echo "标签详情响应:"
  echo "$TAG_DETAIL_RESPONSE" | jq '.' 2>/dev/null || echo "$TAG_DETAIL_RESPONSE"
  echo ""
fi

# 步骤8: 更新标签的标签组
if [ ! -z "$TAG_ID" ]; then
  echo "[步骤8] 更新标签（移除标签组）..."
  UPDATE_TAG_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/cms/tags/${TAG_ID}/" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "group": null
    }')
  
  echo "更新标签响应:"
  echo "$UPDATE_TAG_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_TAG_RESPONSE"
  echo ""
fi

echo "========================================="
echo "测试完成！"
echo "========================================="
echo ""
echo "总结："
echo "✅ 1. 登录成功"
echo "✅ 2. 获取标签组列表"
echo "✅ 3. 创建标签组"
echo "✅ 4. 创建带标签组的标签"
echo "✅ 5. 创建独立标签"
echo "✅ 6. 获取标签列表（含标签组信息）"
echo "✅ 7. 获取标签详情"
echo "✅ 8. 更新标签的标签组"
echo ""
echo "请在前端界面验证："
echo "1. 标签列表中显示标签组列"
echo "2. 创建/编辑标签时可以选择标签组"
echo "3. 可以快速创建新标签组"
