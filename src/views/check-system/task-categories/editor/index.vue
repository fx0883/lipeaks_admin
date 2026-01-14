<template>
  <div class="task-category-editor-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="handleBack">
        <template #content>
          <span class="page-title">
            {{ isEdit ? "编辑任务类型" : "创建任务类型" }}
          </span>
        </template>
      </el-page-header>
    </div>

    <!-- 表单区域 -->
    <el-card shadow="never" class="form-card" v-loading="pageLoading">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <!-- 多语言翻译区域 -->
        <el-card class="translation-card mb-4" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>多语言内容</span>
              <el-tooltip content="至少需要填写简体中文的名称">
                <el-icon class="ml-1"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>

          <el-tabs v-model="currentLanguage" class="language-tabs">
            <el-tab-pane
              v-for="lang in SUPPORTED_LANGUAGES"
              :key="lang.code"
              :name="lang.code"
            >
              <template #label>
                <div class="language-tab-label">
                  <span>{{ lang.label }}</span>
                  <el-icon v-if="hasTranslation(lang.code)" class="ml-1 text-green-500">
                    <CircleCheckFilled />
                  </el-icon>
                  <el-tag v-else size="small" type="info" class="ml-1">
                    {{ getTranslationProgress(lang.code) }}%
                  </el-tag>
                </div>
              </template>

              <!-- 当前语言的翻译字段 -->
              <div class="translation-fields">
                <el-form-item
                  :label="`名称 (${lang.label})`"
                  :prop="`translations.${lang.code}.name`"
                  :rules="[
                    {
                      required: lang.code === 'zh-hans',
                      message: '请输入类型名称',
                      trigger: 'blur'
                    },
                    { max: 50, message: '名称不能超过50个字符', trigger: 'blur' }
                  ]"
                >
                  <el-input
                    v-model="form.translations![lang.code]!.name"
                    :placeholder="`请输入${lang.label}类型名称`"
                    maxlength="50"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item :label="`描述 (${lang.label})`">
                  <el-input
                    v-model="form.translations![lang.code]!.description"
                    type="textarea"
                    rows="3"
                    :placeholder="`请输入${lang.label}类型描述`"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item :label="`目标说明 (${lang.label})`">
                  <el-input
                    v-model="form.translations![lang.code]!.goal"
                    :placeholder="`请输入${lang.label}目标说明`"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item :label="`提示 (${lang.label})`">
                  <el-input
                    v-model="form.translations![lang.code]!.tip"
                    :placeholder="`请输入${lang.label}提示`"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item :label="`引用语 (${lang.label})`">
                  <el-input
                    v-model="form.translations![lang.code]!.quote"
                    type="textarea"
                    rows="2"
                    :placeholder="`请输入${lang.label}引用语`"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>

                <!-- 复制功能 -->
                <el-form-item v-if="lang.code !== 'zh-hans'">
                  <el-button
                    size="small"
                    @click="copyToLanguage('zh-hans', lang.code)"
                  >
                    <el-icon class="mr-1"><DocumentCopy /></el-icon>
                    从简体中文复制
                  </el-button>
                </el-form-item>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 共享信息 -->
        <el-card class="mb-4" shadow="hover">
          <template #header>
            <span>共享信息（适用于所有语言）</span>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="图标">
                <el-input
                  v-model="form.icon"
                  placeholder="输入 emoji 图标，如 🎯"
                  style="width: 100%"
                >
                  <template #append>
                    <span class="icon-preview" v-if="form.icon">{{ form.icon }}</span>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="颜色">
                <el-color-picker v-model="form.color" />
                <span class="color-preview" :style="{ backgroundColor: form.color }"></span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
               <el-form-item label="表单类型" prop="form_type">
                <el-select v-model="form.form_type" style="width: 100%">
                  <el-option
                    v-for="opt in FORM_TYPE_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排序">
                <el-input-number v-model="form.sort_order" :min="0" :max="9999" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            {{ isEdit ? "保存" : "创建" }}
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { type FormInstance, type FormRules, ElMessage } from "element-plus";
import {
  QuestionFilled,
  CircleCheckFilled,
  DocumentCopy
} from "@element-plus/icons-vue";
import { useTaskCategoryActions } from "@/composables/useCheckSystem";
import { FORM_TYPE_OPTIONS } from "@/types/checkSystem";
import type {
  FormType,
  TaskCategoryCreateParams,
  TaskCategoryUpdateParams,
  TaskCategoryTranslation,
  TaskCategoryTranslations
} from "@/types/checkSystem";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguageInfo
} from "@/config/languages";
import type { SupportedLanguage } from "@/types/cms";

const router = useRouter();
const route = useRoute();

// 判断是否编辑模式
const isEdit = computed(() => !!route.params.id);
const categoryId = computed(() => Number(route.params.id) || 0);

// 操作
const {
  loading: actionLoading,
  create,
  update,
  fetchDetail
} = useTaskCategoryActions();

// 表单引用
const formRef = ref<FormInstance>();
const pageLoading = ref(false);
const submitLoading = ref(false);

// 当前选中的语言标签
const currentLanguage = ref<SupportedLanguage>(DEFAULT_LANGUAGE);

