<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Search,
  Refresh,
  Calendar,
  User,
  Document,
  Timer,
  Trophy,
  Coin,
  CircleCheck,
  Warning
} from "@element-plus/icons-vue";
import { getApplicationList } from "@/api/modules/application";
import { getCheckinStreaks, getCheckinRecords } from "@/api/modules/points";
import type { Application } from "@/types/application";
import type { UserCheckinStreak, UserCheckinRecord } from "@/types/points";
import { formatDate } from "@/utils/dateUtil";

const route = useRoute();

// 应用列表
const appLoading = ref(false);
const applicationList = ref<Application[]>([]);
const selectedAppId = ref<number | null>(null);

// 激活的 Tab：'streaks' 或 'records'
const activeTab = ref<"streaks" | "records">("streaks");

// ----------------------------------------------------
// Tab 1: 用户连续签到统计
// ----------------------------------------------------
const streakLoading = ref(false);
const streakList = ref<UserCheckinStreak[]>([]);
const streakTotal = ref(0);
const streakParams = reactive({
  page: 1,
  page_size: 10,
  search: ""
});

const fetchStreaks = async () => {
  streakLoading.value = true;
  try {
    const params: Record<string, any> = {
      page: streakParams.page,
      page_size: streakParams.page_size
    };
    if (selectedAppId.value) {
      params.application = selectedAppId.value;
    }
    if (streakParams.search.trim()) {
      params.search = streakParams.search.trim();
    }
    const res: any = await getCheckinStreaks(params);
    const data = res?.data || res;
    if (data && Array.isArray(data.results)) {
      streakList.value = data.results;
      streakTotal.value = data.count || data.results.length;
    } else if (Array.isArray(data)) {
      streakList.value = data;
      streakTotal.value = data.length;
    } else {
      streakList.value = [];
      streakTotal.value = 0;
    }
  } catch (err: any) {
    ElMessage.error(err.message || "获取连续签到数据失败");
  } finally {
    streakLoading.value = false;
  }
};

// ----------------------------------------------------
// Tab 2: 签到流水记录明细
// ----------------------------------------------------
const recordLoading = ref(false);
const recordList = ref<UserCheckinRecord[]>([]);
const recordTotal = ref(0);
const recordParams = reactive({
  page: 1,
  page_size: 10,
  search: "",
  is_recheckin: undefined as boolean | undefined,
  checkin_date: ""
});

const fetchRecords = async () => {
  recordLoading.value = true;
  try {
    const params: Record<string, any> = {
      page: recordParams.page,
      page_size: recordParams.page_size
    };
    if (selectedAppId.value) {
      params.application = selectedAppId.value;
    }
    if (recordParams.search.trim()) {
      params.search = recordParams.search.trim();
    }
    if (recordParams.is_recheckin !== undefined) {
      params.is_recheckin = recordParams.is_recheckin;
    }
    if (recordParams.checkin_date) {
      params.checkin_date = recordParams.checkin_date;
    }
    const res: any = await getCheckinRecords(params);
    const data = res?.data || res;
    if (data && Array.isArray(data.results)) {
      recordList.value = data.results;
      recordTotal.value = data.count || data.results.length;
    } else if (Array.isArray(data)) {
      recordList.value = data;
      recordTotal.value = data.length;
    } else {
      recordList.value = [];
      recordTotal.value = 0;
    }
  } catch (err: any) {
    ElMessage.error(err.message || "获取签到流水明细失败");
  } finally {
    recordLoading.value = false;
  }
};

// 加载应用下拉列表
const fetchApplications = async () => {
  appLoading.value = true;
  try {
    const res: any = await getApplicationList({ page_size: 100 });
    const list = res?.data?.results || res?.data || [];
    applicationList.value = Array.isArray(list) ? list : [];

    if (route.query.application_id) {
      const qId = Number(route.query.application_id);
      if (applicationList.value.some(a => a.id === qId)) {
        selectedAppId.value = qId;
      }
    }
  } catch (err: any) {
    ElMessage.error(err.message || "获取应用列表失败");
  } finally {
    appLoading.value = false;
  }
};

