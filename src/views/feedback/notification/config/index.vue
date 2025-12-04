<template>
  <div class="notification-config-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>反馈通知配置</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        新增配置
      </el-button>
    </div>

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="应用">
          <el-select
            v-model="filterForm.application"
            placeholder="全部应用"
            clearable
            filterable
            style="width: 200px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="app in applications"
              :key="app.id"
              :label="app.name"
              :value="app.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filterForm.is_enabled"
            placeholder="全部状态"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option label="已启用" :value="true" />
            <el-option label="已禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 配置列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="configs" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="application_name" label="应用名称" min-width="150">
          <template #default="{ row }">
            <span class="app-name">{{ row.application_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="application_code" label="应用代码" width="140" />
        <el-table-column label="启用状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_enabled"
              :loading="switchLoading[row.id]"
              @change="(val: boolean) => handleToggleEnabled(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="接收者" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.active_recipient_count > 0 ? 'success' : 'info'">
              {{ row.active_recipient_count }} / {{ row.recipient_count }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleManageRecipients(row)">
              管理接收者
            </el-button>
            <el-button link type="primary" size="small" @click="handleViewLogs(row)">
              查看日志
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 创建配置对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新增通知配置"
      width="500px"
      @close="handleCreateDialogClose"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="选择应用" prop="application">
          <el-select
            v-model="createForm.application"
            placeholder="请选择应用"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="app in availableApplications"
              :key="app.id"
              :label="`${app.name} (${app.code})`"
              :value="app.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="启用通知">
          <el-switch v-model="createForm.is_enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreateSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 接收者管理对话框 -->
    <el-dialog
      v-model="recipientsDialogVisible"
      :title="`接收者管理 - ${currentConfig?.application_name || ''}`"
      width="800px"
      @close="handleRecipientsDialogClose"
    >
      <!-- 添加接收者表单 -->
      <el-card shadow="never" class="add-recipient-card">
        <el-form :inline="true" :model="recipientForm" ref="recipientFormRef" :rules="recipientRules">
          <el-form-item prop="email">
            <el-input
              v-model="recipientForm.email"
              placeholder="邮箱地址"
              style="width: 220px"
            />
          </el-form-item>
          <el-form-item prop="name">
            <el-input
              v-model="recipientForm.name"
              placeholder="接收者名称（可选）"
              style="width: 160px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="addRecipientLoading" @click="handleAddRecipient">
              添加接收者
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 接收者列表 -->
      <el-table :data="recipients" v-loading="recipientsLoading" stripe style="width: 100%">
        <el-table-column prop="email" label="邮箱地址" min-width="200" />
        <el-table-column prop="name" label="名称" width="150">
          <template #default="{ row }">
            {{ row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              :loading="recipientSwitchLoading[row.id]"
              @change="(val: boolean) => handleToggleRecipientActive(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="添加时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleTestEmail(row)">
              测试
            </el-button>
            <el-button link type="primary" size="small" @click="handleEditRecipient(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDeleteRecipient(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="recipientsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑接收者对话框 -->
    <el-dialog
      v-model="editRecipientDialogVisible"
      title="编辑接收者"
      width="450px"
    >
      <el-form
        ref="editRecipientFormRef"
        :model="editRecipientForm"
        :rules="recipientRules"
        label-width="100px"
      >
        <el-form-item label="邮箱地址" prop="email">
          <el-input v-model="editRecipientForm.email" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="editRecipientForm.name" placeholder="可选" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editRecipientForm.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editRecipientDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editRecipientLoading" @click="handleEditRecipientSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 测试邮件对话框 -->
    <el-dialog
      v-model="testEmailDialogVisible"
      title="发送测试邮件"
      width="400px"
    >
      <el-form :model="testEmailForm" label-width="100px">
        <el-form-item label="接收邮箱">
          <el-input v-model="testEmailForm.email" placeholder="请输入测试邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testEmailDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="testEmailLoading" @click="handleTestEmailSubmit">
          发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Plus, Refresh } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import dayjs from "dayjs";
import {
  useNotificationConfigList,
  useNotificationConfigActions,
  useNotificationRecipients
} from "@/composables/useFeedbackNotification";
import { useApplicationSelector } from "@/composables/useApplication";
import type {
  FeedbackNotificationConfig,
  NotificationRecipient
} from "@/types/feedback";
import { message } from "@/utils/message";

const router = useRouter();

// 应用选择器
const { applications, fetchApplications } = useApplicationSelector(false);

// 配置列表
const {
  configs,
  loading,
  pagination,
  params,
  fetchConfigs,
  refresh,
  updateParams,
  changePage,
  changePageSize
} = useNotificationConfigList();

// 配置操作
const { create, remove, toggleEnabled } = useNotificationConfigActions();

// 开关加载状态
const switchLoading = reactive<Record<number, boolean>>({});

// 筛选表单
const filterForm = reactive({
  application: null as number | null,
  is_enabled: null as boolean | null
});

// 创建对话框
const createDialogVisible = ref(false);
const createFormRef = ref<FormInstance>();
const createLoading = ref(false);
const createForm = reactive({
  application: null as number | null,
  is_enabled: true
});
const createRules: FormRules = {
  application: [{ required: true, message: "请选择应用", trigger: "change" }]
};

// 计算可用的应用（排除已配置的）
const availableApplications = computed(() => {
  const configuredAppIds = new Set(configs.value.map(c => c.application));
  return applications.value.filter(app => !configuredAppIds.has(app.id));
});

// 接收者管理
const recipientsDialogVisible = ref(false);
const currentConfig = ref<FeedbackNotificationConfig | null>(null);
const currentConfigId = computed(() => currentConfig.value?.id || 0);
const {
  recipients,
  loading: recipientsLoading,
  fetchRecipients,
  add: addRecipient,
  update: updateRecipient,
  remove: removeRecipient,
  toggleActive,
  sendTest
} = useNotificationRecipients(currentConfigId);

// 接收者开关加载状态
const recipientSwitchLoading = reactive<Record<number, boolean>>({});

// 添加接收者表单
const recipientFormRef = ref<FormInstance>();
const addRecipientLoading = ref(false);
const recipientForm = reactive({
  email: "",
  name: ""
});
const recipientRules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" }
  ]
};

// 编辑接收者对话框
const editRecipientDialogVisible = ref(false);
const editRecipientFormRef = ref<FormInstance>();
const editRecipientLoading = ref(false);
const editingRecipientId = ref<number | null>(null);
const editRecipientForm = reactive({
  email: "",
  name: "",
  is_active: true
});

// 测试邮件对话框
const testEmailDialogVisible = ref(false);
const testEmailLoading = ref(false);
const testEmailForm = reactive({
  email: ""
});

// 初始化
onMounted(() => {
  fetchApplications();
  fetchConfigs();
});

/**
 * 格式化日期
 */
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
};

/**
 * 筛选变化
 */
const handleFilterChange = () => {
  updateParams({
    application: filterForm.application || undefined,
    is_enabled: filterForm.is_enabled ?? undefined
  });
};

/**
 * 刷新
 */
const handleRefresh = () => {
  refresh();
};

/**
 * 分页
 */
const handlePageChange = (page: number) => {
  changePage(page);
};

const handleSizeChange = (size: number) => {
  changePageSize(size);
};

/**
 * 切换启用状态
 */
const handleToggleEnabled = async (row: FeedbackNotificationConfig, enabled: boolean) => {
  switchLoading[row.id] = true;
  const success = await toggleEnabled(row.id, enabled);
  if (!success) {
    // 恢复原状态
    row.is_enabled = !enabled;
  }
  switchLoading[row.id] = false;
};

/**
 * 新增配置
 */
const handleCreate = () => {
  createForm.application = null;
  createForm.is_enabled = true;
  createDialogVisible.value = true;
};

const handleCreateDialogClose = () => {
  createFormRef.value?.resetFields();
};

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return;

  await createFormRef.value.validate(async (valid) => {
    if (!valid) return;

    createLoading.value = true;
    const result = await create({
      application: createForm.application!,
      is_enabled: createForm.is_enabled
    });

    if (result) {
      createDialogVisible.value = false;
      refresh();
    }
    createLoading.value = false;
  });
};

