<template>
  <div class="task-template-editor-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="handleBack">
        <template #content>
          <span class="page-title">
            {{ isEdit ? "编辑任务模板" : "创建任务模板" }}
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
                      message: '请输入模板名称',
                      trigger: 'blur'
                    },
                    { max: 100, message: '名称不能超过100个字符', trigger: 'blur' }
                  ]"
                >
                  <el-input
                    v-model="form.translations![lang.code]!.name"
                    :placeholder="`请输入${lang.label}模板名称`"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item :label="`描述 (${lang.label})`">
                  <el-input
                    v-model="form.translations![lang.code]!.description"
                    type="textarea"
                    rows="3"
                    :placeholder="`请输入${lang.label}模板描述`"
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

          <el-form-item label="关联类型" prop="category">
            <el-select
              v-model="form.category"
              placeholder="选择任务类型"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.translated_name"
                :value="cat.id"
              >
                <span>{{ cat.icon }} {{ cat.translated_name }}</span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-divider content-position="left">提醒设置</el-divider>

          <el-form-item label="开启提醒">
            <el-switch v-model="form.reminder" />
          </el-form-item>

          <el-form-item label="提醒时间" v-if="form.reminder">
            <el-time-picker
              v-model="form.reminder_time"
              format="HH:mm"
              value-format="HH:mm:ss"
              placeholder="选择提醒时间"
            />
          </el-form-item>
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
import {
  useTaskTemplateActions,
  useTaskCategoryList
} from "@/composables/useCheckSystem";
import type {
  TaskTemplateCreateParams,
  TaskTemplateUpdateParams,
  TaskTemplateTranslation,
  TaskTemplateTranslations
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
const templateId = computed(() => Number(route.params.id) || 0);

// 任务类型列表
const { categories, fetchCategories } = useTaskCategoryList({ page_size: 100 });

// 操作
const {
  loading: actionLoading,
  create,
  update,
  fetchDetail
} = useTaskTemplateActions();

// 表单引用
const formRef = ref<FormInstance>();
const pageLoading = ref(false);
const submitLoading = ref(false);

// 当前选中的语言标签
const currentLanguage = ref<SupportedLanguage>(DEFAULT_LANGUAGE);

// 表单数据
const form = reactive({
  name: "", // 废弃，保留用于兼容
  description: "", // 废弃，保留用于兼容
  category: null as number | null,
  reminder: false,
  reminder_time: null as string | null,
  translations: {
    "zh-hans": { name: "", description: "" },
    en: { name: "", description: "" },
    "zh-hant": { name: "", description: "" },
    ja: { name: "", description: "" },
    ko: { name: "", description: "" },
    fr: { name: "", description: "" }
  } as TaskTemplateTranslations
});

// 表单验证规则
const rules: FormRules = {
  category: [{ required: true, message: "请选择关联类型", trigger: "change" }]
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

  const fields: (keyof TaskTemplateTranslation)[] = ["name", "description"];
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
    description: fromTrans.description || ""
  };

  ElMessage.success(
    `已从${getLanguageInfo(fromLang)?.label}复制到${getLanguageInfo(toLang)?.label}`
  );
};

// 初始化
onMounted(async () => {
  await fetchCategories();

  if (isEdit.value && templateId.value) {
    pageLoading.value = true;
    const detail = await fetchDetail(templateId.value);
    if (detail) {
      form.category = detail.category;
      form.reminder = detail.reminder;
      form.reminder_time = detail.reminder_time;

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
            description: detail.description || ""
          };
        } else {
          // 其他语言如果没有翻译，初始化为空
          form.translations[lang.code] = {
            name: "",
            description: ""
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
  router.push("/check-system/task-templates/list");
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

    const data: TaskTemplateCreateParams | TaskTemplateUpdateParams = {
      name: mainName,
      description: mainDesc,
      category: form.category!,
      reminder: form.reminder,
      reminder_time: form.reminder ? form.reminder_time || undefined : undefined,
      translations: form.translations
    };

    let result;
    if (isEdit.value) {
      result = await update(templateId.value, data as TaskTemplateUpdateParams);
    } else {
      result = await create(data as TaskTemplateCreateParams);
    }

    if (result) {
      router.push("/check-system/task-templates/list");
    }

    submitLoading.value = false;
  });
};
</script>

<style lang="scss" scoped>
.task-template-editor-container {
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
  }
}
</style>
