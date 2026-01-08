<template>
  <div class="notification-editor-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="handleBack">
        <template #content>
          <span class="page-title">
            {{ isEdit ? $t("notification.edit") : $t("notification.create") }}
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
        label-width="120px"
        label-position="right"
        style="max-width: 800px"
      >
        <!-- 基本信息 -->
        <el-divider content-position="left">{{ $t("notification.sections.basicInfo") }}</el-divider>

        <el-form-item :label="$t('notification.fields.title')" prop="title">
          <el-input
            v-model="form.title"
            :placeholder="$t('notification.placeholders.title')"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item :label="$t('notification.fields.content')" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :placeholder="$t('notification.placeholders.content')"
            :rows="8"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>

        <!-- 通知设置 -->
        <el-divider content-position="left">{{ $t("notification.sections.settings") }}</el-divider>

        <el-form-item :label="$t('notification.fields.scope')" prop="scope">
          <el-radio-group v-model="form.scope" @change="handleScopeChange">
            <el-radio
              v-for="opt in NOTIFICATION_SCOPE_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
              <el-tooltip :content="opt.description" placement="top">
                <el-icon class="tip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="form.scope === 'application'"
          :label="$t('notification.fields.application')"
          prop="application"
        >
          <el-select
            v-model="form.application"
            :placeholder="$t('notification.placeholders.selectApplication')"
            filterable
            style="width: 300px"
          >
            <el-option
              v-for="app in applications"
              :key="app.id"
              :label="app.name"
              :value="app.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('notification.fields.type')" prop="notification_type">
          <el-select v-model="form.notification_type" style="width: 200px">
            <el-option
              v-for="opt in NOTIFICATION_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('notification.fields.priority')" prop="priority">
          <el-select v-model="form.priority" style="width: 200px">
            <el-option
              v-for="opt in NOTIFICATION_PRIORITY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('notification.fields.sendEmail')">
          <el-switch v-model="form.send_email" />
          <span class="form-tip">{{ $t("notification.tips.sendEmail") }}</span>
        </el-form-item>

        <!-- 提示信息 -->
        <el-alert
          v-if="form.scope === 'members'"
          :title="$t('notification.tips.membersScope')"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ isEdit ? $t("common.save") : $t("common.create") }}
          </el-button>
          <el-button
            v-if="!isEdit"
            type="success"
            :loading="submitLoading"
            @click="handleSubmitAndPublish"
          >
            {{ $t("notification.actions.createAndPublish") }}
          </el-button>
          <el-button @click="handleBack">{{ $t("common.cancel") }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { QuestionFilled } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  useNotificationDetail,
  useNotificationActions
} from "@/composables/useNotification";
import { useApplicationSelector } from "@/composables/useApplication";
import {
  NOTIFICATION_SCOPE_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
  NOTIFICATION_PRIORITY_OPTIONS
} from "@/types/notification";
import type {
  NotificationScope,
  NotificationType,
  NotificationPriority,
  NotificationCreateParams
} from "@/types/notification";

const router = useRouter();
const route = useRoute();

// 判断是否编辑模式
const isEdit = computed(() => !!route.params.id);
const notificationId = computed(() => Number(route.params.id) || 0);

// 应用选择器
const { applications, fetchApplications } = useApplicationSelector(false);

// 通知详情（编辑时）
const { notification, loading: detailLoading, fetchDetail } = useNotificationDetail();

// 通知操作
const { create, update, publish } = useNotificationActions();

// 表单引用
const formRef = ref<FormInstance>();
const pageLoading = ref(false);
const submitLoading = ref(false);

// 表单数据
const form = reactive({
  title: "",
  content: "",
  scope: "tenant" as NotificationScope,
  application: null as number | null,
  notification_type: "info" as NotificationType,
  priority: "normal" as NotificationPriority,
  send_email: false
});

// 表单验证规则
const rules = computed<FormRules>(() => ({
  title: [
    { required: true, message: "请输入通知标题", trigger: "blur" },
    { max: 200, message: "标题不能超过200个字符", trigger: "blur" }
  ],
  content: [
    { required: true, message: "请输入通知内容", trigger: "blur" }
  ],
  scope: [
    { required: true, message: "请选择通知范围", trigger: "change" }
  ],
  application: form.scope === "application"
    ? [{ required: true, message: "请选择关联应用", trigger: "change" }]
    : []
}));

// 初始化
onMounted(async () => {
  await fetchApplications();

  if (isEdit.value && notificationId.value) {
    pageLoading.value = true;
    await fetchDetail(notificationId.value);
    if (notification.value) {
      // 填充表单
      form.title = notification.value.title;
      form.content = notification.value.content || "";
      form.scope = notification.value.scope;
      form.application = notification.value.application;
      form.notification_type = notification.value.notification_type;
      form.priority = notification.value.priority;
      form.send_email = notification.value.send_email;
    }
    pageLoading.value = false;
  }
});

/**
 * 范围变化处理
 */
const handleScopeChange = (scope: NotificationScope) => {
  if (scope !== "application") {
    form.application = null;
  }
};

/**
 * 返回列表
 */
const handleBack = () => {
  router.push("/notification/list");
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitLoading.value = true;

    const data: NotificationCreateParams = {
      title: form.title,
      content: form.content,
      scope: form.scope,
      application: form.scope === "application" ? form.application : null,
      notification_type: form.notification_type,
      priority: form.priority,
      send_email: form.send_email
    };

    let result;
    if (isEdit.value) {
      result = await update(notificationId.value, data);
    } else {
      result = await create(data);
    }

    if (result) {
      router.push("/notification/list");
    }

    submitLoading.value = false;
  });
};

/**
 * 创建并发布
 */
const handleSubmitAndPublish = async () => {
  if (!formRef.value) return;

  // 如果是 members 范围，提示需要先添加接收者
  if (form.scope === "members") {
    ElMessageBox.alert(
      "面向特定成员的通知需要先创建，然后在详情页添加接收者后再发布。",
      "提示",
      { type: "warning" }
    );
    return;
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      await ElMessageBox.confirm(
        "确定要创建并立即发布吗？发布后将无法编辑。",
        "发布确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      submitLoading.value = true;

      const data: NotificationCreateParams = {
        title: form.title,
        content: form.content,
        scope: form.scope,
        application: form.scope === "application" ? form.application : null,
        notification_type: form.notification_type,
        priority: form.priority,
        send_email: form.send_email
      };

      // 先创建
      const created = await create(data);
      if (created) {
        // 再发布
        const published = await publish(created.id);
        if (published) {
          router.push("/notification/list");
        }
      }

      submitLoading.value = false;
    } catch {
      // 用户取消
    }
  });
};
</script>

<style lang="scss" scoped>
.notification-editor-container {
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

    .tip-icon {
      margin-left: 4px;
      color: #909399;
      cursor: help;
    }

    .form-tip {
      margin-left: 12px;
      color: #909399;
      font-size: 12px;
    }
  }
}
</style>
