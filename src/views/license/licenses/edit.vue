<template>
  <div class="page-container">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
          {{ $t("license.dashboard") }}
        </el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/license/licenses' }">
          {{ $t("license.licenses.title") }}
        </el-breadcrumb-item>
        <el-breadcrumb-item>{{
          $t("license.licenses.edit")
        }}</el-breadcrumb-item>
      </el-breadcrumb>
      <h2>{{ $t("license.licenses.editTitle") || "编辑许可证" }}</h2>
      <p class="page-description">{{ $t("license.licenses.editDescription") || "请填写需要更新的许可证信息" }}</p>
      
      <!-- 自动保存提示 -->
      <div id="auto-save-indicator" class="auto-save-indicator" style="display: none;">
        {{ $t("common.draftSaved") || "草稿已自动保存" }}
      </div>
    </div>

    <!-- 可滚动的表单内容区域 -->
    <div class="page-content" v-loading="loading">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="140px"
          label-position="left"
        @keydown="handleKeyDown"
      >
        <!-- 基本信息区域 -->
        <div class="form-section">
          <h3>{{ $t("license.licenses.basicInfo") || "基本信息" }}</h3>
          
          <div class="form-row">
            <div class="form-group">
              <el-form-item :label="$t('license.licenses.licenseKey')">
                <el-input
                  v-model="form.license_key"
                  :placeholder="$t('license.licenses.licenseKeyPlaceholder')"
                  readonly
                  class="readonly-field"
                >
                  <template #append>
                    <el-button 
                      type="text" 
                      @click="copyLicenseKey"
                      :title="$t('common.copy')"
                    >
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
            </div>
            
            <div class="form-group">
              <el-form-item :label="$t('license.licenses.tenant')">
                <el-input
                  :value="tenantInfo?.name || ''"
                  :placeholder="$t('license.licenses.tenantPlaceholder')"
                  readonly
                  class="readonly-field"
                >
                  <template #prefix>
                    <el-icon><OfficeBuilding /></el-icon>
                  </template>
                </el-input>
                <div class="field-help">
                  {{ $t("license.licenses.tenantReadonly") || "租户信息不可修改" }}
                </div>
              </el-form-item>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <el-form-item
                :label="$t('license.licenses.customerName')"
                prop="customer_name"
              >
                <el-input
                  v-model="form.customer_name"
                  :placeholder="$t('license.licenses.customerNamePlaceholder') || '请输入客户姓名'"
                  clearable
                  @input="handleFieldChange('customer_name', $event)"
                  @blur="validateField('customer_name')"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
                <div class="field-error" id="customer_name_error"></div>
              </el-form-item>
            </div>
            
            <div class="form-group">
              <el-form-item
                :label="$t('license.licenses.customerEmail')"
                prop="customer_email"
              >
                <el-input
                  v-model="form.customer_email"
                  type="email"
                  :placeholder="$t('license.licenses.customerEmailPlaceholder') || 'customer@example.com'"
                  clearable
                  @input="handleFieldChange('customer_email', $event)"
                  @blur="validateField('customer_email')"
                >
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
                <div class="field-error" id="customer_email_error"></div>
              </el-form-item>
            </div>
          </div>
        </div>
        
        <!-- 许可配置区域 -->
        <div class="form-section">
          <h3>{{ $t("license.licenses.licenseConfig") || "许可配置" }}</h3>
          
          <div class="form-row">
            <div class="form-group">
              <el-form-item :label="$t('license.licenses.maxActivations')" prop="max_activations">
                <el-input-number
                  v-model="form.max_activations"
                  :min="form.current_activations || 1"
                  :max="1000"
                  :placeholder="$t('license.licenses.maxActivationsPlaceholder') || '5'"
                  style="width: 100%"
                  @change="handleFieldChange('max_activations', $event)"
                />
                <div class="field-help">
                  {{ $t("license.licenses.currentActivationsInfo") || "当前已激活" }}: 
                  <span class="current-value">{{ form.current_activations || 0 }}</span>
                </div>
                <div class="field-error" id="max_activations_error"></div>
              </el-form-item>
            </div>
            
            <div class="form-group">
              <el-form-item :label="$t('license.licenses.expiresAt')" prop="expires_at">
                <el-date-picker
                  v-model="form.expires_at"
                  type="datetime"
                  :placeholder="$t('license.licenses.selectExpireTime')"
                  style="width: 100%"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DDTHH:mm:ssZ"
                  :disabled-date="disabledDate"
                  @change="handleFieldChange('expires_at', $event)"
                />
                <div class="field-help">
                  {{ $t("license.licenses.remainingDaysInfo") || "当前剩余" }}:
                  <span class="remaining-days" :class="{ 'expiring-soon': isExpiringSoon, 'expired': isExpired }">
                    {{ remainingDaysText }}
                  </span>
                </div>
                <div class="field-error" id="expires_at_error"></div>
              </el-form-item>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <el-form-item :label="$t('license.licenses.status')" prop="status">
                <el-select 
                  v-model="form.status" 
                  style="width: 100%"
                  @change="handleFieldChange('status', $event)"
                >
                  <el-option
                    value="generated"
                    :label="$t('license.licenses.statusGenerated') || '已生成'"
                  >
                    <span style="float: left">{{ $t('license.licenses.statusGenerated') || '已生成' }}</span>
                    <el-tag size="small" type="info" style="float: right">NEW</el-tag>
                  </el-option>
                  <el-option
                    value="activated"
                    :label="$t('license.licenses.statusActivated') || '已激活'"
                  >
                    <span style="float: left">{{ $t('license.licenses.statusActivated') || '已激活' }}</span>
                    <el-tag size="small" type="success" style="float: right">ACTIVE</el-tag>
                  </el-option>
                  <el-option
                    value="suspended"
                    :label="$t('license.licenses.statusSuspended') || '已挂起'"
                  >
                    <span style="float: left">{{ $t('license.licenses.statusSuspended') || '已挂起' }}</span>
                    <el-tag size="small" type="warning" style="float: right">PAUSED</el-tag>
                  </el-option>
                  <el-option
                    value="revoked"
                    :label="$t('license.licenses.statusRevoked') || '已撤销'"
                  >
                    <span style="float: left">{{ $t('license.licenses.statusRevoked') || '已撤销' }}</span>
                    <el-tag size="small" type="danger" style="float: right">REVOKED</el-tag>
                  </el-option>
                  <el-option
                    value="expired"
                    :label="$t('license.licenses.statusExpired') || '已过期'"
                  >
                    <span style="float: left">{{ $t('license.licenses.statusExpired') || '已过期' }}</span>
                    <el-tag size="small" type="info" style="float: right">EXPIRED</el-tag>
                  </el-option>
                </el-select>
                <div class="field-error" id="status_error"></div>
              </el-form-item>
            </div>
          </div>
        </div>
        
        <!-- 产品方案区域 - 只读信息 -->
        <div class="form-section">
          <h3>{{ $t("license.licenses.productPlan") || "产品方案" }}</h3>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.product')">
                <el-input
                  :value="productInfo?.name || 'Leaks_compress'"
                  :placeholder="$t('license.licenses.product')"
                  readonly
                  class="readonly-field"
                >
                  <template #prefix>
                    <el-icon><Box /></el-icon>
                  </template>
                </el-input>
                <div class="field-help">
                  {{ $t("license.licenses.productReadonly") || "产品信息不可修改" }}
                </div>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.plan')">
                <el-input
                  :value="planInfo?.name || 'Trial'"
                  :placeholder="$t('license.licenses.plan')"
                  readonly
                  class="readonly-field"
                >
                  <template #prefix>
                    <el-icon><Document /></el-icon>
                  </template>
                </el-input>
                <div class="field-help">
                  {{ $t("license.licenses.planReadonly") || "方案信息不可修改" }}
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        
        <!-- 附加信息区域 -->
        <div class="form-section">
          <h3>{{ $t("license.licenses.additionalInfo") || "附加信息" }}</h3>
          
          <div class="form-group">
            <el-form-item :label="$t('license.licenses.notes')" prop="notes">
              <el-input
                v-model="form.notes"
                type="textarea"
                :rows="3"
                :placeholder="$t('license.licenses.notesPlaceholder') || '请输入相关备注信息...'"
                :maxlength="500"
                show-word-limit
                @input="handleFieldChange('notes', $event)"
              />
              <div class="field-error" id="notes_error"></div>
            </el-form-item>
          </div>
          
          <!-- 元数据编辑器 -->
          <div class="form-group">
            <el-form-item :label="$t('license.licenses.metadata') || '元数据'">
              <div class="metadata-container" id="metadata-container">
                <div 
                  v-if="metadataItems.length === 0" 
                  class="empty-metadata"
                >
                  {{ $t("license.licenses.noMetadata") || "暂无元数据" }}
                </div>
                <div 
                  v-for="(item, index) in metadataItems" 
                  :key="index" 
                  class="metadata-item"
                >
                  <el-input
                    v-model="item.key"
                    :placeholder="$t('common.key') || '键'"
                    class="metadata-key"
                    @input="handleMetadataChange"
                  />
                  <el-input
                    v-model="item.value"
                    :placeholder="$t('common.value') || '值'"
                    class="metadata-value"
                    @input="handleMetadataChange"
                  />
                  <el-button
                    type="text"
                    class="remove-metadata"
                    @click="removeMetadataItem(index)"
                    :title="$t('common.remove')"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
              <el-button
                type="text"
                class="add-metadata-btn"
                @click="addMetadataItem"
              >
                <el-icon><Plus /></el-icon>
                {{ $t("license.licenses.addMetadata") || "添加元数据" }}
              </el-button>
            </el-form-item>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
          >
            {{ $t("common.save") }}
          </el-button>
          <el-button @click="handleCancel">
            {{ $t("common.cancel") }}
          </el-button>
        </el-form-item>
        
        </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from "element-plus";