/**
 * 删除配置
 */
const handleDelete = async (row: FeedbackNotificationConfig) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除应用 "${row.application_name}" 的通知配置吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await remove(row.id);
    refresh();
  } catch {
    // 用户取消
  }
};

/**
 * 管理接收者
 */
const handleManageRecipients = (row: FeedbackNotificationConfig) => {
  currentConfig.value = row;
  recipientsDialogVisible.value = true;
  fetchRecipients();
};

const handleRecipientsDialogClose = () => {
  currentConfig.value = null;
  recipientForm.email = "";
  recipientForm.name = "";
  recipientFormRef.value?.resetFields();
  refresh(); // 刷新列表以更新接收者数量
};

/**
 * 添加接收者
 */
const handleAddRecipient = async () => {
  if (!recipientFormRef.value) return;

  await recipientFormRef.value.validate(async (valid) => {
    if (!valid) return;

    addRecipientLoading.value = true;
    const success = await addRecipient({
      email: recipientForm.email,
      name: recipientForm.name || undefined,
      is_active: true
    });

    if (success) {
      recipientForm.email = "";
      recipientForm.name = "";
      recipientFormRef.value?.resetFields();
    }
    addRecipientLoading.value = false;
  });
};

/**
 * 切换接收者状态
 */
const handleToggleRecipientActive = async (row: NotificationRecipient, active: boolean) => {
  recipientSwitchLoading[row.id] = true;
  const success = await toggleActive(row.id, active);
  if (!success) {
    row.is_active = !active;
  }
  recipientSwitchLoading[row.id] = false;
};

