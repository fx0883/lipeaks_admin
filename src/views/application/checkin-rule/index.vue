<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Calendar,
  Plus,
  Refresh,
  Edit,
  Delete,
  Check,
  Opportunity,
  Coin
} from "@element-plus/icons-vue";
import {
  getCheckinConfigs,
  createCheckinConfig,
  updateCheckinConfig,
  deleteCheckinConfig,
  getDefaultCheckinLadder
} from "@/api/modules/points";
import { getApplicationList } from "@/api/modules/application";
import type { CheckinConfig, CheckinLadderItem } from "@/types/points";
import type { Application } from "@/types/application";
import { formatDate } from "@/utils/dateUtil";

const route = useRoute();
const router = useRouter();

// 应用列表
const appLoading = ref(false);
const applicationList = ref<Application[]>([]);
const currentAppId = ref<number | null>(null);

// 规则列表与加载状态
const loading = ref(false);
const configList = ref<CheckinConfig[]>([]);

// 对话框表单状态
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const submitLoading = ref(false);

const formData = reactive<Partial<CheckinConfig> & { reward_ladder: CheckinLadderItem[] }>({
  id: undefined,
  application: null,
  name: "应用每日签到奖励",
  cycle_days: 7,
  cycle_mode: "repeat",
  reward_ladder: [],
  allow_recheckin: false,
  recheckin_cost: 50,
  is_active: true
});

// 当前选中应用对应的配置
const currentAppConfig = computed(() => {
  return configList.value.find(c => c.application === currentAppId.value);
});

// 加载应用列表
const fetchApplications = async () => {
  appLoading.value = true;
  try {
    const res: any = await getApplicationList({ page_size: 100 });
    const list = res?.data?.results || res?.data || [];
    applicationList.value = Array.isArray(list) ? list : [];

    const queryAppId = route.query.application_id ? Number(route.query.application_id) : null;
    if (queryAppId && applicationList.value.some(a => a.id === queryAppId)) {
      currentAppId.value = queryAppId;
    } else if (applicationList.value.length > 0 && currentAppId.value === null) {
      currentAppId.value = applicationList.value[0].id;
    }
  } catch (err: any) {
    ElMessage.error(err.message || "获取应用列表失败");
  } finally {
    appLoading.value = false;
  }
};

// 获取所有签到配置列表
const fetchConfigs = async () => {
  loading.value = true;
  try {
    const res: any = await getCheckinConfigs({ page_size: 100 });
    const list = res?.data?.results || res?.data || [];
    configList.value = Array.isArray(list) ? list : [];
  } catch (err: any) {
    ElMessage.error(err.message || "获取签到规则失败");
  } finally {
    loading.value = false;
  }
};

const handleAppChange = (val: number | null) => {
  currentAppId.value = val;
  if (val) {
    router.replace({ query: { ...route.query, application_id: String(val) } });
  } else {
    const q = { ...route.query };
    delete q.application_id;
    router.replace({ query: q });
  }
};

// 预填默认 7 天阶梯
const loadDefaultLadder = async () => {
  try {
    const res: any = await getDefaultCheckinLadder();
    const ladder = res?.data || res || [];
    if (Array.isArray(ladder) && ladder.length > 0) {
      formData.reward_ladder = JSON.parse(JSON.stringify(ladder));
      formData.cycle_days = formData.reward_ladder.length;
      ElMessage.success("已载入推荐 7 天连续签到阶梯");
    }
  } catch {
    formData.reward_ladder = [
      { day: 1, points: 10, label: "第1天" },
      { day: 2, points: 15, label: "第2天" },
      { day: 3, points: 20, label: "第3天" },
      { day: 4, points: 25, label: "第4天" },
      { day: 5, points: 30, label: "第5天" },
      { day: 6, points: 40, label: "第6天" },
      { day: 7, points: 100, label: "满签大礼包" }
    ];
    formData.cycle_days = 7;
  }
};

// 打开新建对话框
const handleOpenCreate = async () => {
  dialogMode.value = "create";
  formData.id = undefined;
  formData.application = currentAppId.value;
  const currentApp = applicationList.value.find(a => a.id === currentAppId.value);
  formData.name = currentApp ? `【${currentApp.name}】每日签到` : "全局每日签到";
  formData.cycle_days = 7;
  formData.cycle_mode = "repeat";
  formData.allow_recheckin = false;
  formData.recheckin_cost = 50;
  formData.is_active = true;
  await loadDefaultLadder();
  dialogVisible.value = true;
};

// 打开编辑对话框
const handleOpenEdit = (config: CheckinConfig) => {
  dialogMode.value = "edit";
  formData.id = config.id;
  formData.application = config.application;
  formData.name = config.name;
  formData.cycle_days = config.cycle_days;
  formData.cycle_mode = config.cycle_mode;
  formData.allow_recheckin = config.allow_recheckin;
  formData.recheckin_cost = config.recheckin_cost;
  formData.is_active = config.is_active;
  formData.reward_ladder = Array.isArray(config.reward_ladder) && config.reward_ladder.length > 0
    ? JSON.parse(JSON.stringify(config.reward_ladder))
    : [];
  if (formData.reward_ladder.length === 0) {
    loadDefaultLadder();
  }
  dialogVisible.value = true;
};

