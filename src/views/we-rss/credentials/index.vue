<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getCredentials, checkCredential, setDefaultCredential } from "@/api/modules/weRss";
import type { WechatCredential } from "@/types/weRss";

const loading = ref(false);
const credentialList = ref<WechatCredential[]>([]);

const fetchCredentials = async () => {
  loading.value = true;
  try {
    const res: any = await getCredentials();
    const data = res?.data?.results || res?.data || [];
    credentialList.value = Array.isArray(data) ? data : [];
  } catch (err: any) {
    ElMessage.error(err.message || "获取微信凭证失败");
  } finally {
    loading.value = false;
  }
};

const handleCheck = async (row: WechatCredential) => {
  try {
    const res: any = await checkCredential(row.id);
    const valid = res?.data?.is_valid;
    if (valid) {
      ElMessage.success("凭证在线校验成功，当前状态有效");
    } else {
      ElMessage.warning("凭证校验失效，请重新扫码托管");
    }
    fetchCredentials();
  } catch (err: any) {
    ElMessage.error(err.message || "凭证校验失败");
  }
};

const handleSetDefault = async (row: WechatCredential) => {
  try {
    await setDefaultCredential(row.id);
    ElMessage.success(`已将「${row.name}」设为租户默认抓取凭证`);
    fetchCredentials();
  } catch (err: any) {
    ElMessage.error(err.message || "设置默认凭证失败");
  }
};

onMounted(() => {
  fetchCredentials();
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never" class="mb-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold">微信公众平台托管凭证</h2>
          <p class="text-sm text-gray-500 mt-1">管理微信抓取服务所需账号会话凭证，支持在线保活探测与多账号轮询调度</p>
        </div>
        <el-button type="primary" @click="fetchCredentials">刷新凭证</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="credentialList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="75" align="center" />
        <el-table-column prop="name" label="凭证名称" min-width="160">
          <template #default="{ row }">
            <span class="font-bold text-gray-800">{{ row.name }}</span>
            <el-tag v-if="row.is_default" size="small" type="success" class="ml-2">默认凭证</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="当前状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'"
              size="small"
            >
              {{ row.status === 'active' ? '有效活跃' : row.status === 'expired' ? '已过期' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_check_at" label="最近探测时间" width="170">
          <template #default="{ row }">
            {{ row.last_check_at || '未探测' }}
          </template>
        </el-table-column>
        <el-table-column prop="expires_at" label="凭证有效期至" width="170">
          <template #default="{ row }">
            {{ row.expires_at || '长期/未指定' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleCheck(row)">
              连通探测
            </el-button>
            <el-button
              v-if="!row.is_default"
              size="small"
              type="success"
              link
              @click="handleSetDefault(row)"
            >
              设为默认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
