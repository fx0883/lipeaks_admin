<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="loading"
  >
    <!-- 多语言翻译区域 -->
    <el-card class="translation-card mb-4">
      <template #header>
        <div class="card-header">
          <span>多语言内容</span>
          <el-tooltip content="至少需要填写一种语言的分类名称">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>

      <!-- 语言标签 -->
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
                { required: lang.code === 'zh-hans', message: '请输入分类名称', trigger: 'blur' },
                { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
              ]"
            >
              <el-input
                v-model="form.translations![lang.code]!.name"
                :placeholder="`请输入${lang.label}分类名称`"
              />
            </el-form-item>

            <el-form-item :label="`描述 (${lang.label})`">
              <el-input
                v-model="form.translations![lang.code]!.description"
                type="textarea"
                rows="3"
                :placeholder="`请输入${lang.label}分类描述`"
              />
            </el-form-item>

            <el-form-item :label="`SEO标题 (${lang.label})`">
              <el-input
                v-model="form.translations![lang.code]!.seo_title"
                :placeholder="`请输入${lang.label}SEO标题`"
                maxlength="255"
                show-word-limit
              />
            </el-form-item>

            <el-form-item :label="`SEO描述 (${lang.label})`">
              <el-input
                v-model="form.translations![lang.code]!.seo_description"
                type="textarea"
                rows="2"
                :placeholder="`请输入${lang.label}SEO描述`"
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

    <!-- 共享字段（所有语言通用） -->
    <el-card class="shared-fields-card mb-4">
      <template #header>
        <span>共享信息（适用于所有语言）</span>
      </template>

      <el-form-item label="别名" prop="slug">
      <el-input v-model="form.slug" placeholder="请输入分类别名">
        <template #append>
          <el-button
            :icon="RefreshRight"
            @click="generateSlug"
            title="根据名称自动生成别名"
          />
        </template>
      </el-input>
      <div class="text-gray-400 text-xs mt-1">
        用于URL的标识，建议使用英文字母、数字和连字符
      </div>
    </el-form-item>

    <el-form-item label="父级分类" prop="parent">
      <el-select
        v-model="form.parent"
        :model-value="form.parent"
        placeholder="请选择父级分类（可选）"
        clearable
        filterable
        :loading="categoriesLoading"
      >
        <el-option
          v-for="item in categoryList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
          :disabled="formMode === 'edit' && item.id === editId"
        />
      </el-select>
      <div class="text-gray-400 text-xs mt-1">不选择则为顶级分类</div>
      <!-- 调试信息 -->
      <div v-if="false" class="text-xs text-gray-400 mt-1">
        当前选中的父级ID: {{ form.parent }}
      </div>
    </el-form-item>

    <el-form-item label="图标" prop="icon">
      <el-input v-model="form.icon" placeholder="请输入图标名称">
        <template #prepend v-if="form.icon">
          <div class="icon-preview">
            <IconifyIconOnline :icon="form.icon" />
          </div>
        </template>
        <template #append>
          <el-button @click="openIconSelector"> 选择图标 </el-button>
        </template>
      </el-input>
      <div class="text-gray-400 text-xs mt-1">
        支持 Element Plus 和 Remix 图标库
      </div>
    </el-form-item>

    <el-form-item label="排序" prop="sort_order">
      <el-input-number
        v-model="form.sort_order"
        :min="0"
        :max="999"
        placeholder="排序值"
      />
      <div class="text-gray-400 text-xs mt-1">
        数字越小越靠前，默认按创建时间排序
      </div>
    </el-form-item>

    <el-form-item label="状态" prop="is_active">
      <el-switch
        v-model="form.is_active"
        :active-value="true"
        :inactive-value="false"
        active-text="启用"
        inactive-text="禁用"
      />
    </el-form-item>

    <el-form-item label="置顶" prop="is_pinned">
      <el-switch
        v-model="form.is_pinned"
        :active-value="true"
        :inactive-value="false"
        active-text="置顶"
        inactive-text="不置顶"
      />
      <div class="text-gray-400 text-xs mt-1">
        置顶分类将在列表中优先展示
      </div>
    </el-form-item>

    <el-form-item label="封面图" prop="cover_image">
      <ImageUpload
        v-model="form.cover_image"
        :disabled="loading"
        :folder="'category_covers'"
        :uploadText="'上传分类封面图'"
        :tipText="'建议上传 1200x630 或 800x600 尺寸图片，支持 JPG/PNG/WebP 格式，最大 5MB'"
      />
    </el-form-item>

    </el-card>

    <el-form-item>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ submitButtonText }}
      </el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>

  <!-- 图标选择器组件 -->
  <IconSelector ref="iconSelectorRef" @select="handleIconSelect" />
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { ElMessage, ElButton, ElSelect, ElOption, ElInput } from "element-plus";
import { RefreshRight, CircleCheckFilled, QuestionFilled, DocumentCopy } from "@element-plus/icons-vue";
import { useCmsStore } from "@/store/modules/cms";
import type {
  Category,
  CategoryCreateParams,
  CategoryUpdateParams,
  SupportedLanguage,
  CategoryTranslation
} from "@/types/cms";
import IconSelector from "@/components/Cms/Category/IconSelector.vue";
import ImageUpload from "@/components/Cms/Article/ImageUpload.vue";
import { IconifyIconOnline } from "@/components/ReIcon";
import { useI18n } from "vue-i18n";
import { slugify } from "@/utils/string";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, getLanguageInfo } from "@/config/languages";

