<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="disabled"
  >
    <!-- 头像上传 -->
    <div class="avatar-container">
      <el-form-item label="">
        <AvatarUpload
          :avatar-url="form.avatar"
          :disabled="disabled"
          :loading="avatarUploading"
          @update="handleAvatarUpdate"
        />
      </el-form-item>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.username')">
          <el-input
            v-model="form.username"
            :placeholder="$t('member.usernamePlaceholder')"
            :disabled="isEdit"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.nickName')" prop="nick_name">
          <el-input
            v-model="form.nick_name"
            :placeholder="$t('member.nickNamePlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.firstName')" prop="first_name">
          <el-input
            v-model="form.first_name"
            :placeholder="$t('member.firstNamePlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.lastName')" prop="last_name">
          <el-input
            v-model="form.last_name"
            :placeholder="$t('member.lastNamePlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.email')" prop="email" required>
          <el-input
            v-model="form.email"
            :placeholder="$t('member.emailPlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.phone')" prop="phone">
          <el-input
            v-model="form.phone"
            :placeholder="$t('member.phonePlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.wechatId')" prop="wechat_id">
          <el-input
            v-model="form.wechat_id"
            :placeholder="$t('member.wechatIdPlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.status')" prop="status">
          <el-select
            v-model="form.status"
            :placeholder="$t('member.statusPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-if="showTenantSelect" :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.tenant')" prop="tenant_id">
          <el-select
            v-model="form.tenant_id"
            :placeholder="$t('member.tenantPlaceholder')"
            style="width: 100%"
            filterable
            remote
            :remote-method="remoteTenantSearch"
            :loading="tenantLoading"
          >
            <el-option
              v-for="item in tenantOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 密码输入框 -->
    <template v-if="!isEdit">
      <!-- 创建模式：密码必填 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="$t('member.password')" prop="password" required>
            <el-input
              v-model="form.password"
              type="password"
              :placeholder="$t('member.passwordPlaceholder')"
              show-password
              autocomplete="new-password"
            />
            <!-- 密码强度指示器 -->
            <div v-if="form.password" class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :class="passwordStrength.class"
                  :style="{ width: passwordStrength.width }"
                ></div>
              </div>
              <span class="strength-text" :class="passwordStrength.class">
                {{ passwordStrength.text }}
              </span>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('member.confirmPassword')" prop="confirm_password" required>
            <el-input
              v-model="form.confirm_password"
              type="password"
              :placeholder="$t('member.confirmPasswordPlaceholder')"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </template>
    <template v-else>
      <!-- 编辑模式：可选择是否重置密码 -->
      <el-form-item>
        <el-checkbox v-model="resetPassword">
          {{ $t('member.resetPassword') }}
        </el-checkbox>
      </el-form-item>
      <el-row v-if="resetPassword" :gutter="20">
        <el-col :span="12">
          <el-form-item :label="$t('member.newPassword')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              :placeholder="$t('member.passwordPlaceholder')"
              show-password
              autocomplete="new-password"
            />
            <!-- 密码强度指示器 -->
            <div v-if="form.password" class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :class="passwordStrength.class"
                  :style="{ width: passwordStrength.width }"
                ></div>
              </div>
              <span class="strength-text" :class="passwordStrength.class">
                {{ passwordStrength.text }}
              </span>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('member.confirmPassword')" prop="confirm_password">
            <el-input
              v-model="form.confirm_password"
              type="password"
              :placeholder="$t('member.confirmPasswordPlaceholder')"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <el-form-item :label="$t('member.notes')" prop="notes">
      <el-input
        v-model="form.notes"
        type="textarea"
        :rows="3"
        :placeholder="$t('member.notesPlaceholder')"
      />
    </el-form-item>

    <el-form-item v-if="!disabled">
      <el-button type="primary" :loading="submitLoading" @click="submitForm">
        {{ $t("common.submit") }}
      </el-button>
      <el-button @click="resetForm">{{ $t("common.reset") }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, PropType, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type {
  Member,
  MemberStatus,
  MemberCreateUpdateParams
} from "@/types/member";
import { ElMessage } from "element-plus";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useUserStoreHook } from "@/store/modules/user";
import { AvatarUpload } from "@/components/MemberManagement";
import logger from "@/utils/logger";

