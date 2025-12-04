/**
 * useFeedbackNotification Composable
 * 封装反馈通知配置相关的数据获取和操作逻辑
 */

import { ref, reactive } from "vue";
import type { Ref } from "vue";
import {
  getNotificationConfigList,
  createNotificationConfig,
  getNotificationConfigDetail,
  updateNotificationConfig,
  deleteNotificationConfig,
  getNotificationRecipients,
  addNotificationRecipient,
  updateNotificationRecipient,
  deleteNotificationRecipient,
  sendTestNotification,
  getNotificationConfigByApplication
} from "@/api/modules/feedback";
import type {
  FeedbackNotificationConfig,
  NotificationRecipient,
  NotificationConfigListParams,
  NotificationConfigCreateParams,
  NotificationConfigUpdateParams,
  RecipientCreateParams,
  RecipientUpdateParams,
  TestNotificationParams
} from "@/types/feedback";
import { message } from "@/utils/message";
import logger from "@/utils/logger";

/**
 * 通知配置列表 Composable
 */
export function useNotificationConfigList(initialParams?: NotificationConfigListParams) {
  const configs = ref<FeedbackNotificationConfig[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  });

  // 查询参数
  const params = reactive<NotificationConfigListParams>({
    page: 1,
    page_size: 20,
    ...initialParams
  });

  /**
   * 获取配置列表
   */
  const fetchConfigs = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getNotificationConfigList(params);

      logger.debug("通知配置列表API响应", response);

      if (response.success && response.data) {
        // 处理自定义分页响应
        if (response.data.results && Array.isArray(response.data.results)) {
          configs.value = response.data.results;

          // 提取分页信息
          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 20;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            // 兼容 DRF 格式
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 20;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (Array.isArray(response.data)) {
          // 如果直接是数组
          configs.value = response.data;
          pagination.total = response.data.length;
          pagination.page = params.page || 1;
          pagination.pageSize = params.page_size || 20;
        } else {
          logger.warn("通知配置列表数据格式异常", response.data);
          configs.value = [];
        }

        logger.debug("获取通知配置列表成功", {
          count: configs.value.length,
          total: pagination.total
        });
      } else {
        throw new Error(response.message || "获取通知配置列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取通知配置列表失败";
      logger.error("获取通知配置列表失败", err);
      message(error.value, { type: "error" });
      configs.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新列表
   */
  const refresh = () => {
    fetchConfigs();
  };

  /**
   * 更新查询参数
   */
  const updateParams = (newParams: Partial<NotificationConfigListParams>) => {
    Object.assign(params, newParams);
    params.page = 1; // 重置到第一页
    fetchConfigs();
  };

  /**
   * 翻页
   */
  const changePage = (page: number) => {
    params.page = page;
    fetchConfigs();
  };

  /**
   * 修改每页数量
   */
  const changePageSize = (size: number) => {
    params.page_size = size;
    params.page = 1;
    fetchConfigs();
  };

  return {
    configs,
    loading,
    error,
    pagination,
    params,
    fetchConfigs,
    refresh,
    updateParams,
    changePage,
    changePageSize
  };
}

/**
 * 通知配置操作 Composable
 */
export function useNotificationConfigActions() {
  const loading = ref(false);

  /**
   * 创建配置
   */
  const create = async (data: NotificationConfigCreateParams) => {
    loading.value = true;

    try {
      const response = await createNotificationConfig(data);

      if (response.success && response.data) {
        message("创建成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "创建失败");
      }
    } catch (err: any) {
      message(err.message || "创建失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新配置
   */
  const update = async (id: number, data: NotificationConfigUpdateParams) => {
    loading.value = true;

    try {
      const response = await updateNotificationConfig(id, data);

      if (response.success && response.data) {
        message("更新成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (err: any) {
      message(err.message || "更新失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除配置
   */
  const remove = async (id: number) => {
    loading.value = true;

    try {
      const response = await deleteNotificationConfig(id);

      if (response.success) {
        message("删除成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "删除失败");
      }
    } catch (err: any) {
      message(err.message || "删除失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 切换启用状态
   */
  const toggleEnabled = async (id: number, enabled: boolean) => {
    try {
      const response = await updateNotificationConfig(id, { is_enabled: enabled });

      if (response.success) {
        message(enabled ? "已启用" : "已禁用", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "操作失败");
      }
    } catch (err: any) {
      message(err.message || "操作失败", { type: "error" });
      return false;
    }
  };

  return {
    loading,
    create,
    update,
    remove,
    toggleEnabled
  };
}

/**
 * 接收者管理 Composable
 */
export function useNotificationRecipients(configId: Ref<number> | number) {
  const recipients = ref<NotificationRecipient[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取配置ID
   */
  const getConfigId = () => {
    return typeof configId === "number" ? configId : configId.value;
  };

  /**
   * 获取接收者列表
   */
  const fetchRecipients = async () => {
    const id = getConfigId();
    if (!id) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await getNotificationRecipients(id);

      logger.debug("接收者列表API响应", response);

      if (response.success && response.data) {
        // 处理多种数据格式
        const data = response.data as any;
        if (Array.isArray(data)) {
          recipients.value = data;
        } else if (data.data && Array.isArray(data.data)) {
          // 嵌套格式: { data: [...] }
          recipients.value = data.data;
        } else if (data.results && Array.isArray(data.results)) {
          // 分页格式: { results: [...] }
          recipients.value = data.results;
        } else {
          logger.warn("接收者数据格式异常", response.data);
          recipients.value = [];
        }
        logger.debug("获取接收者列表成功", { count: recipients.value.length });
      } else {
        throw new Error(response.message || "获取接收者失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取接收者失败";
      logger.error("获取接收者失败", err);
      recipients.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 添加接收者
   */
  const add = async (data: RecipientCreateParams) => {
    const id = getConfigId();
    if (!id) return false;

    loading.value = true;

    try {
      const response = await addNotificationRecipient(id, data);

      if (response.success && response.data) {
        // 处理可能的嵌套格式
        const resData = response.data as any;
        const recipient = resData.data || resData;
        recipients.value.push(recipient);
        message("添加成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "添加失败");
      }
    } catch (err: any) {
      message(err.message || "添加失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新接收者
   */
  const update = async (recipientId: number, data: RecipientUpdateParams) => {
    const id = getConfigId();
    if (!id) return false;

    loading.value = true;

    try {
      const response = await updateNotificationRecipient(id, recipientId, data);

      if (response.success && response.data) {
        // 处理可能的嵌套格式
        const resData = response.data as any;
        const recipient = resData.data || resData;
        // 更新本地数据
        const index = recipients.value.findIndex(r => r.id === recipientId);
        if (index !== -1) {
          recipients.value[index] = recipient;
        }
        message("更新成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (err: any) {
      message(err.message || "更新失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除接收者
   */
  const remove = async (recipientId: number) => {
    const id = getConfigId();
    if (!id) return false;

    loading.value = true;

    try {
      const response = await deleteNotificationRecipient(id, recipientId);

      if (response.success) {
        // 从本地移除
        recipients.value = recipients.value.filter(r => r.id !== recipientId);
        message("删除成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "删除失败");
      }
    } catch (err: any) {
      message(err.message || "删除失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 切换接收者启用状态
   */
  const toggleActive = async (recipientId: number, isActive: boolean) => {
    return await update(recipientId, { is_active: isActive });
  };

  /**
   * 发送测试邮件
   */
  const sendTest = async (data: TestNotificationParams) => {
    const id = getConfigId();
    if (!id) return false;

    loading.value = true;

    try {
      const response = await sendTestNotification(id, data);

      if (response.success) {
        message("测试邮件发送成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "发送失败");
      }
    } catch (err: any) {
      message(err.message || "发送失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    recipients,
    loading,
    error,
    fetchRecipients,
    add,
    update,
    remove,
    toggleActive,
    sendTest
  };
}