interface Props {
  formMode: "create" | "edit";
  editId?: number;
  categoryData?: Category | null;
  loading?: boolean;
  defaultParentId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  formMode: "create",
  editId: undefined,
  categoryData: null,
  loading: false,
  defaultParentId: null
});

const emit = defineEmits(["submit", "cancel"]);

const cmsStore = useCmsStore();
const formRef = ref();
const loading = ref(props.loading);
const categoriesLoading = ref(false);

// 图标选择器引用
const iconSelectorRef = ref();

// 当前选中的语言标签
const currentLanguage = ref<SupportedLanguage>(DEFAULT_LANGUAGE);

const submitButtonText = computed(() => {
  return props.formMode === "create" ? "创建" : "更新";
});

// 分类树数据
const categoryTree = ref<Category[]>([]);

// 分类列表数据
const categoryList = ref<Category[]>([]);

// 表单数据
const form = reactive<CategoryCreateParams>({
  slug: "",
  parent: props.defaultParentId || props.categoryData?.parent || null,
  icon: "",
  cover_image: "",
  is_active: true,
  is_pinned: false,
  sort_order: 0,
  
  // 多语言翻译对象
  translations: {
    'zh-hans': { name: '', description: '', seo_title: '', seo_description: '' },
    'en': { name: '', description: '', seo_title: '', seo_description: '' },
    'zh-hant': { name: '', description: '', seo_title: '', seo_description: '' },
    'ja': { name: '', description: '', seo_title: '', seo_description: '' },
    'ko': { name: '', description: '', seo_title: '', seo_description: '' },
    'fr': { name: '', description: '', seo_title: '', seo_description: '' }
  }
});

// 检查某个语言是否已翻译
const hasTranslation = (langCode: SupportedLanguage): boolean => {
  const trans = form.translations?.[langCode];
  return !!(trans && trans.name && trans.name.trim());
};

// 获取翻译完成度百分比
const getTranslationProgress = (langCode: SupportedLanguage): number => {
  const trans = form.translations?.[langCode];
  if (!trans) return 0;
  
  const fields: (keyof CategoryTranslation)[] = ['name', 'description', 'seo_title', 'seo_description'];
  const filledFields = fields.filter(field => trans[field]?.trim()).length;
  return Math.round((filledFields / fields.length) * 100);
};

// 复制翻译内容到其他语言
const copyToLanguage = (fromLang: SupportedLanguage, toLang: SupportedLanguage) => {
  const fromTrans = form.translations?.[fromLang];
  if (!fromTrans || !form.translations) return;
  
  form.translations[toLang] = {
    name: fromTrans.name || '',
    description: fromTrans.description || '',
    seo_title: fromTrans.seo_title || '',
    seo_description: fromTrans.seo_description || ''
  };
  
  ElMessage.success(`已从${getLanguageInfo(fromLang)?.label}复制到${getLanguageInfo(toLang)?.label}`);
};

// 切换语言标签
const switchLanguage = (langCode: SupportedLanguage) => {
  currentLanguage.value = langCode;
};