// 切换应用或搜索
const handleAppChange = () => {
  streakParams.page = 1;
  recordParams.page = 1;
  refreshCurrentTab();
};

const refreshCurrentTab = () => {
  if (activeTab.value === "streaks") {
    fetchStreaks();
  } else {
    fetchRecords();
  }
};

const handleTabChange = () => {
  refreshCurrentTab();
};

// 从总览跳到流水查看指定成员
const handleViewMemberRecords = (username: string) => {
  recordParams.search = username;
  recordParams.page = 1;
  activeTab.value = "records";
  fetchRecords();
};

onMounted(async () => {
  await fetchApplications();
  refreshCurrentTab();
});
</script>

<template>
  <div class="checkin-manage-container p-4">
    <!-- 头部顶栏：应用筛选与操作 -->
    <el-card shadow="never" class="mb-4 !border-gray-200">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm font-semibold text-gray-700">所属应用：</span>
          <el-select
            v-model="selectedAppId"
            placeholder="全部应用 (租户下所有打卡)"
            clearable
            style="width: 240px"
            :loading="appLoading"
            @change="handleAppChange"
          >
            <el-option
              v-for="app in applicationList"
              :key="app.id"
              :label="`${app.name} (${app.code})`"
              :value="app.id"
            />
          </el-select>

          <span class="text-xs text-gray-400">
            按应用统计成员打卡连签天数与积分奖励流水
          </span>
        </div>

        <div class="flex items-center gap-2">
          <el-button :icon="Refresh" @click="refreshCurrentTab">
            刷新数据
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 主体 Tabs 卡片 -->
    <el-card shadow="never" class="!border-gray-200">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- Tab 1: 用户连续签到总览 -->
        <el-tab-pane name="streaks">
          <template #label>
            <div class="flex items-center gap-2">
              <el-icon><User /></el-icon>
              <span>用户连续签到总览</span>
              <el-badge
                v-if="streakTotal > 0"
                :value="streakTotal"
                type="primary"
                class="ml-1"
              />
            </div>
          </template>

          <!-- 搜索筛选栏 -->
          <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div class="flex items-center gap-3">
              <el-input
                v-model="streakParams.search"
                placeholder="搜索成员用户名 / 邮箱"
                clearable
                style="width: 260px"
                :prefix-icon="Search"
                @keyup.enter="fetchStreaks"
                @clear="fetchStreaks"
              />
              <el-button type="primary" :icon="Search" @click="fetchStreaks">
                查询
              </el-button>
            </div>
          </div>

          <!-- 总览表格 -->
          <el-table
            v-loading="streakLoading"
            :data="streakList"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column label="成员信息" min-width="180">
              <template #default="{ row }">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-800">
                    {{ row.member_username || `ID:${row.member}` }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ row.member_email || "无邮箱" }}
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="所属应用" min-width="140">
              <template #default="{ row }">
                <el-tag v-if="row.application_name" type="info" effect="plain" size="small">
                  {{ row.application_name }}
                </el-tag>
                <el-tag v-else type="warning" effect="plain" size="small">
                  租户全局
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="今日打卡" width="110" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.has_checked_in_today" type="success" size="small">
                  <el-icon class="mr-1"><CircleCheck /></el-icon>已签到
                </el-tag>
                <el-tag v-else type="info" size="small">
                  未打卡
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="当前连续天数" min-width="140" align="center" sortable prop="current_streak">
              <template #default="{ row }">
                <span class="inline-flex items-center font-bold text-base text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  🔥 {{ row.current_streak }} 天
                </span>
              </template>
            </el-table-column>

            <el-table-column label="历史最高连签" min-width="130" align="center" sortable prop="max_streak">
              <template #default="{ row }">
                <span class="text-gray-700 font-medium">
                  🏆 {{ row.max_streak }} 天
                </span>
              </template>
            </el-table-column>

            <el-table-column label="累计签到天数" min-width="130" align="center" sortable prop="total_days">
              <template #default="{ row }">
                <span class="text-blue-600 font-semibold">
                  {{ row.total_days }} 天
                </span>
              </template>
            </el-table-column>

            <el-table-column label="最后打卡日期" min-width="140" align="center">
              <template #default="{ row }">
                <span v-if="row.last_checkin_date" class="text-gray-600">
                  {{ row.last_checkin_date }}
                </span>
                <span v-else class="text-gray-400 text-xs">--</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="130" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="handleViewMemberRecords(row.member_username)"
                >
                  明细流水
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="streakParams.page"
              v-model:page-size="streakParams.page_size"
              :total="streakTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchStreaks"
              @current-change="fetchStreaks"
            />
          </div>
        </el-tab-pane>

        <!-- Tab 2: 签到流水明细 -->
        <el-tab-pane name="records">
          <template #label>
            <div class="flex items-center gap-2">
              <el-icon><Document /></el-icon>
              <span>签到流水明细</span>
            </div>
          </template>

          <!-- 筛选栏 -->
          <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div class="flex flex-wrap items-center gap-3">
              <el-input
                v-model="recordParams.search"
                placeholder="搜索成员用户名 / 邮箱"
                clearable
                style="width: 220px"
                :prefix-icon="Search"
                @keyup.enter="fetchRecords"
                @clear="fetchRecords"
              />

              <el-select
                v-model="recordParams.is_recheckin"
                placeholder="打卡类型"
                clearable
                style="width: 140px"
                @change="fetchRecords"
              >
                <el-option label="全部类型" :value="undefined" />
                <el-option label="正常打卡" :value="false" />
                <el-option label="补签打卡" :value="true" />
              </el-select>

              <el-date-picker
                v-model="recordParams.checkin_date"
                type="date"
                placeholder="签到归属日期"
                value-format="YYYY-MM-DD"
                clearable
                style="width: 160px"
                @change="fetchRecords"
              />

              <el-button type="primary" :icon="Search" @click="fetchRecords">
                查询
              </el-button>
            </div>
          </div>

          <!-- 流水表格 -->
          <el-table
            v-loading="recordLoading"
            :data="recordList"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column label="签到归属日期" min-width="130" align="center" prop="checkin_date">
              <template #default="{ row }">
                <span class="font-semibold text-gray-800">
                  📅 {{ row.checkin_date }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="打卡时间" min-width="160" align="center">
              <template #default="{ row }">
                <span class="text-xs text-gray-500">
                  {{ formatDate(row.created_at) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="所属应用" min-width="140">
              <template #default="{ row }">
                <el-tag v-if="row.application_name" type="info" effect="plain" size="small">
                  {{ row.application_name }}
                </el-tag>
                <el-tag v-else type="warning" effect="plain" size="small">
                  租户全局
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="成员" min-width="160">
              <template #default="{ row }">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-800">
                    {{ row.member_username || `ID:${row.member}` }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ row.member_email || "无邮箱" }}
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="连续序号" width="110" align="center">
              <template #default="{ row }">
                <el-tag type="primary" size="small">
                  第 {{ row.streak_day }} 天
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="奖励积分" width="120" align="center">
              <template #default="{ row }">
                <span class="font-bold text-emerald-600">
                  +{{ row.reward_points }} 分
                </span>
              </template>
            </el-table-column>

            <el-table-column label="打卡类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.is_recheckin" type="warning" size="small" effect="light">
                  ✨ 补签打卡
                </el-tag>
                <el-tag v-else type="success" size="small" effect="light">
                  ✅ 正常打卡
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="recordParams.page"
              v-model:page-size="recordParams.page_size"
              :total="recordTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchRecords"
              @current-change="fetchRecords"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.checkin-manage-container :deep(.el-card) {
  border-radius: 8px;
}
</style>
