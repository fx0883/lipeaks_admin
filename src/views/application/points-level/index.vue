<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, Delete, Refresh, Picture, UploadFilled } from "@element-plus/icons-vue";
import {
  getApplicationPointsLevels,
  createApplicationPointsLevel,
  updateApplicationPointsLevel,
  deleteApplicationPointsLevel,
  getPresetLevelIcons,
  uploadLevelIcon
} from "@/api/modules/points";
import { getApplicationList } from "@/api/modules/application";
import { getMediaUrl } from "@/utils/media";
import type { ApplicationUserLevel } from "@/types/points";
import type { Application } from "@/types/application";

const route = useRoute();
const router = useRouter();

// 应用列表与当前选中的应用
const appLoading = ref(false);
const applicationList = ref<Application[]>([]);
const currentAppId = ref<number | undefined>(undefined);

// 等级列表
const loading = ref(false);
const levelList = ref<ApplicationUserLevel[]>([]);

// 预置透明图标
interface PresetIcon {
  filename: string;
  name: string;
  relative_path: string;
  url: string;
}
const presetIcons = ref<PresetIcon[]>([]);
const iconTab = ref<"preset" | "upload">("preset");

// 对话框表单
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const uploadLoading = ref(false);

const formData = reactive({
  id: 0,
  application: undefined as number | undefined,
  level_name: "",
  level_code: "",
  level_order: 1,
  min_points: 0,
  max_points: null as number | null,
  icon: "",
  icon_url: "",
  level_color: "#CD7F32",
  level_description: "",
  is_default: false,
  is_active: true
});