// 表单验证规则
const rules = {
  slug: [
    { required: false, message: "请输入分类别名", trigger: "blur" },
    {
      pattern: /^[a-z0-9-]+$/,
      message: "只能包含小写字母、数字和连字符",
      trigger: "blur"
    }
  ],
  // 验证至少一种语言的name字段必填
  translations: [
    {
      validator: (rule: any, value: any, callback: any) => {
        const hasAnyName = SUPPORTED_LANGUAGES.some(lang => {
          const trans = form.translations?.[lang.code];
          return trans && trans.name && trans.name.trim();
        });
        
        if (!hasAnyName) {
          callback(new Error('至少需要填写一种语言的分类名称'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 监听loading属性变化
watch(
  () => props.loading,
  newVal => {
    console.log("[CategoryForm] props.loading变化:", newVal);
    loading.value = newVal;
  }
);

// 初始化数据
const initFormData = () => {
  console.log("[CategoryForm] initFormData - props:", {
    formMode: props.formMode,
    categoryData: props.categoryData,
    editId: props.editId,
    defaultParentId: props.defaultParentId,
    loading: props.loading
  });

  if (props.formMode === "edit" && props.categoryData) {
    console.log(
      "[CategoryForm] 编辑模式 - 设置表单数据:",
      JSON.stringify(props.categoryData)
    );
    // 设置共享字段
    form.slug = props.categoryData.slug || "";
    form.parent = props.categoryData.parent || null;
    form.icon = props.categoryData.icon || "";
    form.cover_image = props.categoryData.cover_image || "";
    form.is_active =
      props.categoryData.is_active !== undefined
        ? props.categoryData.is_active
        : true;
    form.is_pinned =
      props.categoryData.is_pinned !== undefined
        ? props.categoryData.is_pinned
        : false;
    form.sort_order =
      props.categoryData.sort_order !== undefined
        ? props.categoryData.sort_order
        : 0;

    // 处理多语言翻译数据
    if (props.categoryData.translations) {
      form.translations = {
        'zh-hans': props.categoryData.translations['zh-hans'] || { name: '', description: '', seo_title: '', seo_description: '' },
        'en': props.categoryData.translations['en'] || { name: '', description: '', seo_title: '', seo_description: '' },
        'zh-hant': props.categoryData.translations['zh-hant'] || { name: '', description: '', seo_title: '', seo_description: '' },
        'ja': props.categoryData.translations['ja'] || { name: '', description: '', seo_title: '', seo_description: '' },
        'ko': props.categoryData.translations['ko'] || { name: '', description: '', seo_title: '', seo_description: '' },
        'fr': props.categoryData.translations['fr'] || { name: '', description: '', seo_title: '', seo_description: '' }
      };
    } else {
      // 如果没有translations对象，从单语言字段迁移到默认语言
      form.translations = {
        'zh-hans': {
          name: props.categoryData.name || '',
          description: props.categoryData.description || '',
          seo_title: props.categoryData.seo_title || '',
          seo_description: props.categoryData.seo_description || ''
        },
        'en': { name: '', description: '', seo_title: '', seo_description: '' },
        'zh-hant': { name: '', description: '', seo_title: '', seo_description: '' },
        'ja': { name: '', description: '', seo_title: '', seo_description: '' },
        'ko': { name: '', description: '', seo_title: '', seo_description: '' },
        'fr': { name: '', description: '', seo_title: '', seo_description: '' }
      };
    }

    console.log(
      "[CategoryForm] 编辑模式 - 设置后的表单数据:",
      JSON.stringify(form)
    );
  } else if (
    props.formMode === "create" &&
    props.categoryData &&
    props.categoryData.parent
  ) {
    // 添加子分类时，设置父级ID
    console.log(
      "[CategoryForm] 创建子分类模式 - 设置父级ID:",
      props.categoryData.parent
    );
    form.parent = props.categoryData.parent;
    console.log(
      "[CategoryForm] 创建子分类模式 - 设置后的表单数据:",
      JSON.stringify(form)
    );
  } else if (props.formMode === "create" && props.defaultParentId) {
    // 使用默认父级ID
    console.log(
      "[CategoryForm] 创建模式 - 使用默认父级ID:",
      props.defaultParentId
    );
    form.parent = props.defaultParentId;
    console.log(
      "[CategoryForm] 创建模式 - 设置后的表单数据:",
      JSON.stringify(form)
    );
  } else {
    console.log(
      "[CategoryForm] 其他模式 - 当前表单数据:",
      JSON.stringify(form)
    );
  }
};

// 监听分类数据变化
watch(
  () => props.categoryData,
  newVal => {
    console.log("[CategoryForm] watch categoryData - 新值:", newVal);
    if (newVal) {
      console.log("[CategoryForm] categoryData变化，重新初始化表单数据");
      initFormData();
    }
  },
  { immediate: true }
);

// 监听默认父级ID变化
watch(
  () => props.defaultParentId,
  newVal => {
    console.log("[CategoryForm] watch defaultParentId - 新值:", newVal);
    if (newVal) {
      console.log("[CategoryForm] 从 defaultParentId 设置父级ID:", newVal);
      form.parent = newVal;
    }
  },
  { immediate: true }
);

// 获取分类列表
const fetchCategoryList = async () => {
  try {
    console.log("[CategoryForm] 开始获取分类列表");
    categoriesLoading.value = true; // 设置加载状态
    const result = await cmsStore.fetchCategoryList();
    console.log("[CategoryForm] 获取到的分类列表:", result);

    // 详细检查返回的数据结构
    if (result && result.data && Array.isArray(result.data)) {
      // 如果result.data是数组，使用它
      categoryList.value = result.data;
      console.log(
        "[CategoryForm] 分类列表设置成功 (data属性), 长度:",
        categoryList.value.length,
        "内容:",
        categoryList.value
      );
    } else if (result && Array.isArray(result)) {
      // 如果result本身是数组，使用它
      categoryList.value = result;
      console.log(
        "[CategoryForm] 分类列表设置成功 (直接数组), 长度:",
        categoryList.value.length,
        "内容:",
        categoryList.value
      );
    } else if (result && result.success && Array.isArray(result.data)) {
      // 如果result有success属性，并且data是数组
      categoryList.value = result.data;
      console.log(
        "[CategoryForm] 分类列表设置成功 (success.data), 长度:",
        categoryList.value.length,
        "内容:",
        categoryList.value
      );
    } else {
      console.warn("[CategoryForm] 获取的分类列表格式不正确:", result);
      console.warn("[CategoryForm] result类型:", typeof result);
      if (result) {
        console.warn("[CategoryForm] result包含的属性:", Object.keys(result));
      }
      categoryList.value = []; // 确保是空数组而不是 undefined
    }

    // 在分类列表加载完成后，确保父级ID正确设置
    nextTick(() => {
      if (props.defaultParentId) {
        console.log(
          "[CategoryForm] 分类列表加载完成后设置默认父级ID:",
          props.defaultParentId
        );
        form.parent = props.defaultParentId;
      } else if (props.categoryData && props.categoryData.parent) {
        console.log(
          "[CategoryForm] 分类列表加载完成后设置父级ID:",
          props.categoryData.parent
        );
        form.parent = props.categoryData.parent;
      }
    });
  } catch (error) {
    console.error("[CategoryForm] 获取分类列表失败:", error);
    if (error instanceof Error) {
      console.error("[CategoryForm] 错误详情:", error.message);
      console.error("[CategoryForm] 错误堆栈:", error.stack);
    }
    categoryList.value = []; // 确保是空数组而不是 undefined
  } finally {
    categoriesLoading.value = false; // 重置加载状态
  }
};

// 获取分类树
const fetchCategoryTree = async () => {
  try {
    console.log("[CategoryForm] 开始获取分类树");
    const result = await cmsStore.fetchCategoryTree();
    console.log("[CategoryForm] 获取到的分类树:", result);
    categoryTree.value = result;
    console.log("[CategoryForm] 设置后的分类树:", categoryTree.value);
  } catch (error) {
    console.error("[CategoryForm] 获取分类树失败:", error);
    // 已在store中处理错误
  }
};

// 生成别名
const generateSlug = () => {
  if (!form.name) {
    ElMessage.warning("请先输入分类名称");
    return;
  }

  form.slug = slugify(form.name);
};

// 打开图标选择器
const openIconSelector = () => {
  iconSelectorRef.value?.open();
};

// 处理图标选择
const handleIconSelect = (icon: string) => {
  console.log("[CategoryForm] 选择了图标:", icon);
  form.icon = icon;
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    console.log("[CategoryForm] 提交前的表单数据:", form);
    await formRef.value.validate();

    loading.value = true;
    const formData = { ...form };
    console.log("[CategoryForm] 提交的表单数据:", formData);

    if (props.formMode === "create") {
      console.log("[CategoryForm] 创建分类:", formData);
      await cmsStore.createCategory(formData);
    } else if (props.formMode === "edit" && props.editId) {
      console.log("[CategoryForm] 更新分类:", props.editId, formData);
      await cmsStore.updateCategory(
        props.editId,
        formData as CategoryUpdateParams
      );
    }

    emit("submit");
  } catch (error) {
    console.error("[CategoryForm] 表单验证或提交失败", error);
  } finally {
    loading.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  emit("cancel");
};

// 组件挂载后获取分类数据
onMounted(() => {
  console.log("[CategoryForm] 组件挂载, props:", {
    formMode: props.formMode,
    categoryData: props.categoryData,
    editId: props.editId,
    defaultParentId: props.defaultParentId
  });

  console.log("[CategoryForm] 初始表单数据:", JSON.stringify(form));

  // 初始化表单数据
  initFormData();

  // 获取分类数据
  fetchCategoryTree();
  fetchCategoryList();
});
</script>

<style scoped>
.icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 18px;
}

.translation-card,
.shared-fields-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-tabs {
  margin-top: 16px;
}

.language-tab-label {
  display: flex;
  align-items: center;
}

.translation-fields {
  padding: 16px 0;
}

.text-green-500 {
  color: #67c23a;
}

.mb-4 {
  margin-bottom: 1rem;
}

.ml-1 {
  margin-left: 0.25rem;
}

.mr-1 {
  margin-right: 0.25rem;
}
</style>
