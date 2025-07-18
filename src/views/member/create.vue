<template>
  <div class="member-create-container">
    <div class="page-header">
      <div class="left">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          {{ $t("common.back") }}
        </el-button>
        <h2>{{ $t("member.createMember") }}</h2>
      </div>
    </div>

    <el-card class="form-card">
      <MemberForm
        :loading="loading"
        :show-tenant-select="false"
        @submit="handleSubmit"
        @cancel="goBack"
      />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useMemberStoreHook } from "@/store/modules/member";
import { MemberForm } from "@/components/MemberManagement";
import type { MemberCreateUpdateParams } from "@/types/member";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const memberStore = useMemberStoreHook();

// 加载状态
const loading = ref(false);

// 处理表单提交
const handleSubmit = async (data: MemberCreateUpdateParams) => {
  loading.value = true;
  try {
    const response = await memberStore.createNewMember(data);
    ElMessage.success(t("member.createSuccess"));

    // 创建成功后跳转到详情页
    if (response.data?.id) {
      router.push(`/member/detail/${response.data.id}`);
    } else {
      // 如果没有返回ID，则跳转到列表页
      router.push("/member/index");
    }
  } catch (error: any) {
    logger.error("创建会员失败", error);

    // 从错误对象中提取错误信息
    if (error) {
      // 显示格式化后的错误消息
      ElMessage.error(error.message || t("member.createFailed"));

      // 特殊处理字段级错误，提供更具体的反馈
      if (error.errors) {
        // 用户名重复错误特殊处理
        if (error.errors.username) {
          ElMessage({
            message: `${t("member.usernameError")}: ${error.errors.username.join(", ")}`,
            type: "warning",
            duration: 5000
          });
        }

        // 密码相关错误
        if (error.errors.password || error.errors.non_field_errors) {
          const passwordErrors =
            error.errors.password || error.errors.non_field_errors;
          if (Array.isArray(passwordErrors)) {
            ElMessage({
              message: passwordErrors.join(", "),
              type: "warning",
              duration: 5000
            });
          }
        }
      }
    } else {
      ElMessage.error(t("member.createFailed"));
    }
  } finally {
    loading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};
</script>

<style scoped>
.member-create-container {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header .left {
  display: flex;
  align-items: center;
}

.page-header h2 {
  margin: 0 0 0 16px;
  font-size: 20px;
  font-weight: 500;
}

.form-card {
  margin-bottom: 16px;
}
</style>
