<template>
  <div class="software-versions-container">
    <div class="page-header">
      <h2>{{ t("feedback.software.versions") }}</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        {{ t("feedback.software.createVersion") }}
      </el-button>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item :label="t('feedback.form.software')">
          <el-select
            v-model="filterSoftwareId"
            :placeholder="t('feedback.software.selectSoftware')"
            clearable
            filterable
            @change="handleFilterChange"
          >
            <el-option
              v-for="software in softwareList"
              :key="software.id"
              :label="software.name"
              :value="software.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.software.stable')">
          <el-select
            v-model="filterStable"
            :placeholder="t('feedback.filters.all')"
            clearable
            @change="handleFilterChange"
          >
            <el-option :label="t('common.yes')" :value="true" />
            <el-option :label="t('common.no')" :value="false" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 版本列表 -->
    <el-card v-loading="loading" shadow="never">
      <el-table :data="versions" stripe style="width: 100%">
        <el-table-column
          prop="software_name"
          :label="t('feedback.form.software')"
          min-width="150"
        />
        <el-table-column
          prop="version"
          :label="t('feedback.software.versionNumber')"
          width="120"
        />
        <el-table-column
          prop="version_code"
          :label="t('feedback.software.versionCode')"
          width="100"
        />
        <el-table-column
          prop="release_date"
          :label="t('feedback.software.releaseDate')"
          width="120"
        />
        <el-table-column
          prop="release_notes"
          :label="t('feedback.software.releaseNotes')"
          min-width="250"
        />
        <el-table-column
          prop="is_stable"
          :label="t('feedback.software.stable')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.is_stable ? 'success' : 'warning'" size="small">
              {{ row.is_stable ? t("common.yes") : t("common.no") }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="is_active"
          :label="t('feedback.software.status')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? t("common.active") : t("common.inactive") }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('buttons.actions')"
          width="180"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              {{ t("buttons.edit") }}
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              {{ t("buttons.delete") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="
        dialogMode === 'create'
          ? t('feedback.software.createVersion')
          : t('feedback.software.editVersion')
      "
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogFormData"
        :rules="dialogRules"
        label-width="100px"
      >
        <el-form-item
          v-if="dialogMode === 'create'"
          :label="t('feedback.form.software')"
          prop="software_id"
        >
          <el-select
            v-model="dialogFormData.software_id"
            :placeholder="t('feedback.software.selectSoftware')"
            filterable
          >
            <el-option
              v-for="software in softwareList"
              :key="software.id"
              :label="software.name"
              :value="software.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          :label="t('feedback.software.versionNumber')"
          prop="version"
        >
          <el-input
            v-model="dialogFormData.version"
            :placeholder="t('feedback.software.versionPlaceholder')"
            @input="handleVersionInput"
          />
          <template #extra>
            <span class="form-tip"
              >格式：v主版本.次版本.修订版本（如：v2.1.0）</span
            >
          </template>
        </el-form-item>

        <el-form-item
          :label="t('feedback.software.versionCode')"
          prop="version_code"
        >
          <el-input-number
            v-model="dialogFormData.version_code"
            :min="1"
            :step="1"
          />
          <template #extra>
            <span class="form-tip">自动计算或手动输入（必须递增）</span>
          </template>
        </el-form-item>

        <el-form-item :label="t('feedback.software.releaseDate')">
          <el-date-picker
            v-model="dialogFormData.release_date"
            type="date"
            :placeholder="t('feedback.software.selectDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.releaseNotes')">
          <el-input
            v-model="dialogFormData.release_notes"
            type="textarea"
            :rows="6"
            :placeholder="t('feedback.software.releaseNotesPlaceholder')"
          />
          <template #extra>
            <span class="form-tip">支持Markdown格式</span>
          </template>
        </el-form-item>

        <el-form-item :label="t('feedback.software.downloadUrl')">
          <el-input
            v-model="dialogFormData.download_url"
            :placeholder="t('feedback.software.downloadUrlPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.stable')">
          <el-switch v-model="dialogFormData.is_stable" />
          <template #extra>
            <span class="form-tip">是否推荐用户使用</span>
          </template>
        </el-form-item>

        <el-form-item :label="t('feedback.software.status')">
          <el-switch v-model="dialogFormData.is_active" />
          <template #extra>
            <span class="form-tip">停用后用户将看不到此版本</span>
          </template>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ t("buttons.cancel") }}
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleDialogSubmit"
        >
          {{ t("buttons.confirm") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  getSoftwareVersionList,
  getSoftwareList,
  addSoftwareVersion,
  updateSoftwareVersion,
  deleteSoftwareVersion
} from "@/api/modules/feedback";
import { ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type {
  SoftwareVersion,
  Software,
  SoftwareVersionCreateParams
} from "@/types/feedback";
import { message } from "@/utils/message";
import logger from "@/utils/logger";

const { t } = useI18n();

// 数据状态
const versions = ref<SoftwareVersion[]>([]);
const softwareList = ref<Software[]>([]);
const loading = ref(false);

// 筛选器
const filterSoftwareId = ref<number | null>(null);
const filterStable = ref<boolean | null>(null);

// 对话框状态
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingId = ref<number | null>(null);
const submitting = ref(false);
const dialogFormRef = ref<FormInstance>();

// 对话框表单数据
const dialogFormData = reactive<
  SoftwareVersionCreateParams & { software_id?: number }
>({
  software_id: undefined,
  version: "",
  version_code: 0,
  release_date: "",
  release_notes: "",
  is_stable: true,
  is_active: true,
  download_url: ""
});

// 对话框表单验证规则（仅基本检查）
const dialogRules = reactive<FormRules>({});

/**
 * 获取版本列表
 */
const fetchVersions = async () => {
  loading.value = true;

  try {
    const params: any = {
      ordering: "-version_code"
    };

    if (filterSoftwareId.value) {
      params.software = filterSoftwareId.value;
    }
    if (filterStable.value !== null) {
      params.is_stable = filterStable.value;
    }

    const response = await getSoftwareVersionList(params);

    logger.debug("版本列表API响应", response);

    if (response.success && response.data) {
      // 处理多种数据格式
      if (Array.isArray(response.data)) {
        versions.value = response.data;
      } else if (
        response.data.results &&
        Array.isArray(response.data.results)
      ) {
        versions.value = response.data.results;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        versions.value = response.data.data;
      } else {
        logger.warn("版本数据格式异常", response.data);
        versions.value = [];
      }
    }
  } catch (error) {
    console.error("获取版本列表失败:", error);
    message(t("common.loadFailed"), { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 获取软件列表（用于筛选）
 */
const fetchSoftwareList = async () => {
  try {
    const response = await getSoftwareList({ is_active: true });

    if (response.success && response.data) {
      // 处理多种数据格式
      if (Array.isArray(response.data)) {
        softwareList.value = response.data;
      } else if (
        response.data.results &&
        Array.isArray(response.data.results)
      ) {
        softwareList.value = response.data.results;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        softwareList.value = response.data.data;
      } else {
        softwareList.value = [];
      }
    }
  } catch (error) {
    console.error("获取软件列表失败:", error);
  }
};

/**
 * 处理筛选器变化
 */
const handleFilterChange = () => {
  fetchVersions();
};

/**
 * 版本号输入处理 - 自动计算version_code
 */
const handleVersionInput = (value: string) => {
  if (value && value.match(/^v?\d+\.\d+\.\d+$/)) {
    const parts = value.replace(/^v/, "").split(".").map(Number);
    if (parts.length === 3) {
      dialogFormData.version_code =
        (parts[0] || 0) * 100 + (parts[1] || 0) * 10 + (parts[2] || 0);
    }
  }
};

/**
 * 创建版本
 */
const handleCreate = () => {
  dialogMode.value = "create";
  editingId.value = null;
  resetDialogForm();
  // 如果有筛选的软件，自动填充
  if (filterSoftwareId.value) {
    dialogFormData.software_id = filterSoftwareId.value;
  }
  dialogVisible.value = true;
};

/**
 * 编辑版本
 */
const handleEdit = (version: SoftwareVersion) => {
  dialogMode.value = "edit";
  editingId.value = version.id;

  // 填充表单数据
  dialogFormData.version = version.version;
  dialogFormData.version_code = version.version_code;
  dialogFormData.release_date = version.release_date || "";
  dialogFormData.release_notes = version.release_notes || "";
  dialogFormData.is_stable = version.is_stable;
  dialogFormData.is_active = version.is_active;
  dialogFormData.download_url = version.download_url || "";

  dialogVisible.value = true;
};

/**
 * 删除版本
 */
const handleDelete = async (version: SoftwareVersion) => {
  try {
    await ElMessageBox.confirm(
      t("feedback.software.deleteVersionConfirm", { version: version.version }),
      t("common.warning"),
      {
        confirmButtonText: t("buttons.confirm"),
        cancelButtonText: t("buttons.cancel"),
        type: "warning"
      }
    );

    await deleteSoftwareVersion(version.id);
    message(t("common.deleteSuccess"), { type: "success" });
    fetchVersions();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
    }
  }
};

/**
 * 对话框提交
 */
const handleDialogSubmit = async () => {
  submitting.value = true;

  try {
    let response;
    if (dialogMode.value === "create") {
      if (!dialogFormData.software_id) {
        message("请选择软件产品", { type: "warning" });
        submitting.value = false;
        return;
      }
      if (!dialogFormData.version) {
        message("请输入版本号", { type: "warning" });
        submitting.value = false;
        return;
      }
      if (!dialogFormData.version_code) {
        message("请输入版本代码", { type: "warning" });
        submitting.value = false;
        return;
      }
      // 创建时使用对话框中选择的软件ID
      const { software_id, ...versionData } = dialogFormData;
      response = await addSoftwareVersion(software_id, versionData);
    } else if (editingId.value) {
      const { software_id, ...versionData } = dialogFormData;
      response = await updateSoftwareVersion(editingId.value, versionData);
    }

    if (response?.success) {
      message(
        dialogMode.value === "create"
          ? t("common.createSuccess")
          : t("common.updateSuccess"),
        { type: "success" }
      );
      dialogVisible.value = false;
      fetchVersions();
      resetDialogForm();
    }
  } catch (error) {
    console.error(
      dialogMode.value === "create" ? "创建失败:" : "更新失败:",
      error
    );
  } finally {
    submitting.value = false;
  }
};

/**
 * 对话框关闭
 */
const handleDialogClose = () => {
  resetDialogForm();
  dialogFormRef.value?.clearValidate();
};

/**
 * 重置对话框表单
 */
const resetDialogForm = () => {
  dialogFormData.software_id = undefined;
  dialogFormData.version = "";
  dialogFormData.version_code = 0;
  dialogFormData.release_date = "";
  dialogFormData.release_notes = "";
  dialogFormData.is_stable = true;
  dialogFormData.is_active = true;
  dialogFormData.download_url = "";
};

// 页面加载
onMounted(() => {
  fetchSoftwareList();
  fetchVersions();
});
</script>

<style lang="scss" scoped>
.software-versions-container {
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
    margin-bottom: 20px;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