import { useI18n } from "vue-i18n";
import {
  DocumentCopy,
  User,
  Message,
  Plus,
  Close,
  Check,
  Loading,
  OfficeBuilding,
  Box,
  Document
} from "@element-plus/icons-vue";
import {
  getProductList,
  getPlanList,
  getLicenseDetail,
  updateLicense
} from "@/api/modules/license";
// 移除租户管理API导入，编辑许可证时不应修改租户
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

// 表单状态
const isDirty = ref(false);
const isFormValid = ref(false);
const originalData = ref<any>(null);
const tenantLocked = ref(false);
const productLocked = ref(false);

// 自动保存和草稿
const autoSaveTimer = ref<NodeJS.Timeout | null>(null);
const draftKey = computed(() => `license_draft_${route.params.id}`);

// 高级功能状态
const validationErrors = reactive<Record<string, string>>({});
const performanceMonitor = ref({
  startTime: 0,
  operations: [] as any[]
});

interface LicenseForm {
  id?: number;
  license_key: string;
  product: number | null;
  plan: number | null;
  tenant: number | null;
  customer_name: string;
  customer_email: string;
  max_activations: number | null;
  current_activations?: number;
  expires_at: string | null;
  status: "generated" | "activated" | "suspended" | "revoked" | "expired";
  notes: string;
  metadata?: Record<string, any>;
}

