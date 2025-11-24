<template>
  <div class="application-container">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-input
            v-model="searchForm.search"
            :placeholder="t('application.search.placeholder')"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            style="width: 300px"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-select
            v-model="searchForm.status"
            :placeholder="t('application.search.statusFilter')"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option :label="t('application.search.allStatus')" value="" />
            <el-option
              v-for="status in statusOptions"
              :key="status"
              :label="t(`application.status.${status}`)"
              :value="status"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            {{ t('application.actions.search') }}
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            {{ t('application.actions.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工具栏 -->
    <el-card shadow="never" class="toolbar-card">
      <el-button
        type="primary"
        :icon="Plus"
        @click="handleCreate"
        v-if="hasPermission('application:create')"
      >
        {{ t('application.actions.create') }}
      </el-button>
      <el-button :icon="Refresh" @click="fetchData">
        {{ t('application.actions.refresh') }}
      </el-button>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table
        v-loading="applicationStore.loading.list"
        :data="applicationStore.applicationList.data"
        stripe
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column :label="t('application.fields.name')" min-width="150">
          <template #default="{ row }">
            <div class="app-name-cell">
              <el-avatar
                v-if="row.logo"
                :src="row.logo"
                :size="32"
                shape="square"
              />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="code"
          :label="t('application.fields.code')"
          min-width="120"
        />
        
        <el-table-column
          prop="current_version"
          :label="t('application.fields.currentVersion')"
          width="120"
        />
        
        <el-table-column :label="t('application.fields.status')" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        
        <el-table-column
          prop="owner"
          :label="t('application.fields.owner')"
          min-width="100"
        />
        
        <el-table-column
          prop="created_at"
          :label="t('application.fields.createdAt')"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column
          :label="t('application.actions.view')"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="View"
              @click="handleView(row.id)"
              v-if="hasPermission('application:view')"
            >
              {{ t('application.actions.view') }}
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="handleEdit(row.id)"
              v-if="hasPermission('application:edit')"
            >
              {{ t('application.actions.edit') }}
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
              v-if="hasPermission('application:delete')"
            >
              {{ t('application.actions.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="applicationStore.applicationList.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="pagination"
      />
    </el-card>

    <!-- 创建应用对话框 -->
    <el-dialog
      v-model="createDialog.visible"
      :title="t('application.actions.create')"
      width="750px"
      :close-on-click-modal="false"
      :close-on-press-escape="!createDialog.loading"
      :show-close="!createDialog.loading"
      @closed="handleCreateDialogClosed"
    >
      <ApplicationForm
        ref="createFormRef"
        :loading="createDialog.loading"
        @submit="handleCreateSubmit"
        @cancel="createDialog.visible = false"
      />
    </el-dialog>

    <!-- 编辑应用对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      :title="t('application.actions.edit')"
      width="750px"
      :close-on-click-modal="false"
      :close-on-press-escape="!editDialog.loading"
      :show-close="!editDialog.loading"
    >
      <ApplicationForm
        :loading="editDialog.loading"
        :application-data="editDialog.applicationData"
        :is-edit="true"
        @submit="handleEditSubmit"
        @cancel="editDialog.visible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessageBox, ElMessage } from "element-plus";
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  View
} from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@/components/ReIcon";
import { StatusTag, ApplicationForm } from "@/components/Application";
import { useApplicationStoreHook } from "@/store/modules/application";
import { useUserStoreHook } from "@/store/modules/user";
import { hasPerms } from "@/utils/auth";
import type { Application, ApplicationStatus, ApplicationCreateUpdateParams } from "@/types/application";
import { formatDate } from "@/utils/dateUtil";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const applicationStore = useApplicationStoreHook();
const userStore = useUserStoreHook();

// 表单引用
const createFormRef = ref();

// 搜索表单
const searchForm = reactive({
  search: "",
  status: "" as ApplicationStatus | ""
});

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 创建应用对话框状态
const createDialog = reactive({
  visible: false,
  loading: false
});

// 编辑应用对话框状态
const editDialog = reactive({
  visible: false,
  loading: false,
  applicationData: null as Application | null
});

// 状态选项
const statusOptions: ApplicationStatus[] = [
  "development",
  "testing",
  "active",
  "inactive",
  "deprecated"
];

// 权限检查
const hasPermission = (permission: string): boolean => {
  return userStore.is_super_admin || hasPerms(permission);
};

// 获取数据
const fetchData = async () => {
  await applicationStore.fetchApplicationList({
    search: searchForm.search || undefined,
    status: searchForm.status || undefined,
    page: currentPage.value,
    page_size: pageSize.value
  });
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

// 重置
const handleReset = () => {
  searchForm.search = "";
  searchForm.status = "";
  currentPage.value = 1;
  fetchData();
};

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchData();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchData();
};

// 创建
const handleCreate = () => {
  createDialog.visible = true;
  // 延迟一帧，确保对话框已经打开并且ApplicationForm组件已经挂载
  setTimeout(() => {
    if (createFormRef.value) {
      createFormRef.value.resetForm();
    }
  }, 0);
};

// 处理创建对话框关闭
const handleCreateDialogClosed = () => {
  // 确保对话框关闭后表单被重置
  if (createFormRef.value) {
    createFormRef.value.resetForm();
  }
};

// 处理创建提交
const handleCreateSubmit = async (data: ApplicationCreateUpdateParams) => {
  createDialog.loading = true;
  try {
    await applicationStore.createApplication(data);
    ElMessage.success(t("application.createSuccess"));
    createDialog.visible = false;
    fetchData();
  } catch (error: any) {
    logger.error("创建应用失败", error);
    if (error && error.message) {
      ElMessage.error(error.message || t("application.createFailed"));
    } else {
      ElMessage.error(t("application.createFailed"));
    }
  } finally {
    createDialog.loading = false;
  }
};

// 查看详情
const handleView = (id: number) => {
  router.push(`/application/detail/${id}`);
};

// 编辑
const handleEdit = async (id: number) => {
  editDialog.loading = true;
  
  // 先从列表数据中查找应用数据，确保立即显示
  const app = applicationStore.applicationList.data.find(a => a.id === id);
  if (app) {
    editDialog.applicationData = { ...app };
  }
  
  editDialog.visible = true;

  try {
    // 加载应用详情
    const response = await applicationStore.fetchApplicationDetail(id);
    if (response.success) {
      editDialog.applicationData = applicationStore.currentApplication;
    }
  } catch (error: any) {
    logger.error("加载应用详情失败", error);
    if (error && error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error(t("application.loadDetailFailed"));
    }
  } finally {
    editDialog.loading = false;
  }
};

// 处理编辑提交
const handleEditSubmit = async (data: ApplicationCreateUpdateParams) => {
  if (!editDialog.applicationData?.id) return;

  editDialog.loading = true;
  try {
    await applicationStore.updateApplication(editDialog.applicationData.id, data);
    ElMessage.success(t("application.updateSuccess"));
    editDialog.visible = false;
    fetchData();
  } catch (error: any) {
    logger.error("更新应用失败", error);
    if (error && error.message) {
      ElMessage.error(error.message || t("application.updateFailed"));
    } else {
      ElMessage.error(t("application.updateFailed"));
    }
  } finally {
    editDialog.loading = false;
  }
};

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      t("application.deleteConfirm", { name: row.name }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );

    await applicationStore.deleteApplication(row.id);
    ElMessage.success(t("application.deleteSuccess"));
    fetchData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(t("application.deleteFailed"));
    }
  }
};

// 初始化
onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.application-container {
  padding: 16px;

  .search-card,
  .toolbar-card {
    margin-bottom: 16px;
  }

  .app-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
