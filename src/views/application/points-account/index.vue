<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Search, Refresh, Money, Document, Picture } from "@element-plus/icons-vue";
import {
  getApplicationPointsAccounts,
  adjustAppUserPoints,
  getAppUserPointsRecords
} from "@/api/modules/points";
import { getApplicationList } from "@/api/modules/application";
import type { AppUserPointsAccount, TenantUserPoints } from "@/types/points";
import type { Application } from "@/types/application";
import { formatDate } from "@/utils/dateUtil";
import { getMediaUrl } from "@/utils/media";

const route = useRoute();
const router = useRouter();

// 应用列表与当前选中
const appLoading = ref(false);
const applicationList = ref<Application[]>([]);
const currentAppId = ref<number | undefined>(undefined);

// 账户列表
const loading = ref(false);
const accountList = ref<AppUserPointsAccount[]>([]);
const total = ref(0);
const searchKeyword = ref("");
const pagination = reactive({
  page: 1,
  pageSize: 10
});

// 调账对话框
const adjustDialogVisible = ref(false);
const adjustLoading = ref(false);
const currentAccount = ref<AppUserPointsAccount | null>(null);
const adjustForm = reactive({
  points: 100,
  reason: "",
  category: "manual"
});

// 流水明细抽屉
const drawerVisible = ref(false);
const recordsLoading = ref(false);
const accountRecords = ref<TenantUserPoints[]>([]);
const recordsTotal = ref(0);
const recordsPagination = reactive({
  page: 1,
  pageSize: 10
});

// 加载应用列表
const fetchApplications = async () => {
  appLoading.value = true;
  try {
    const res: any = await getApplicationList({ page_size: 100 });
    const list = res?.data?.results || res?.data || [];
    applicationList.value = Array.isArray(list) ? list : [];

    const paramAppId = Number(route.query.application_id);
    if (paramAppId && applicationList.value.some(a => a.id === paramAppId)) {
      currentAppId.value = paramAppId;
    } else if (applicationList.value.length > 0 && !currentAppId.value) {
      currentAppId.value = applicationList.value[0].id;
    }
  } catch (err: any) {
    ElMessage.error(err.message || "获取应用列表失败");
  } finally {
    appLoading.value = false;
  }
};

// 获取积分账户列表
const fetchAccounts = async () => {
  if (!currentAppId.value) {
    accountList.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const res: any = await getApplicationPointsAccounts({
      application: currentAppId.value,
      search: searchKeyword.value.trim(),
      page: pagination.page,
      page_size: pagination.pageSize,
      _t: Date.now() // 防 Safari / 浏览器缓存
    });
    const data = res?.data?.results || res?.data || [];
    accountList.value = Array.isArray(data) ? data : [];
    total.value = res?.data?.count || accountList.value.length;
  } catch (err: any) {
    ElMessage.error(err.message || "获取应用积分账户失败");
  } finally {
    loading.value = false;
  }
};

// 切换应用
const handleAppChange = (val: number) => {
  currentAppId.value = val;
  pagination.page = 1;
  router.replace({ query: { ...route.query, application_id: String(val) } });
  fetchAccounts();
};

// 打开调账对话框
const openAdjustDialog = (row: AppUserPointsAccount) => {
  currentAccount.value = row;
  adjustForm.points = 100;
  adjustForm.reason = "运营活动奖励";
  adjustForm.category = "manual";
  adjustDialogVisible.value = true;
};