interface Product {
  id: number;
  name: string;
  version: string;
}

interface Plan {
  id: number;
  name: string;
  product: number;
  price: string;
  product_name: string;
}

interface Tenant {
  id: number;
  name: string;
}

interface MetadataItem {
  key: string;
  value: string;
}

const form = reactive<LicenseForm>({
  license_key: "",
  product: null,
  plan: null,
  tenant: null,
  customer_name: "",
  customer_email: "",
  max_activations: null,
  current_activations: 0,
  expires_at: null,
  status: "generated",
  notes: "",
  metadata: {}
});

// 只读信息数据
const tenantInfo = ref<{ id: number; name: string } | null>(null);
const productInfo = ref<{ id: number; name: string } | null>(null);
const planInfo = ref<{ id: number; name: string } | null>(null);
// 移除可编辑的产品方案状态，改为只读显示

// 元数据编辑器
const metadataItems = ref<MetadataItem[]>([]);

const rules = reactive<FormRules<LicenseForm>>({
  customer_name: [
    {
      required: true,
      message: t("license.licenses.customerNameRequired") || "请输入客户姓名",
      trigger: "blur"
    }
  ],
  customer_email: [
    {
      required: true,
      message: t("license.licenses.customerEmailRequired") || "请输入客户邮箱",
      trigger: "blur"
    },
    {
      type: "email",
      message: t("license.licenses.customerEmailInvalid") || "请输入有效的邮箱地址",
      trigger: "blur"
    }
  ],
  status: [
    {
      required: true,
      message: t("license.licenses.statusRequired") || "请选择许可证状态",
      trigger: "change"
    }
  ]
});

// 计算属性
const remainingDaysText = computed(() => {
  if (!form.expires_at) return t("license.licenses.permanent") || "永久有效";
  
  const now = new Date();
  const expiry = new Date(form.expires_at);
  const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return t("license.licenses.expired") || "已过期";
  return `${diff} ${t("common.days") || "天"}`;
});

