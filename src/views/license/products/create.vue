<script lang="ts" setup>
import { ref, reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Check,
  Close
} from "@element-plus/icons-vue";
import { useLicenseStoreHook } from "@/store/modules/license";
import type { ProductCreateParams } from "@/types/license";
import { hasPerms } from "@/utils/auth";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const licenseStore = useLicenseStoreHook();

// 检查用户权限
const checkPermission = () => {
  return hasPerms("license:create");
};

if (!checkPermission()) {
  ElMessage.error("无权限访问此页面");
  router.push("/license/products");
}

// 表单引用
const formRef = ref();

// 提交状态
const submitLoading = computed(() => licenseStore.loading.productCreate);

// 表单数据
const formData = reactive<ProductCreateParams>({
  name: "",
  code: "",
  version: "",
  description: "",
  is_active: true,
  metadata: {}
});

// 动态元数据字段
const metadataFields = ref<Array<{ key: string; value: string; id: number }>>([]);
let metadataIdCounter = 0;

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: t("license.products.nameRequired"), trigger: "blur" },
    { min: 2, max: 100, message: t("license.products.nameLength"), trigger: "blur" }
  ],
  code: [
    { required: true, message: t("license.products.codeRequired"), trigger: "blur" },
    { min: 2, max: 50, message: t("license.products.codeLength"), trigger: "blur" },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: t("license.products.codeFormat"), trigger: "blur" }
  ],
  version: [
    { required: true, message: t("license.products.versionRequired"), trigger: "blur" },
    { pattern: /^\d+\.\d+\.\d+$/, message: t("license.products.versionFormat"), trigger: "blur" }
  ],
  description: [
    { max: 500, message: t("license.products.descriptionLength"), trigger: "blur" }
  ]
};

// 添加元数据字段
const addMetadataField = () => {
  metadataFields.value.push({
    key: "",
    value: "",
    id: metadataIdCounter++
  });
};

// 删除元数据字段
const removeMetadataField = (id: number) => {
  const index = metadataFields.value.findIndex(field => field.id === id);
  if (index > -1) {
    metadataFields.value.splice(index, 1);
  }
};

// 处理元数据变化
const handleMetadataChange = () => {
  const metadata: Record<string, any> = {};
  metadataFields.value.forEach(field => {
    if (field.key && field.value) {
      metadata[field.key] = field.value;
    }
  });
  formData.metadata = metadata;
};

// 提交表单
const handleSubmit = async () => {
  try {
    const valid = await formRef.value?.validate();
    if (!valid) return;

    // 处理元数据
    handleMetadataChange();

    logger.debug("[ProductCreate] 提交产品数据:", formData);

    await licenseStore.createProduct(formData);
    
    ElMessage.success(t("license.products.createSuccess"));
    router.push("/license/products");
  } catch (error) {
    logger.error("创建产品失败", error);
    ElMessage.error(t("license.products.createError"));
  }
};

// 返回列表
const handleBack = () => {
  router.push("/license/products");
};

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields();
  metadataFields.value = [];
  formData.metadata = {};
};

// 初始化一个元数据字段
addMetadataField();
</script>

<template>
  <div class="product-create">
    <!-- 页面头部 -->
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleBack">
            {{ t("common.back") }}
          </el-button>
          <h2 class="page-title">{{ t("license.products.create") }}</h2>
        </div>
      </div>
    </el-card>

    <!-- 表单内容 -->
    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item :label="t('license.products.name')" prop="name">
              <el-input
                v-model="formData.name"
                :placeholder="t('license.products.namePlaceholder')"
                clearable
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item :label="t('license.products.code')" prop="code">
              <el-input
                v-model="formData.code"
                :placeholder="t('license.products.codePlaceholder')"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item :label="t('license.products.version')" prop="version">
              <el-input
                v-model="formData.version"
                :placeholder="t('license.products.versionPlaceholder')"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="t('license.products.description')" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            :placeholder="t('license.products.descriptionPlaceholder')"
            show-word-limit
            maxlength="500"
          />
        </el-form-item>

        <el-form-item :label="t('license.products.status')">
          <el-switch
            v-model="formData.is_active"
            :active-text="t('common.active')"
            :inactive-text="t('common.inactive')"
          />
        </el-form-item>

        <!-- 元数据配置 -->
        <el-form-item :label="t('license.products.metadata')">
          <div class="metadata-container">
            <div class="metadata-header">
              <span class="metadata-title">{{ t("license.products.metadataConfig") }}</span>
              <el-button type="primary" size="small" @click="addMetadataField">
                {{ t("license.products.addMetadata") }}
              </el-button>
            </div>
            
            <div v-if="metadataFields.length === 0" class="metadata-empty">
              <span>{{ t("license.products.noMetadata") }}</span>
            </div>
            
            <div v-else class="metadata-fields">
              <div
                v-for="field in metadataFields"
                :key="field.id"
                class="metadata-field"
              >
                <el-input
                  v-model="field.key"
                  :placeholder="t('license.products.metadataKey')"
                  style="width: 200px"
                  @input="handleMetadataChange"
                />
                <el-input
                  v-model="field.value"
                  :placeholder="t('license.products.metadataValue')"
                  style="width: 300px"
                  @input="handleMetadataChange"
                />
                <el-button
                  type="danger"
                  :icon="Close"
                  size="small"
                  @click="removeMetadataField(field.id)"
                />
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <div class="form-actions">
            <el-button
              type="primary"
              :loading="submitLoading"
              :icon="Check"
              @click="handleSubmit"
            >
              {{ t("license.products.create") }}
            </el-button>
            <el-button @click="handleReset">
              {{ t("common.reset") }}
            </el-button>
            <el-button @click="handleBack">
              {{ t("common.cancel") }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.product-create {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card,
.form-card {
  background: #ffffff;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.metadata-container {
  width: 100%;
}

.metadata-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.metadata-title {
  font-weight: 500;
  color: #303133;
}

.metadata-empty {
  padding: 20px;
  text-align: center;
  color: #909399;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.metadata-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metadata-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
}
</style>