// 表单数据
const form = reactive({
  name: "", // 废弃，保留兼容
  description: "", // 废弃，保留兼容
  goal: "", // 废弃，保留兼容
  tip: "", // 废弃，保留兼容
  quote: "", // 废弃，保留兼容
  icon: "",
  color: "#409EFF",
  form_type: "text" as FormType,
  sort_order: 0,
  translations: {
    "zh-hans": { name: "", description: "", goal: "", tip: "", quote: "" },
    en: { name: "", description: "", goal: "", tip: "", quote: "" },
    "zh-hant": { name: "", description: "", goal: "", tip: "", quote: "" },
    ja: { name: "", description: "", goal: "", tip: "", quote: "" },
    ko: { name: "", description: "", goal: "", tip: "", quote: "" },
    fr: { name: "", description: "", goal: "", tip: "", quote: "" }
  } as TaskCategoryTranslations
});

// 表单验证规则
const rules: FormRules = {
  form_type: [{ required: true, message: "请选择表单类型", trigger: "change" }]
};

// 检查某个语言是否已翻译
const hasTranslation = (langCode: SupportedLanguage): boolean => {
  const trans = form.translations?.[langCode];
  return !!(trans && trans.name && trans.name.trim());
};

// 获取翻译完成度百分比
const getTranslationProgress = (langCode: SupportedLanguage): number => {
  const trans = form.translations?.[langCode];
  if (!trans) return 0;

  const fields: (keyof TaskCategoryTranslation)[] = [
    "name",
    "description",
    "goal",
    "tip",
    "quote"
  ];
  const filledFields = fields.filter((field) => trans[field]?.trim()).length;
  return Math.round((filledFields / fields.length) * 100);
};

// 复制翻译内容到其他语言
const copyToLanguage = (
  fromLang: SupportedLanguage,
  toLang: SupportedLanguage
) => {
  const fromTrans = form.translations?.[fromLang];
  if (!fromTrans || !form.translations) return;

  form.translations[toLang] = {
    name: fromTrans.name || "",
    description: fromTrans.description || "",
    goal: fromTrans.goal || "",
    tip: fromTrans.tip || "",
    quote: fromTrans.quote || ""
  };

  ElMessage.success(
    `已从${getLanguageInfo(fromLang)?.label}复制到${getLanguageInfo(toLang)?.label}`
  );
};

// 初始化
onMounted(async () => {
  if (isEdit.value && categoryId.value) {
    pageLoading.value = true;
    const detail = await fetchDetail(categoryId.value);
    if (detail) {
      form.icon = detail.icon || "";
      form.color = detail.color || "#409EFF";
      form.form_type = detail.form_type || "text";
      form.sort_order = detail.sort_order || 0;

      // 初始化翻译数据
      // 无论是否有 translations 对象，都进行遍历初始化，确保 defaults 被正确处理
      SUPPORTED_LANGUAGES.forEach((lang) => {
        // 尝试获取该语言的翻译
        const trans = detail.translations?.[lang.code];
        
        if (trans && (trans.name || trans.description)) {
          // 如果有翻译且至少有名称或描述（避免空对象），则使用翻译
          form.translations[lang.code] = trans;
        } else if (lang.code === 'zh-hans') {
          // 如果是简体中文且没有翻译（或翻译为空），强制使用根字段作为回退
          // 这对于旧数据或 translations 为空的情况非常关键
          form.translations[lang.code] = {
            name: detail.name || "",
            description: detail.description || "",
            goal: detail.goal || "",
            tip: detail.tip || "",
            quote: detail.quote || ""
          };
        } else {
          // 其他语言如果没有翻译，初始化为空
          form.translations[lang.code] = {
            name: "",
            description: "",
            goal: "",
            tip: "",
            quote: ""
          };
        }
      });
    }
    pageLoading.value = false;
  }
});

/**
 * 返回列表
 */
const handleBack = () => {
  router.push("/check-system/task-categories/list");
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitLoading.value = true;

    // 获取简体中文名称作为主名称（兼容后端必填项）
    const mainName = form.translations["zh-hans"]?.name || "";
    const mainDesc = form.translations["zh-hans"]?.description || "";
    const mainGoal = form.translations["zh-hans"]?.goal || "";
    const mainTip = form.translations["zh-hans"]?.tip || "";
    const mainQuote = form.translations["zh-hans"]?.quote || "";

    const data: TaskCategoryCreateParams | TaskCategoryUpdateParams = {
      name: mainName,
      description: mainDesc,
      icon: form.icon || undefined,
      color: form.color || undefined,
      form_type: form.form_type,
      sort_order: form.sort_order,
      goal: mainGoal,
      tip: mainTip,
      quote: mainQuote,
      translations: form.translations
    };

    let result;
    if (isEdit.value) {
      result = await update(categoryId.value, data as TaskCategoryUpdateParams);
    } else {
      result = await create(data as TaskCategoryCreateParams);
    }

    if (result) {
      router.push("/check-system/task-categories/list");
    }

    submitLoading.value = false;
  });
};
</script>

<style lang="scss" scoped>
.task-category-editor-container {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .form-card {
    .el-divider {
      margin: 24px 0 20px;

      :deep(.el-divider__text) {
        font-weight: 500;
        color: #606266;
      }
    }

    .card-header {
      display: flex;
      align-items: center;
    }

    .language-tab-label {
      display: flex;
      align-items: center;
      
      .el-icon {
        margin-left: 4px;
      }
    }

    .icon-preview {
      display: inline-block;
      margin-left: 8px;
      font-size: 20px;
    }

    .color-preview {
      display: inline-block;
      width: 24px;
      height: 24px;
      margin-left: 12px;
      border-radius: 4px;
      vertical-align: middle;
    }
  }
}
</style>