const isExpiringSoon = computed(() => {
  if (!form.expires_at) return false;
  const now = new Date();
  const expiry = new Date(form.expires_at);
  const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff <= 30 && diff > 0;
});

const isExpired = computed(() => {
  if (!form.expires_at) return false;
  const now = new Date();
  const expiry = new Date(form.expires_at);
  return expiry <= now;
});

// 方法
const markDirty = () => {
  isDirty.value = true;
  startAutoSave();
};

const handleFieldChange = (field: string, value: any) => {
  markDirty();
  
  // 实时验证
  nextTick(() => {
    validateField(field);
  });
};

const validateField = (fieldName: string) => {
  // 自定义验证逻辑
  switch (fieldName) {
    case 'customer_email':
      validateEmailFormat();
      break;
    case 'max_activations':
      validateMaxActivations();
      break;
    case 'expires_at':
      validateExpiryDate();
      break;
  }
  
  updateFormValidity();
};

const validateEmailFormat = () => {
  const email = form.customer_email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    showFieldError('customer_email', '请输入有效的邮箱地址');
    return false;
  } else {
    hideFieldError('customer_email');
    return true;
  }
};

const validateMaxActivations = () => {
  const value = form.max_activations;
  const currentActivations = form.current_activations || 0;
  
  if (value && value < currentActivations) {
    showFieldError('max_activations', `最大激活数不能小于当前激活数 (${currentActivations})`);
    return false;
  } else {
    hideFieldError('max_activations');
    return true;
  }
};

const validateExpiryDate = () => {
  if (!form.expires_at) return true;
  
  const selectedDate = new Date(form.expires_at);
  const now = new Date();
  
  if (selectedDate <= now) {
    showFieldError('expires_at', '过期时间必须晚于当前时间');
    return false;
  } else {
    hideFieldError('expires_at');
    return true;
  }
};

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7; // 不能选择今天之前的日期
};