const { t } = useI18n();
const tenantStore = useTenantStoreHook();
const userStore = useUserStoreHook();

const props = defineProps({
  // 会员数据
  memberData: {
    type: Object as PropType<Member | null>,
    default: null
  },
  // 是否为编辑模式
  isEdit: {
    type: Boolean,
    default: false
  },
  // 是否禁用表单
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 是否显示租户选择器
  showTenantSelect: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits<{
  (e: "submit", data: MemberCreateUpdateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 提交加载状态
const submitLoading = ref(false);

// 租户加载状态
const tenantLoading = ref(false);

// 头像上传状态
const avatarUploading = ref(false);

// 是否重置密码（编辑模式使用）
const resetPassword = ref(false);

// 租户选项
const tenantOptions = ref([]);

// 会员状态选项
const statusOptions = [
  {
    value: "active",
    label: t("member.statusActive")
  },
  {
    value: "suspended",
    label: t("member.statusSuspended")
  },
  {
    value: "inactive",
    label: t("member.statusInactive")
  }
];

// 表单数据
const form = reactive({
  username: "",
  nick_name: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  wechat_id: "",
  password: "",
  confirm_password: "",
  status: "active" as MemberStatus,
  tenant_id: undefined as number | undefined,
  notes: "",
  avatar: "",
  avatarFile: null as File | null
});

// 计算密码强度
const passwordStrength = computed(() => {
  const pwd = form.password;
  if (!pwd) return { width: '0%', class: '', text: '' };
  
  let strength = 0;
  // 长度检查
  if (pwd.length >= 8) strength += 1;
  if (pwd.length >= 12) strength += 1;
  // 包含小写字母
  if (/[a-z]/.test(pwd)) strength += 1;
  // 包含大写字母
  if (/[A-Z]/.test(pwd)) strength += 1;
  // 包含数字
  if (/[0-9]/.test(pwd)) strength += 1;
  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(pwd)) strength += 1;
  
  if (strength <= 2) {
    return { 
      width: '33%', 
      class: 'weak', 
      text: t('member.passwordWeak') 
    };
  } else if (strength <= 4) {
    return { 
      width: '66%', 
      class: 'medium', 
      text: t('member.passwordMedium') 
    };
  } else {
    return { 
      width: '100%', 
      class: 'strong', 
      text: t('member.passwordStrong') 
    };
  }
});

// 表单验证规则
const rules = reactive<FormRules>({
  nick_name: [
    { required: true, message: t("member.nameRequired"), trigger: "blur" },
    { min: 2, max: 50, message: t("member.nameLength"), trigger: "blur" }
  ],
  email: [
    { required: true, message: t("member.emailRequired"), trigger: "blur" },
    { type: "email", message: t("member.emailInvalid"), trigger: "blur" }
  ],
  phone: [
    {
      pattern: /^[0-9\-+\s()]*$/,
      message: t("member.phoneInvalid"),
      trigger: "blur"
    }
  ],
  wechat_id: [
    { max: 32, message: t("member.wechatIdLength"), trigger: "blur" }
  ],
  password: [
    { 
      required: !props.isEdit, 
      message: t("member.passwordRequired"), 
      trigger: "blur" 
    },
    { 
      min: 8, 
      message: t("member.passwordMinLength"), 
      trigger: "blur" 
    },
    {
      validator: (rule, value, callback) => {
        // 创建模式或编辑模式勾选重置密码时验证
        if ((!props.isEdit || resetPassword.value) && value) {
          // 检查是否包含大小写字母和数字
          const hasLower = /[a-z]/.test(value);
          const hasUpper = /[A-Z]/.test(value);
          const hasNumber = /[0-9]/.test(value);
          
          if (!hasLower || !hasUpper || !hasNumber) {
            callback(new Error(t("member.passwordStrength")));
          } else {
            callback();
          }
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  confirm_password: [
    { 
      required: !props.isEdit || resetPassword.value, 
      message: t("member.confirmPasswordRequired"), 
      trigger: "blur" 
    },
    {
      validator: (rule, value, callback) => {
        if ((!props.isEdit || resetPassword.value) && value !== form.password) {
          callback(new Error(t("member.passwordMismatch")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  status: [
    { required: true, message: t("member.statusRequired"), trigger: "change" }
  ],
  tenant_id: [
    {
      required: props.showTenantSelect && userStore.is_super_admin === false,
      message: t("member.tenantRequired"),
      trigger: "change"
    }
  ]
});

// 处理头像上传
const handleAvatarUpdate = (file: File) => {
  form.avatarFile = file;
  // 创建本地预览URL
  form.avatar = URL.createObjectURL(file);
};

// 初始化表单数据
const initFormData = () => {
  if (props.memberData) {
    form.username = props.memberData.username || "";
    form.nick_name = props.memberData.nick_name || "";
    form.first_name = props.memberData.first_name || "";
    form.last_name = props.memberData.last_name || "";
    form.email = props.memberData.email || "";
    form.phone = props.memberData.phone || "";
    form.wechat_id = props.memberData.wechat_id || "";
    form.status = props.memberData.status as MemberStatus;
    form.tenant_id = props.memberData.tenant_id;
    form.notes = props.memberData.notes || "";
    form.avatar = props.memberData.avatar || "";
    
    // 编辑模式下重置密码相关字段
    form.password = "";
    form.confirm_password = "";
    resetPassword.value = false;

    // 如果有租户信息，添加到租户选项中
    if (props.memberData.tenant_id && props.memberData.tenant_name) {
      tenantOptions.value = [
        {
          value: props.memberData.tenant_id,
          label: props.memberData.tenant_name
        }
      ];
    }
  } else {
    resetForm();
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.username = "";
  form.nick_name = "";
  form.first_name = "";
  form.last_name = "";
  form.email = "";
  form.phone = "";
  form.wechat_id = "";
  form.password = "";
  form.confirm_password = "";
  form.status = "active" as MemberStatus;
  form.tenant_id = undefined;
  form.notes = "";
  form.avatar = "";
  form.avatarFile = null;
  resetPassword.value = false;
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    // 构建提交数据
    const submitData: MemberCreateUpdateParams = {
      username: form.username,
      nick_name: form.nick_name,
      first_name: form.first_name,
      last_name: form.last_name,
      status: form.status,
      email: form.email || ""
    };

    // 可选字段
    if (form.phone) submitData.phone = form.phone;
    if (form.wechat_id) submitData.wechat_id = form.wechat_id;
    if (form.notes) submitData.notes = form.notes;
    if (form.tenant_id && props.showTenantSelect)
      submitData.tenant_id = form.tenant_id;

    // 如果是创建模式或编辑模式勾选了重置密码，添加密码
    if (!props.isEdit || resetPassword.value) {
      submitData.password = form.password;
      submitData.confirm_password = form.confirm_password;
    }

    // 如果有头像文件，添加到提交数据
    if (form.avatarFile) {
      submitData.avatarFile = form.avatarFile;
    }

    // 触发提交事件
    emit("submit", submitData);
  } catch (error) {
    logger.error("表单验证失败", error);
    ElMessage.error(t("common.formValidationFailed"));
  } finally {
    submitLoading.value = false;
  }
};

// 远程搜索租户
const remoteTenantSearch = async (query: string) => {
  if (query) {
    tenantLoading.value = true;
    try {
      await tenantStore.fetchTenantList({
        search: query,
        page: 1,
        page_size: 10
      });
      tenantOptions.value = tenantStore.tenantList.data.map(tenant => ({
        value: tenant.id,
        label: tenant.name
      }));
    } catch (error) {
      logger.error("搜索租户失败", error);
    } finally {
      tenantLoading.value = false;
    }
  } else {
    tenantOptions.value = [];
  }
};

// 暴露resetForm方法给父组件
defineExpose({
  resetForm
});

// 初始化
onMounted(() => {
  initFormData();
});
</script>

<style scoped>
.el-form {
  max-width: 100%;
}

.avatar-container {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 4px;
  background-color: #e4e7ed;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  background-color: #f56c6c;
}

.strength-fill.medium {
  background-color: #e6a23c;
}

.strength-fill.strong {
  background-color: #67c23a;
}

.strength-text {
  font-size: 12px;
  transition: color 0.3s ease;
}

.strength-text.weak {
  color: #f56c6c;
}

.strength-text.medium {
  color: #e6a23c;
}

.strength-text.strong {
  color: #67c23a;
}
</style>