// 提交调账
const handleAdjustSubmit = async () => {
  if (!currentAccount.value) return;
  if (!adjustForm.points || adjustForm.points === 0) {
    ElMessage.warning("调账数值不能为0");
    return;
  }
  if (!adjustForm.reason.trim()) {
    ElMessage.warning("请输入调账原因");
    return;
  }

  adjustLoading.value = true;
  try {
    const res: any = await adjustAppUserPoints(currentAccount.value.id, {
      points: adjustForm.points,
      reason: adjustForm.reason.trim(),
      category: adjustForm.category
    });
    const resData = res?.data?.data || res?.data || res;
    if (res?.success || resData?.success) {
      ElMessage.success(resData?.message || res?.message || "调账成功");

      // 1. 响应式更新当前表格数据（无论是否遭遇浏览器缓存都能秒级生效）
      const updatedAccount = resData?.account;
      const targetIndex = accountList.value.findIndex(item => item.id === currentAccount.value?.id);
      if (targetIndex !== -1) {
        if (updatedAccount) {
          accountList.value[targetIndex] = { ...accountList.value[targetIndex], ...updatedAccount };
        } else {
          if (resData?.available_points !== undefined) {
            accountList.value[targetIndex].available_points = resData.available_points;
          }
          if (resData?.total_points !== undefined) {
            accountList.value[targetIndex].total_points = resData.total_points;
          }
          if (resData?.current_level_name && accountList.value[targetIndex].current_level_info) {
            accountList.value[targetIndex].current_level_info.level_name = resData.current_level_name;
          }
        }
      }

      // 2. 关闭弹窗并重新拉取最新列表
      adjustDialogVisible.value = false;
      await fetchAccounts();
    } else {
      ElMessage.error(resData?.error || res?.error || "调账失败");
    }
  } catch (err: any) {
    ElMessage.error(err.message || "调账请求异常");
  } finally {
    adjustLoading.value = false;
  }
};

// 打开流水明细抽屉
const openRecordsDrawer = async (row: AppUserPointsAccount) => {
  currentAccount.value = row;
  recordsPagination.page = 1;
  drawerVisible.value = true;
  fetchAccountRecords();
};

// 加载流水明细
const fetchAccountRecords = async () => {
  if (!currentAccount.value) return;
  recordsLoading.value = true;
  try {
    const res: any = await getAppUserPointsRecords(currentAccount.value.id, {
      page: recordsPagination.page,
      page_size: recordsPagination.pageSize,
      _t: Date.now()
    });
    accountRecords.value = res?.data?.results || res?.data || [];
    recordsTotal.value = res?.data?.count || accountRecords.value.length;
  } catch (err: any) {
    ElMessage.error(err.message || "获取积分流水失败");
  } finally {
    recordsLoading.value = false;
  }
};

onMounted(async () => {
  await fetchApplications();
  fetchAccounts();
});
</script>