// 增加一天阶梯
const addLadderDay = () => {
  const nextDay = formData.reward_ladder.length + 1;
  const lastPoints = formData.reward_ladder.length > 0
    ? formData.reward_ladder[formData.reward_ladder.length - 1].points
    : 10;
  formData.reward_ladder.push({
    day: nextDay,
    points: lastPoints + 10,
    label: `第${nextDay}天`
  });
  formData.cycle_days = formData.reward_ladder.length;
};

// 删除指定阶梯项
const removeLadderDay = (index: number) => {
  formData.reward_ladder.splice(index, 1);
  // 重新对天数重新编号
  formData.reward_ladder.forEach((item, idx) => {
    item.day = idx + 1;
  });
  formData.cycle_days = formData.reward_ladder.length;
};

// 保存配置
const handleSubmit = async () => {
  if (!formData.name?.trim()) {
    ElMessage.warning("请输入规则名称");
    return;
  }
  if (!formData.reward_ladder || formData.reward_ladder.length === 0) {
    ElMessage.warning("请至少配置一天的签到奖励");
    return;
  }

  submitLoading.value = true;
  try {
    const payload = {
      application: formData.application,
      name: formData.name.trim(),
      cycle_days: formData.reward_ladder.length,
      cycle_mode: formData.cycle_mode,
      reward_ladder: formData.reward_ladder,
      allow_recheckin: formData.allow_recheckin,
      recheckin_cost: formData.recheckin_cost,
      is_active: formData.is_active
    };

    if (dialogMode.value === "create") {
      await createCheckinConfig(payload);
      ElMessage.success("创建签到规则成功");
    } else if (formData.id) {
      await updateCheckinConfig(formData.id, payload);
      ElMessage.success("修改签到规则成功");
    }
    dialogVisible.value = false;
    await fetchConfigs();
  } catch (err: any) {
    ElMessage.error(err.message || "保存签到规则失败");
  } finally {
    submitLoading.value = false;
  }
};

// 删除配置
const handleDelete = (config: CheckinConfig) => {
  if (!config.id) return;
  ElMessageBox.confirm(
    `确定要删除签到规则【${config.name}】吗？删除后该应用的用户将无法继续打卡获得积分。`,
    "删除确认",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await deleteCheckinConfig(config.id!);
      ElMessage.success("签到规则已删除");
      fetchConfigs();
    } catch (err: any) {
      ElMessage.error(err.message || "删除规则失败");
    }
  });
};

onMounted(async () => {
  await fetchApplications();
  await fetchConfigs();
});
</script>

