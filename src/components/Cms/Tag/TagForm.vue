<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="loading"
  >
    <el-form-item :label="$t('cms.tag.name')" prop="name">
      <el-input v-model="form.name" :placeholder="$t('cms.tag.nameRequired')" />
    </el-form-item>

    <el-form-item :label="$t('cms.tag.slug')" prop="slug">
      <el-input v-model="form.slug" :placeholder="$t('cms.tag.slugTip')">
        <template #append>
          <el-button
            :icon="RefreshRight"
            @click="generateSlug"
            :title="$t('cms.tag.generateSlug')"
          />
        </template>
      </el-input>
      <div class="text-gray-400 text-xs mt-1">
        {{ $t("cms.tag.slugTip") }}
      </div>
    </el-form-item>

    <el-form-item :label="$t('cms.tag.description')" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        :placeholder="$t('cms.tag.description')"
      />
    </el-form-item>

    <el-form-item :label="$t('cms.tag.tagGroup')" prop="group">
      <div class="flex items-center gap-2">
        <el-select
          v-model="form.group"
          :placeholder="$t('cms.tag.selectTagGroup')"
          clearable
          filterable
          style="flex: 1"
          :loading="tagGroupLoading"
        >
          <el-option :label="$t('cms.tag.noGroup')" :value="null" />
          <el-option
            v-for="group in tagGroups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>
        <el-button
          :icon="Plus"
          @click="showNewGroupDialog = true"
          :title="$t('cms.tag.createNewGroup')"
        >
          {{ $t('cms.tag.newGroup') }}
        </el-button>
      </div>
      <div class="text-gray-400 text-xs mt-1">
        {{ $t("cms.tag.tagGroupTip") }}
      </div>
    </el-form-item>

    <el-form-item :label="$t('cms.tag.color')" prop="color">
      <el-color-picker v-model="form.color" show-alpha />
      <el-input v-model="form.color" placeholder="#RRGGBB" class="ml-2 w-40" />
      <div class="text-gray-400 text-xs mt-1">
        {{ $t("cms.tag.colorTip") }}
      </div>
    </el-form-item>

    <el-form-item :label="$t('cms.tag.isActive')" prop="is_active">
      <el-switch
        v-model="form.is_active"
        :active-value="true"
        :inactive-value="false"
        :active-text="$t('cms.tag.statusActive')"
        :inactive-text="$t('cms.tag.statusInactive')"
      />
    </el-form-item>
  </el-form>

  <!-- 新建标签组对话框 -->
  <el-dialog
    v-model="showNewGroupDialog"
    :title="$t('cms.tag.createNewGroup')"
    width="400px"
    :close-on-click-modal="false"
  >
    <el-form @submit.prevent="handleCreateNewGroup">
      <el-form-item :label="$t('cms.tag.groupName')">
        <el-input
          v-model="newGroupName"
          :placeholder="$t('cms.tag.enterGroupName')"
          @keyup.enter="handleCreateNewGroup"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showNewGroupDialog = false">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="newGroupLoading"
          @click="handleCreateNewGroup"
        >
          {{ $t('common.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, PropType, defineEmits, defineProps, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight, Plus } from "@element-plus/icons-vue";
import { Tag, TagCreateParams, TagUpdateParams, TagGroup } from "@/types/cms";
import { useCmsStore } from "@/store/modules/cms";
import { useI18n } from "vue-i18n";
import { slugify } from "@/utils/string";

const props = defineProps({
  tag: {
    type: Object as PropType<Tag>,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["submit", "cancel"]);
const formRef = ref();
const cmsStore = useCmsStore();
const { t } = useI18n();

// 标签组相关状态
const tagGroups = ref<TagGroup[]>([]);
const tagGroupLoading = ref(false);
const showNewGroupDialog = ref(false);
const newGroupName = ref("");
const newGroupLoading = ref(false);

// 表单数据
const form = reactive<TagCreateParams>({
  name: "",
  slug: "",
  description: "",
  group: null,
  color: "#409EFF",
  is_active: true
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: t("cms.tag.nameRequired"), trigger: "blur" },
    {
      min: 1,
      max: 50,
      message:
        t("cms.tag.nameLength", { min: 1, max: 50 }) || "长度在1到50个字符之间",
      trigger: "blur"
    }
  ],
  slug: [
    {
      pattern: /^[a-z0-9-]+$/,
      message: t("cms.tag.slugInvalid"),
      trigger: "blur"
    }
  ]
};

// 加载标签组列表
const loadTagGroups = async () => {
  tagGroupLoading.value = true;
  try {
    await cmsStore.fetchTagGroupList({ is_active: true });
    tagGroups.value = cmsStore.tagGroups.data || [];
    console.log("[TagForm] 加载标签组列表成功:", tagGroups.value);
  } catch (error) {
    console.error("[TagForm] 加载标签组列表失败:", error);
    ElMessage.error(t("cms.tag.loadTagGroupsFailed") || "加载标签组列表失败");
  } finally {
    tagGroupLoading.value = false;
  }
};

// 创建新标签组
const handleCreateNewGroup = async () => {
  if (!newGroupName.value.trim()) {
    ElMessage.warning(t("cms.tag.groupNameRequired") || "请输入标签组名称");
    return;
  }

  newGroupLoading.value = true;
  try {
    const response = await cmsStore.createTagGroup({
      name: newGroupName.value.trim(),
      is_active: true
    });
    
    if (response.success) {
      ElMessage.success(t("cms.tag.createGroupSuccess") || "创建标签组成功");
      // 重新加载标签组列表
      await loadTagGroups();
      // 自动选中新创建的标签组
      form.group = response.data.id;
      // 关闭对话框并重置
      showNewGroupDialog.value = false;
      newGroupName.value = "";
    }
  } catch (error) {
    console.error("[TagForm] 创建标签组失败:", error);
    ElMessage.error(t("cms.tag.createGroupFailed") || "创建标签组失败");
  } finally {
    newGroupLoading.value = false;
  }
};

// 初始化表单数据
const initForm = () => {
  if (props.tag) {
    form.name = props.tag.name;
    form.slug = props.tag.slug;
    form.description = props.tag.description || "";
    form.group = props.tag.group || null;
    form.color = props.tag.color || "#409EFF";
    form.is_active = props.tag.is_active;
  } else {
    form.name = "";
    form.slug = "";
    form.description = "";
    form.group = null;
    form.color = "#409EFF";
    form.is_active = true;
  }
};

// 根据名称生成别名
const generateSlug = () => {
  if (!form.name) {
    ElMessage.warning(t("cms.tag.nameRequired"));
    return;
  }

  form.slug = slugify(form.name);
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      emit("submit", form);
    }
  });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
    initForm();
  }
};

// 暴露方法给父组件
defineExpose({
  submitForm,
  resetForm,
  form
});

// 初始化
initForm();

// 组件挂载时加载标签组列表
onMounted(() => {
  loadTagGroups();
});
</script>

<style scoped>
.el-form {
  max-width: 600px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