// 获取所有应用
const fetchApplications = async () => {
  appLoading.value = true;
  try {
    const res: any = await getApplicationList({ page_size: 100 });
    const list = res?.data?.results || res?.data || [];
    applicationList.value = Array.isArray(list) ? list : [];
    
    // 如果 URL 参数有 application_id 则优先使用
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

// 获取预置图标
const fetchPresetIcons = async () => {
  try {
    const res: any = await getPresetLevelIcons();
    const raw = res?.data;
    let list: PresetIcon[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (Array.isArray(raw?.data)) {
      list = raw.data;
    } else if (Array.isArray(res)) {
      list = res;
    }
    presetIcons.value = list;
  } catch (err) {
    console.error("加载预置图标失败", err);
  }
};

// 获取当前应用的等级列表
const fetchLevels = async () => {
  if (!currentAppId.value) {
    levelList.value = [];
    return;
  }
  loading.value = true;
  try {
    const res: any = await getApplicationPointsLevels({
      application: currentAppId.value
    });
    const data = res?.data?.results || res?.data || [];
    levelList.value = Array.isArray(data) ? data : [];
  } catch (err: any) {
    ElMessage.error(err.message || "获取应用专属等级失败");
  } finally {
    loading.value = false;
  }
};

// 切换应用
const handleAppChange = (val: number) => {
  currentAppId.value = val;
  router.replace({ query: { ...route.query, application_id: String(val) } });
  fetchLevels();
};

// 打开新建对话框
const handleCreate = async () => {
  if (!currentAppId.value) {
    ElMessage.warning("请先选择所属应用");
    return;
  }
  if (presetIcons.value.length === 0) {
    await fetchPresetIcons();
  }
  isEdit.value = false;
  const nextOrder = (levelList.value.length > 0 ? Math.max(...levelList.value.map(l => l.level_order)) : 0) + 1;
  const nextMinPoints = levelList.value.length > 0 ? (levelList.value[levelList.value.length - 1].max_points || 1000) : 0;
  
  formData.id = 0;
  formData.application = currentAppId.value;
  formData.level_name = "";
  formData.level_code = `LV_${nextOrder}`;
  formData.level_order = nextOrder;
  formData.min_points = nextMinPoints;
  formData.max_points = nextMinPoints + 1000;
  formData.icon = presetIcons.value.length > 0 ? presetIcons.value[0].relative_path : "";
  formData.icon_url = presetIcons.value.length > 0 ? presetIcons.value[0].url : "";
  formData.level_color = "#FFD700";
  formData.level_description = "";
  formData.is_default = levelList.value.length === 0;
  formData.is_active = true;
  
  iconTab.value = "preset";
  dialogVisible.value = true;
};

// 打开编辑对话框
const handleEdit = (row: ApplicationUserLevel) => {
  isEdit.value = true;
  formData.id = row.id;
  formData.application = row.application;
  formData.level_name = row.level_name;
  formData.level_code = row.level_code;
  formData.level_order = row.level_order;
  formData.min_points = row.min_points;
  formData.max_points = row.max_points ?? null;
  formData.icon = row.icon || "";
  formData.icon_url = row.icon_url || "";
  formData.level_color = row.level_color || "#999999";
  formData.level_description = row.level_description || "";
  formData.is_default = row.is_default;
  formData.is_active = row.is_active;
  
  iconTab.value = "preset";
  dialogVisible.value = true;
};

// 选择预置图标
const selectPresetIcon = (iconItem: PresetIcon) => {
  formData.icon = iconItem.relative_path;
  formData.icon_url = iconItem.url;
};

// 上传自定义图标
const handleCustomUpload = async (options: any) => {
  uploadLoading.value = true;
  try {
    const file = options.file;
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    const res: any = await uploadLevelIcon(bodyFormData);
    const data = res?.data?.data || res?.data || res;
    const path = data?.path || data?.filename;
    const url = data?.url || (path ? getMediaUrl(path) : "");
    if (path) {
      formData.icon = path;
      formData.icon_url = url;
      ElMessage.success("图标上传成功");
    } else {
      ElMessage.error(data?.error || res?.error || "上传失败");
    }
  } catch (err: any) {
    ElMessage.error(err.message || "上传图标失败");
  } finally {
    uploadLoading.value = false;
  }
};

// 提交保存
const handleSubmit = async () => {
  if (!formData.level_name.trim()) {
    ElMessage.warning("请输入等级名称");
    return;
  }
  if (!formData.level_code.trim()) {
    ElMessage.warning("请输入等级代码");
    return;
  }
  if (formData.min_points < 0) {
    ElMessage.warning("最低门槛积分不能为负数");
    return;
  }
  if (formData.max_points !== null && formData.max_points <= formData.min_points) {
    ElMessage.warning("最高积分上限必须大于最低积分门槛");
    return;
  }

  submitLoading.value = true;
  try {
    const payload = {
      application: formData.application!,
      level_name: formData.level_name.trim(),
      level_code: formData.level_code.trim(),
      level_order: formData.level_order,
      min_points: formData.min_points,
      max_points: formData.max_points,
      icon: formData.icon,
      level_color: formData.level_color,
      level_description: formData.level_description,
      is_default: formData.is_default,
      is_active: formData.is_active
    };

    if (isEdit.value) {
      await updateApplicationPointsLevel(formData.id, payload);
      ElMessage.success("更新等级成功");
    } else {
      await createApplicationPointsLevel(payload);
      ElMessage.success("创建等级成功");
    }
    dialogVisible.value = false;
    fetchLevels();
  } catch (err: any) {
    ElMessage.error(err.message || "保存等级失败");
  } finally {
    submitLoading.value = false;
  }
};

// 删除等级
const handleDelete = (row: ApplicationUserLevel) => {
  ElMessageBox.confirm(
    `确定要删除应用等级 "${row.level_name}" 吗？若有用户已达到此等级可能会受到影响。`,
    "删除警告",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await deleteApplicationPointsLevel(row.id);
      ElMessage.success("删除等级成功");
      fetchLevels();
    } catch (err: any) {
      ElMessage.error(err.message || "删除等级失败");
    }
  });
};

onMounted(async () => {
  await fetchPresetIcons();
  await fetchApplications();
  fetchLevels();
});
</script>

<template>
  <div class="p-4">
    <!-- 顶部应用切换与控制栏 -->
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
          <span class="text-xs text-gray-400">
            每一个应用均具备专属且完全独立的成长等级标准与特权
          </span>
        </div>

        <div class="flex items-center gap-2">
          <el-button :icon="Refresh" @click="fetchLevels">刷新列表</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            新建应用等级
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 等级梯队表格 -->
    <el-card shadow="never">
      <el-table :data="levelList" v-loading="loading" stripe border>
        <el-table-column prop="level_order" label="权重排序" width="90" align="center" />
        
        <!-- 等级徽章图标 -->
        <el-table-column label="专属徽章" width="100" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center">
              <el-image
                v-if="row.icon_url || row.icon"
                :src="getMediaUrl(row.icon_url || row.icon)"
                fit="contain"
                class="w-10 h-10 drop-shadow hover:scale-125 transition-transform duration-200"
                :preview-src-list="[getMediaUrl(row.icon_url || row.icon)]"
                preview-teleported
              />
              <el-icon v-else class="text-2xl text-gray-300">
                <Picture />
              </el-icon>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="level_name" label="等级称号" min-width="140">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full inline-block"
                :style="{ backgroundColor: row.level_color }"
              ></span>
              <span class="font-bold text-sm" :style="{ color: row.level_color }">
                {{ row.level_name }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="level_code" label="等级代码" width="130" />

        <el-table-column label="积分阶梯区间" width="220" align="center">
          <template #default="{ row }">
            <div class="text-xs font-mono">
              <span class="text-blue-600 font-bold">{{ row.min_points?.toLocaleString() }}</span>
              <span class="mx-1 text-gray-400">至</span>
              <span v-if="row.max_points" class="text-blue-600 font-bold">
                {{ row.max_points?.toLocaleString() }}
              </span>
              <span v-else class="text-emerald-600 font-bold">无上限</span>
              <span class="ml-1 text-gray-400">分</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="level_description" label="特权/描述" min-width="180" show-overflow-tooltip />

        <el-table-column prop="is_default" label="新用户初始" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_default ? 'success' : 'info'" size="small">
              {{ row.is_default ? '默认等级' : '升级达成' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="is_active" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'primary' : 'danger'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑等级对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑应用积分等级' : '创建应用积分等级'"
      width="680px"
      :close-on-click-modal="false"
    >
      <el-form label-width="120px" class="pr-4">
        <el-form-item label="所属应用" required>
          <el-select v-model="formData.application" disabled class="w-full">
            <el-option
              v-for="app in applicationList"
              :key="app.id"
              :label="`${app.name} (${app.code})`"
              :value="app.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="等级名称" required>
              <el-input v-model="formData.level_name" placeholder="如: 荣耀黄金、VIP2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级代码" required>
              <el-input v-model="formData.level_code" placeholder="如: GOLD, VIP2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="阶梯序号" required>
              <el-input-number v-model="formData.level_order" :min="1" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标识色">
              <div class="flex items-center gap-3">
                <el-color-picker v-model="formData.level_color" />
                <span class="text-xs text-gray-500 font-mono">{{ formData.level_color }}</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最低积分门槛" required>
              <el-input-number v-model="formData.min_points" :min="0" :step="100" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高积分上限">
              <el-input-number
                v-model="formData.max_points"
                :min="0"
                :step="100"
                placeholder="留空即无上限"
                class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 等级徽章图标选择区 -->
        <el-form-item label="等级徽章图标">
          <div class="w-full border rounded-lg p-3 bg-gray-50/50">
            <!-- 当前选中展示 -->
            <div class="flex items-center gap-4 mb-3 pb-3 border-b">
              <span class="text-xs text-gray-500">当前选用图标：</span>
              <div class="w-12 h-12 rounded-lg border bg-white flex items-center justify-center overflow-hidden p-1">
                <img
                  v-if="formData.icon_url || formData.icon"
                  :src="getMediaUrl(formData.icon_url || formData.icon)"
                  class="w-full h-full object-contain"
                />
                <el-icon v-else class="text-gray-300 text-xl"><Picture /></el-icon>
              </div>
              <span v-if="formData.icon" class="text-xs text-gray-400 break-all truncate max-w-xs">
                {{ formData.icon }}
              </span>
              <span v-else class="text-xs text-amber-500">（尚未设置图标）</span>
            </div>

            <!-- 图标来源 Tabs -->
            <el-radio-group v-model="iconTab" size="small" class="mb-3">
              <el-radio-button value="preset">精选透明勋章 (AI生成)</el-radio-button>
              <el-radio-button value="upload">本地上传自定义</el-radio-button>
            </el-radio-group>

            <!-- 预置图标网格 -->
            <div v-if="iconTab === 'preset'" class="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div
                v-for="item in presetIcons"
                :key="item.filename"
                class="border rounded-md p-2 bg-white flex flex-col items-center justify-center cursor-pointer transition-all duration-150 hover:shadow"
                :class="{
                  'border-blue-500 ring-2 ring-blue-100 bg-blue-50/30': formData.icon === item.relative_path
                }"
                @click="selectPresetIcon(item)"
              >
                <img :src="getMediaUrl(item.url || item.relative_path)" class="w-12 h-12 object-contain mb-1" />
                <span class="text-xs text-gray-700 truncate w-full text-center">
                  {{ item.name }}
                </span>
              </div>
            </div>

            <!-- 本地上传 -->
            <div v-else class="py-2">
              <el-upload
                drag
                action=""
                :http-request="handleCustomUpload"
                :show-file-list="false"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                :disabled="uploadLoading"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text text-xs">
                  将徽章图片拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip text-xs text-gray-400">
                    推荐上传透明背景 PNG 图标，尺寸建议 256x256 或 512x512
                  </div>
                </template>
              </el-upload>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="等级特权描述">
          <el-input
            v-model="formData.level_description"
            type="textarea"
            :rows="2"
            placeholder="说明达成该等级可享有的功能权益或折扣福利..."
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="初始默认等级">
              <el-switch v-model="formData.is_default" />
              <span class="ml-2 text-xs text-gray-400">新加入应用的成员自动匹配此等级</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态">
              <el-switch v-model="formData.is_active" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          保存等级
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