<template>
  <div class="main p-4">
    <!-- 顶部应用切换与筛选栏 -->
    <el-card shadow="never" class="mb-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-gray-700">当前所属应用:</span>
          <el-select
            v-model="currentAppId"
            placeholder="请选择应用"
            class="w-64"
            :loading="appLoading"
            @change="handleAppChange"
          >
            <el-option
              v-for="item in applicationList"
              :key="item.id"
              :label="`${item.name} (${item.code})`"
              :value="item.id"
            />
          </el-select>
          <span class="text-xs text-gray-400">
            每一个应用均具备专属且完全独立的连续签到阶梯奖励规则
          </span>
        </div>

        <div class="flex items-center gap-2">
          <el-button :icon="Refresh" @click="fetchConfigs">刷新配置</el-button>
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleOpenCreate"
          >
            配置当前应用签到规则
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 主展示区：当前应用签到规则详情卡片 -->
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <el-icon class="text-primary text-lg"><Calendar /></el-icon>
            <span class="font-bold text-base">
              {{ currentAppConfig ? currentAppConfig.name : "签到规则概览" }}
            </span>
            <el-tag
              v-if="currentAppConfig"
              :type="currentAppConfig.is_active ? 'success' : 'info'"
              size="small"
            >
              {{ currentAppConfig.is_active ? "已启用" : "已停用" }}
            </el-tag>
          </div>
          <div v-if="currentAppConfig" class="flex gap-2">
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              @click="handleOpenEdit(currentAppConfig)"
            >
              修改规则
            </el-button>
            <el-button
              type="danger"
              size="small"
              plain
              :icon="Delete"
              @click="handleDelete(currentAppConfig)"
            >
              删除
            </el-button>
          </div>
        </div>
      </template>

      <!-- 已经配置了规则 -->
      <div v-if="currentAppConfig">
        <!-- 规则基础属性摘要 -->
        <el-descriptions :column="4" border class="mb-6">
          <el-descriptions-item label="所属应用">
            <span class="font-medium text-blue-600">
              {{ currentAppConfig.application_name || "全局配置" }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="打卡周期天数">
            <span class="font-bold text-primary">{{ currentAppConfig.cycle_days }} 天</span>
          </el-descriptions-item>
          <el-descriptions-item label="周期结算模式">
            <el-tag size="small" type="warning">
              {{ currentAppConfig.cycle_mode === 'repeat' ? '满签循环重置(推荐)' : '保持封顶奖励' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="允许补签">
            <span v-if="currentAppConfig.allow_recheckin" class="text-green-600 font-semibold">
              支持 (消耗 {{ currentAppConfig.recheckin_cost }} 积分/次)
            </span>
            <span v-else class="text-gray-400">关闭</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 阶梯奖励日历卡片展示 -->
        <div class="mb-3 flex items-center justify-between">
          <div class="text-sm font-bold text-gray-700 flex items-center gap-1">
            <el-icon class="text-amber-500"><Coin /></el-icon>
            连续签到阶梯奖励明细（用户每日打卡所得）
          </div>
          <span class="text-xs text-gray-400">
            连续签到天数达标时自动解锁对应奖励，断签将重置回第 1 天
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div
            v-for="(item, index) in currentAppConfig.reward_ladder"
            :key="index"
            class="p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200"
            :class="[
              index === currentAppConfig.reward_ladder.length - 1
                ? 'bg-amber-50 border-amber-300 shadow-sm'
                : 'bg-white border-gray-200 hover:border-blue-300'
            ]"
          >
            <div class="text-xs font-semibold text-gray-500 mb-1">
              {{ item.label || `第 ${item.day} 天` }}
            </div>
            <div class="my-2">
              <span class="text-2xl font-black text-amber-500 font-mono">
                +{{ item.points }}
              </span>
              <span class="text-xs text-gray-500 ml-1">分</span>
            </div>
            <el-tag
              size="small"
              :type="index === currentAppConfig.reward_ladder.length - 1 ? 'danger' : 'info'"
            >
              {{ index === currentAppConfig.reward_ladder.length - 1 ? '🎁 终极大奖' : '每日奖励' }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 未配置规则空状态 -->
      <div v-else class="py-12 flex flex-col items-center justify-center">
        <el-empty description="当前应用尚未配置签到规则">
          <el-button type="primary" :icon="Plus" @click="handleOpenCreate">
            立即配置该应用的签到规则
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 配置规则弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '配置应用每日签到规则' : '修改每日签到规则'"
      width="780px"
      destroy-on-close
    >
      <el-form label-width="120px" :model="formData">
        <el-form-item label="规则名称" required>
          <el-input v-model="formData.name" placeholder="如：填色花园每日连续打卡" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="结算周期模式" required>
              <el-radio-group v-model="formData.cycle_mode">
                <el-radio value="repeat">循环重置(推荐)</el-radio>
                <el-radio value="cap">封顶保持</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否启用">
              <el-switch v-model="formData.is_active" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="允许补签">
              <el-switch v-model="formData.allow_recheckin" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.allow_recheckin">
            <el-form-item label="补签扣除积分">
              <el-input-number v-model="formData.recheckin_cost" :min="0" :step="10" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 阶梯奖励动态表格 -->
        <el-divider content-position="left">
          <span class="font-bold text-gray-700">阶梯奖励配置 (天数与积分)</span>
        </el-divider>

        <div class="mb-3 flex justify-between items-center">
          <span class="text-xs text-gray-500">
            按天递增配置奖励数额，支持自定义周期长度与任意天数奖励
          </span>
          <div class="flex gap-2">
            <el-button size="small" type="warning" plain @click="loadDefaultLadder">
              载入推荐 7 天阶梯
            </el-button>
            <el-button size="small" type="primary" :icon="Plus" @click="addLadderDay">
              新增一天
            </el-button>
          </div>
        </div>

        <el-table :data="formData.reward_ladder" border size="small" class="w-full">
          <el-table-column label="连续天数" width="100" align="center">
            <template #default="{ row }">
              <span class="font-bold font-mono">第 {{ row.day }} 天</span>
            </template>
          </el-table-column>

          <el-table-column label="奖励积分数" min-width="160">
            <template #default="{ row }">
              <el-input-number
                v-model="row.points"
                :min="1"
                :max="100000"
                :step="5"
                size="small"
                class="w-full"
              />
            </template>
          </el-table-column>

          <el-table-column label="提示说明 / 标签" min-width="160">
            <template #default="{ row }">
              <el-input
                v-model="row.label"
                placeholder="如：第1天奖励、宝箱大奖"
                size="small"
              />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button
                v-if="formData.reward_ladder.length > 1"
                type="danger"
                link
                size="small"
                :icon="Delete"
                @click="removeLadderDay($index)"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            保存配置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.main {
  width: 100%;
}
</style>