/**
 * 编辑接收者
 */
const handleEditRecipient = (row: NotificationRecipient) => {
  editingRecipientId.value = row.id;
  editRecipientForm.email = row.email;
  editRecipientForm.name = row.name || "";
  editRecipientForm.is_active = row.is_active;
  editRecipientDialogVisible.value = true;
};

const handleEditRecipientSubmit = async () => {
  if (!editRecipientFormRef.value || !editingRecipientId.value) return;

  await editRecipientFormRef.value.validate(async (valid) => {
    if (!valid) return;

    editRecipientLoading.value = true;
    const success = await updateRecipient(editingRecipientId.value!, {
      email: editRecipientForm.email,
      name: editRecipientForm.name || undefined,
      is_active: editRecipientForm.is_active
    });

    if (success) {
      editRecipientDialogVisible.value = false;
      fetchRecipients();
    }
    editRecipientLoading.value = false;
  });
};

/**
 * 删除接收者
 */
const handleDeleteRecipient = async (row: NotificationRecipient) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除接收者 "${row.email}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await removeRecipient(row.id);
  } catch {
    // 用户取消
  }
};

/**
 * 测试邮件
 */
const handleTestEmail = (row: NotificationRecipient) => {
  testEmailForm.email = row.email;
  testEmailDialogVisible.value = true;
};

const handleTestEmailSubmit = async () => {
  if (!testEmailForm.email) {
    message("请输入测试邮箱", { type: "warning" });
    return;
  }

  testEmailLoading.value = true;
  const success = await sendTest({ email: testEmailForm.email });
  if (success) {
    testEmailDialogVisible.value = false;
  }
  testEmailLoading.value = false;
};

/**
 * 查看日志
 */
const handleViewLogs = (row: FeedbackNotificationConfig) => {
  // 跳转到邮件日志页面，带上应用筛选参数
  router.push({
    path: "/feedback/email/logs",
    query: { application: row.application }
  });
};
</script>

<style lang="scss" scoped>
.notification-config-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .filter-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding-bottom: 2px;
    }
  }

  .table-card {
    .app-name {
      font-weight: 500;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .add-recipient-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 12px 16px;
    }

    .el-form-item {
      margin-bottom: 0;
    }
  }
}
</style>