<template>
  <div class="p-4">
    <!-- 顶部控制与筛选栏 -->
    <el-card shadow="never" class="mb-4">
      <div class="flex flex-wrap justify-between items-center gap-4">
        <div class="flex items-center gap-3">
          <span class="font-bold text-gray-700 whitespace-nowrap">当前所属应用：</span>
          <el-select
            v-model="currentAppId"
            placeholder="请选择应用"
            filterable
            class="w-64"
            @change="handleAppChange"
            :loading="appLoading"
          >
            <el-option
              v-for="app in applicationList"
              :key="app.id"
              :label="`${app.name} (${app.code})`"
              :value="app.id"
            />
          </el-select>

          <el-input
            v-model="searchKeyword"
            placeholder="搜索成员用户名 / 邮箱"
            clearable
            class="w-60"
            @clear="fetchAccounts"
            @keyup.enter="fetchAccounts"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-button type="primary" :icon="Search" @click="fetchAccounts">
            查询
          </el-button>
        </div>

        <el-button :icon="Refresh" @click="fetchAccounts">刷新数据</el-button>
      </div>
    </el-card>

    <!-- 成员应用积分列表 -->
    <el-card shadow="never">
      <el-table :data="accountList" v-loading="loading" stripe border>
        <el-table-column label="成员信息" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="font-bold text-gray-800 text-sm">{{ row.member_username }}</div>
              <div class="text-xs text-gray-400">{{ row.member_email || '无邮箱' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="当前应用专属等级" min-width="160">
          <template #default="{ row }">
            <div v-if="row.current_level_info" class="flex items-center gap-2">
              <el-image
                v-if="row.current_level_info.icon"
                :src="getMediaUrl(row.current_level_info.icon)"
                class="w-6 h-6 object-contain"
              />
              <span
                class="font-bold text-xs"
                :style="{ color: row.current_level_info.level_color || '#CD7F32' }"
              >
                {{ row.current_level_info.level_name }}
              </span>
            </div>
            <span v-else class="text-gray-400 text-xs">无等级</span>
          </template>
        </el-table-column>

        <el-table-column prop="available_points" label="可用积分" width="130" align="right">
          <template #default="{ row }">
            <span class="font-bold text-blue-600 text-sm">
              {{ row.available_points?.toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="total_points" label="历史总获得" width="130" align="right">
          <template #default="{ row }">
            <span class="text-gray-600 text-sm">
              {{ row.total_points?.toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="points_spent_total" label="已消费积分" width="130" align="right">
          <template #default="{ row }">
            <span class="text-amber-600 text-sm">
              {{ row.points_spent_total?.toLocaleString() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="is_enabled" label="积分功能" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_enabled ? 'success' : 'danger'" size="small">
              {{ row.is_enabled ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最后变动时间" width="160" align="center">
          <template #default="{ row }">
            <span class="text-xs text-gray-400 font-mono">
              {{ row.last_points_update ? formatDate(row.last_points_update) : '从未变动' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="管理操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Money" @click="openAdjustDialog(row)">
              调账
            </el-button>
            <el-button type="info" link :icon="Document" @click="openRecordsDrawer(row)">
              明细流水
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchAccounts"
          @current-change="fetchAccounts"
        />
      </div>
    </el-card>

    <!-- 调账对话框 -->
    <el-dialog
      v-model="adjustDialogVisible"
      title="应用积分人工调账"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="currentAccount" class="mb-4 p-3 bg-blue-50/50 rounded-lg text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">成员用户：</span>
          <span class="font-bold">{{ currentAccount.member_username }}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-gray-500">当前可用积分：</span>
          <span class="font-bold text-blue-600">{{ currentAccount.available_points }} 分</span>
        </div>
      </div>

      <el-form label-width="100px">
        <el-form-item label="调整分值" required>
          <el-input-number
            v-model="adjustForm.points"
            :step="50"
            class="w-full"
            placeholder="正数为充值奖励，负数为扣减"
          />
          <span class="text-xs text-gray-400 mt-1 block">
            输入正数即给用户发放积分；输入负数（如 -50）扣减用户积分
          </span>
        </el-form-item>

        <el-form-item label="业务类型">
          <el-select v-model="adjustForm.category" class="w-full">
            <el-option label="手动运营调账" value="manual" />
            <el-option label="社区活动奖励" value="community" />
            <el-option label="支付消费返点" value="payment" />
            <el-option label="系统补偿" value="system" />
          </el-select>
        </el-form-item>

        <el-form-item label="调账说明" required>
          <el-input
            v-model="adjustForm.reason"
            type="textarea"
            :rows="2"
            placeholder="填写本次调整的具体原由，将记录于审计流水中..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adjustLoading" @click="handleAdjustSubmit">
          确认调账
        </el-button>
      </template>
    </el-dialog>

    <!-- 积分流水抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`积分流水明细 - ${currentAccount?.member_username || ''}`"
      size="650px"
    >
      <el-table :data="accountRecords" v-loading="recordsLoading" stripe border>
        <el-table-column prop="created_at" label="时间" width="150">
          <template #default="{ row }">
            <span class="text-xs font-mono">{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="point_type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.point_type === 'earn' ? 'success' : (row.point_type === 'spend' ? 'warning' : 'info')"
              size="small"
            >
              {{ row.point_type === 'earn' ? '获得' : (row.point_type === 'spend' ? '消费' : '调整') }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="points" label="变动数值" width="100" align="right">
          <template #default="{ row }">
            <span
              class="font-bold font-mono text-sm"
              :class="row.points > 0 ? 'text-green-600' : 'text-red-500'"
            >
              {{ row.points > 0 ? `+${row.points}` : row.points }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="变动前后" width="130" align="center">
          <template #default="{ row }">
            <span class="text-xs font-mono text-gray-500">
              {{ row.balance_before }} ➔ {{ row.balance_after }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="operation_reason" label="原因/说明" min-width="140" show-overflow-tooltip />
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="recordsPagination.page"
          v-model:page-size="recordsPagination.pageSize"
          :total="recordsTotal"
          layout="prev, pager, next"
          @current-change="fetchAccountRecords"
        />
      </div>
    </el-drawer>
  </div>
</template>