const showFieldError = (fieldName: string, message: string) => {
  validationErrors[fieldName] = message;
  const errorElement = document.getElementById(`${fieldName}_error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }
};

const hideFieldError = (fieldName: string) => {
  delete validationErrors[fieldName];
  const errorElement = document.getElementById(`${fieldName}_error`);
  if (errorElement) {
    errorElement.classList.remove('show');
  }
};

const updateFormValidity = () => {
  // 检查是否有验证错误
  const hasErrors = Object.keys(validationErrors).length > 0;
  
  // 检查必填字段
  const requiredFields = ['customer_name', 'customer_email'];
  const hasRequiredFields = requiredFields.every(field => {
    const value = (form as any)[field];
    return value && value.toString().trim() !== '';
  });
  
  isFormValid.value = !hasErrors && hasRequiredFields;
};

// 数据加载
// 移除产品和方案的独立加载函数
// 现在产品和方案信息作为许可证详情的一部分只读显示

// 租户信息从许可证详情中获取，不需要单独加载租户列表

// 测试API连接状态
const testApiConnection = async () => {
  try {
    logger.debug("[LicenseEdit] 测试API连接");
    // 尝试调用一个简单的API来测试连接
    const testResponse = await fetch('/api/v1/health/', { method: 'GET' });
    logger.debug("[LicenseEdit] API健康检查", { 
      status: testResponse.status,
      ok: testResponse.ok 
    });
  } catch (error) {
    logger.error("[LicenseEdit] API连接测试失败", error);
  }
};

const loadLicenseData = async () => {
  const licenseId = route.params.id;
  if (!licenseId) {
    ElMessage.error(t("license.licenses.invalidId"));
    router.push("/license/licenses");
    return;
  }

  loading.value = true;
  try {
    logger.debug("[LicenseEdit] 开始加载许可证详情", { 
      licenseId, 
      parsedId: parseInt(licenseId as string),
      currentUrl: window.location.href 
    });
    
    // 先测试API连接
    logger.debug("[LicenseEdit] 调用 getLicenseDetail API", {
      apiEndpoint: `/licenses/admin/licenses/${parseInt(licenseId as string)}/`
    });
    
    const response = await getLicenseDetail(parseInt(licenseId as string));
    
    logger.debug("[LicenseEdit] API响应", { 
      success: response?.success,
      hasData: !!response?.data,
      responseKeys: response ? Object.keys(response) : null,
      fullResponse: response
    });
    
    if (response.success && response.data) {
      const licenseData = response.data;
      originalData.value = licenseData;
      
      // 填充表单数据
      Object.assign(form, {
        id: licenseData.id,
        license_key: licenseData.license_key,
        product: licenseData.product,
        plan: licenseData.plan,
        tenant: licenseData.tenant,
        customer_name: licenseData.customer_name,
        customer_email: licenseData.customer_email,
        max_activations: licenseData.max_activations,
        current_activations: licenseData.current_activations,
        expires_at: licenseData.expires_at,
        status: licenseData.status,
        notes: licenseData.notes || "",
        metadata: licenseData.metadata || {}
      });
      
      // 设置租户信息（只读）
      tenantInfo.value = {
        id: licenseData.tenant,
        name: licenseData.tenant_name || `租户 ${licenseData.tenant}`
      };
      
      // 设置产品信息（只读）
      productInfo.value = {
        id: licenseData.product,
        name: licenseData.product_name || 'Leaks_compress'
      };
      
      // 设置方案信息（只读）
      planInfo.value = {
        id: licenseData.plan,
        name: licenseData.plan_name || 'Trial'
      };
      
      // 填充元数据
      populateMetadata(licenseData.metadata || {});
      
      logger.debug("[LicenseEdit] 许可证数据加载成功", form);

      // 移除级联选择状态设置，因为产品方案现在是只读的
      
      // 重置脏数据标记
      isDirty.value = false;
      updateFormValidity();
    } else {
      throw new Error(response.message || "获取许可证详情失败");
    }
  } catch (error: any) {
    const errorMessage = error.message || error.toString() || "未知错误";
    const errorCode = error.code || error.status;
    
    logger.error("[LicenseEdit] 加载许可证详情失败", {
      error: errorMessage,
      code: errorCode,
      stack: error.stack,
      licenseId: parseInt(licenseId as string),
      url: window.location.href
    });
    
    // 根据错误类型提供不同的提示
    if (errorCode === 404) {
      ElMessage.error("许可证不存在，请检查ID是否正确");
    } else if (errorCode === 403) {
      ElMessage.error("没有权限访问此许可证");
    } else if (errorCode === 401) {
      ElMessage.error("未授权，请重新登录");
    } else if (error.name === 'NetworkError' || errorMessage.includes('fetch')) {
      ElMessage.error("网络连接失败，请检查网络或稍后重试");
    } else {
      ElMessage.error(`加载许可证失败：${errorMessage}`);
    }
    
    // 只有在特定错误时才跳转，避免网络问题时频繁跳转
    if (errorCode === 404) {
      setTimeout(() => router.push("/license/licenses"), 2000);
    }
  } finally {
    loading.value = false;
  }
};

// 元数据管理
const populateMetadata = (metadata: Record<string, any>) => {
  metadataItems.value = Object.entries(metadata).map(([key, value]) => ({
    key,
    value: String(value)
  }));
};

const addMetadataItem = () => {
  metadataItems.value.push({ key: '', value: '' });
  markDirty();
};

const removeMetadataItem = (index: number) => {
  metadataItems.value.splice(index, 1);
  markDirty();
};

const handleMetadataChange = () => {
  markDirty();
};

// 级联选择处理
// 租户信息不允许修改，移除相关处理函数

// 移除产品和方案的处理函数，因为现在它们是只读的
// 产品和方案信息将在loadLicenseData中作为只读数据获取

// 自动保存功能
const startAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value);
  }
  
  autoSaveTimer.value = setInterval(() => {
    if (isDirty.value) {
      saveDraft();
    }
  }, 30000); // 30秒自动保存
};

const saveDraft = () => {
  try {
    const draftData = {
      data: { ...form, metadataItems: metadataItems.value },
      timestamp: Date.now()
    };
    
    localStorage.setItem(draftKey.value, JSON.stringify(draftData));
    showDraftSaved();
  } catch (error) {
    logger.error('保存草稿失败:', error);
  }
};

const loadDraft = () => {
  try {
    const draftData = localStorage.getItem(draftKey.value);
    if (draftData) {
      const { data, timestamp } = JSON.parse(draftData);
      
      // 检查草稿时效（24小时）
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        ElMessageBox.confirm(
          '发现未保存的草稿数据，是否要恢复？',
          '草稿恢复',
          {
            confirmButtonText: '恢复',
            cancelButtonText: '忽略',
            type: 'info'
          }
        ).then(() => {
          Object.assign(form, data);
          if (data.metadataItems) {
            metadataItems.value = data.metadataItems;
          }
          markDirty();
        }).catch(() => {
          clearDraft();
        });
      } else {
        clearDraft();
      }
    }
  } catch (error) {
    logger.error('加载草稿失败:', error);
  }
};

const clearDraft = () => {
  localStorage.removeItem(draftKey.value);
};

const showDraftSaved = () => {
  const indicator = document.getElementById('auto-save-indicator');
  if (indicator) {
    indicator.style.display = 'block';
    
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 2000);
  }
};

// 键盘导航
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl+S 保存
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    if (isDirty.value && !loading.value && isFormValid.value) {
      handleSubmit();
    }
  }
  
  // Escape 取消
  if (event.key === 'Escape') {
    handleCancel();
  }
};

// 工具函数
const copyLicenseKey = async () => {
  try {
    await navigator.clipboard.writeText(form.license_key);
    ElMessage.success(t("license.licenses.licenseKeyCopied") || "许可证密钥已复制");
  } catch (error) {
    ElMessage.error(t("common.copyFailed") || "复制失败");
  }
};

// 表单提交
const handleSubmit = async () => {
  if (loading.value || submitting.value) return;

  try {
    // 表单验证
    await formRef.value?.validate();

    if (!isFormValid.value) {
      ElMessage.error('请检查表单输入');
      return;
    }

    submitting.value = true;
    performanceMonitor.value.startTime = performance.now();

    // 准备提交数据 - 包含所有从API获取的字段
    const submitData: any = {
      // 必填字段
      tenant: form.tenant, // 后端要求必填，虽然不允许修改但需要包含原值
      product: form.product, // 后端要求必填，虽然不允许修改但需要包含原值
      plan: form.plan, // 后端要求必填，虽然不允许修改但需要包含原值
      
      // 用户可修改字段
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      max_activations: form.max_activations,
      expires_at: form.expires_at,
      status: form.status,
      notes: form.notes
    };

    // 处理元数据
    const metadata: Record<string, any> = {};
    metadataItems.value.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        metadata[item.key.trim()] = item.value.trim();
      }
    });
    
    if (Object.keys(metadata).length > 0) {
      submitData.metadata = metadata;
    }

    // 验证必填字段
    if (!submitData.tenant || !submitData.product || !submitData.plan) {
      logger.error("[LicenseEdit] 缺少必填字段", {
        tenant: submitData.tenant,
        product: submitData.product,
        plan: submitData.plan
      });
      throw new Error("缺少必填字段：租户、产品或方案信息");
    }

    // 调用更新许可证API
    logger.debug("[LicenseEdit] 开始更新许可证", { 
      id: form.id, 
      data: submitData,
      requiredFields: {
        tenant: submitData.tenant,
        product: submitData.product,
        plan: submitData.plan
      }
    });
    const response = await updateLicense(form.id!, submitData);
    
    if (!response.success) {
      throw new Error(response.message || "更新许可证失败");
    }
    
    logger.debug("[LicenseEdit] 许可证更新成功", response.data);
    
    // 记录性能
    const duration = performance.now() - performanceMonitor.value.startTime;
    logger.debug("[LicenseEdit] 更新耗时", { duration: `${duration.toFixed(2)}ms` });

    // 成功处理
    isDirty.value = false;
    clearDraft();
    ElMessage.success(t("license.licenses.updateSuccess") || '许可证更新成功！');
    router.push(`/license/licenses/${form.id}`);

  } catch (error: any) {
    logger.error("[LicenseEdit] 更新失败", error);
    handleSubmitError(error);
  } finally {
    submitting.value = false;
  }
};

const handleSubmitError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    
    if (status === 400 && data.data) {
      // 显示字段级错误
      Object.entries(data.data).forEach(([field, errors]) => {
        const errorMessage = Array.isArray(errors) ? errors[0] : errors;
        showFieldError(field, errorMessage as string);
      });
      ElMessage.error('请检查输入数据');
    } else {
      ElMessage.error(data.message || '更新失败，请重试');
    }
  } else {
    ElMessage.error(error.message || '网络错误，请检查连接');
  }
};

const handleCancel = () => {
  if (isDirty.value) {
  ElMessageBox.confirm(
      '您有未保存的更改，确定要取消吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      clearDraft();
      router.back();
    }).catch(() => {
      // 用户取消操作
    });
  } else {
    router.back();
  }
};

// 页面卸载前警告
const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (isDirty.value) {
    event.preventDefault();
    event.returnValue = '您有未保存的更改，确定要离开吗？';
  }
};

// 生命周期
onMounted(async () => {
  // 添加页面卸载监听
  window.addEventListener('beforeunload', beforeUnloadHandler);
  
  // 先测试API连接
  await testApiConnection();
  
  // 直接加载许可证数据，产品和方案信息包含在许可证详情中
  await loadLicenseData();
  
  // 加载草稿（在加载完成后）
  setTimeout(() => {
    loadDraft();
  }, 500);
});

onUnmounted(() => {
  // 清理定时器和事件监听
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value);
  }
  
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});
</script>

<style scoped>
/* 许可证更新表单样式 - 与原系统保持一致 */
/* 新的页面布局结构 */
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.page-header {
  flex-shrink: 0;
  background: #ffffff;
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #ffffff;
  margin: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.page-header h2 {
  margin: 16px 0 8px 0;
  color: #1a1a1a;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 0;
}

.form-description {
  margin: 0;
  color: #666666;
  font-size: 14px;
}

.auto-save-indicator {
  position: fixed;
  top: 80px;
  right: 20px;
  background: #52c41a;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  20%, 80% { opacity: 1; }
}

.license-update-form {
  background: #ffffff;
  border: 1px solid #e8e8e8;
}

.form-section {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: block !important;
  visibility: visible !important;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h3 {
  margin: 0 0 16px 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 500;
  padding-bottom: 8px;
  border-bottom: 2px solid #e6f7ff;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 简化标题样式 */

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
  display: block !important;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333333;
}

:deep(.el-input.readonly-field .el-input__inner) {
  background-color: #f5f5f5;
  cursor: default;
}

:deep(.el-input__prefix) {
  color: var(--el-color-primary);
}

.field-help {
  margin-top: 4px;
  font-size: 12px;
  color: #666666;
}

.field-help .current-value {
  color: var(--el-color-primary);
  font-weight: 500;
}

.remaining-days {
  font-weight: 500;
}

.remaining-days.expiring-soon {
  color: var(--el-color-warning);
}

.remaining-days.expired {
  color: var(--el-color-danger);
}

.field-error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
  display: none;
}

.field-error.show {
  display: block;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 元数据编辑器样式 */
.metadata-container {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 8px;
  min-height: 60px;
  background-color: #fafafa;
}

.empty-metadata {
  text-align: center;
  color: #999999;
  font-style: italic;
  padding: 20px 0;
}

.metadata-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
  background: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.metadata-item:last-child {
  margin-bottom: 0;
}

.metadata-item input {
  flex: 1;
  margin: 0;
}

.metadata-item .remove-metadata {
  color: var(--el-color-danger);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.metadata-item .remove-metadata:hover {
  background-color: var(--el-color-danger-light-9);
}

.add-metadata-btn {
  color: var(--el-color-primary);
  border: 1px dashed var(--el-color-primary);
  background: transparent;
  width: 100%;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.2s;
}

.add-metadata-btn:hover {
  background: var(--el-color-primary-light-9);
}

/* 简化按钮样式 */

/* 响应式设计 */
@media (max-width: 768px) {
  .page-container {
    height: 100vh;
  }
  
  .page-header,
  .form-section {
    padding: 16px;
  }
  
  .page-content {
    margin: 10px;
    padding: 16px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  /* 移动端按钮样式简化 */
  
  .metadata-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .metadata-item input {
    margin-bottom: 8px;
  }
  
  .metadata-item .remove-metadata {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 20px;
  }
  
  .form-section h3 {
    font-size: 16px;
  }
  
  /* 防止iOS缩放 */
  :deep(.el-input__inner),
  :deep(.el-select .el-input__inner),
  :deep(.el-textarea__inner) {
    font-size: 16px !important;
  }
}

/* 移除深色模式，保持与原系统一致的浅色主题 */

/* 打印样式 */
@media print {
  .auto-save-indicator {
    display: none !important;
  }
  
  .license-update-form {
    box-shadow: none;
    border: 1px solid #ccc;
  }
  
  .form-section {
    break-inside: avoid;
  }
}
</style>
