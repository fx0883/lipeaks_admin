/**
 * useNotification Composable
 * 封装通知管理相关的数据获取和操作逻辑
 */

import { ref, reactive, computed } from "vue";
import type { Ref, ComputedRef } from "vue";
import {
  getNotificationList,
  createNotification,
  getNotificationDetail,
  updateNotification,
  deleteNotification,
  publishNotification,
  archiveNotification,
  getNotificationRecipients,
  addNotificationRecipients,
  removeNotificationRecipients,
  getNotificationStatistics
} from "@/api/modules/notification";
import type {
  Notification,
  NotificationRecipient,
  NotificationStatistics,
  NotificationListParams,
  NotificationCreateParams,
  NotificationUpdateParams,
  NotificationRecipientListParams,
  NotificationRecipientsParams
} from "@/types/notification";
import { message } from "@/utils/message";
import logger from "@/utils/logger";

/**
 * 通知列表 Composable
 */
export function useNotificationList(initialParams?: NotificationListParams) {
  const notifications = ref<Notification[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  // 查询参数
  const params = reactive<NotificationListParams>({
    page: 1,
    page_size: 10,
    ...initialParams
  });

  /**
   * 获取通知列表
   */
  const fetchNotifications = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getNotificationList(params);

      logger.debug("通知列表API响应", response);

      if (response.success && response.data) {
        // 处理分页响应
        if (response.data.results && Array.isArray(response.data.results)) {
          notifications.value = response.data.results;

          // 提取分页信息
          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 10;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            // 兼容 DRF 格式
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 10;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (Array.isArray(response.data)) {
          notifications.value = response.data;
          pagination.total = response.data.length;
        } else {
          logger.warn("通知列表数据格式异常", response.data);
          notifications.value = [];
        }

        logger.debug("获取通知列表成功", {
          count: notifications.value.length,
          total: pagination.total
        });
      } else {
        throw new Error(response.message || "获取通知列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取通知列表失败";
      logger.error("获取通知列表失败", err);
      message(error.value, { type: "error" });
      notifications.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新列表
   */
  const refresh = () => {
    fetchNotifications();
  };

  /**
   * 更新查询参数
   */
  const updateParams = (newParams: Partial<NotificationListParams>) => {
    Object.assign(params, newParams);
    params.page = 1; // 重置到第一页
    fetchNotifications();
  };

  /**
   * 翻页
   */
  const changePage = (page: number) => {
    params.page = page;
    fetchNotifications();
  };

  /**
   * 修改每页数量
   */
  const changePageSize = (size: number) => {
    params.page_size = size;
    params.page = 1;
    fetchNotifications();
  };

  /**
   * 重置筛选条件
   */
  const resetFilters = () => {
    params.application = undefined;
    params.scope = undefined;
    params.status = undefined;
    params.type = undefined;
    params.priority = undefined;
    params.page = 1;
    fetchNotifications();
  };

  return {
    notifications,
    loading,
    error,
    pagination,
    params,
    fetchNotifications,
    refresh,
    updateParams,
    changePage,
    changePageSize,
    resetFilters
  };
}

/**
 * 通知详情 Composable
 */
export function useNotificationDetail(notificationId?: Ref<number> | ComputedRef<number>) {
  const notification = ref<Notification | null>(null);
  const statistics = ref<NotificationStatistics | null>(null);
  const loading = ref(false);
  const statisticsLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取通知详情
   */
  const fetchDetail = async (id?: number) => {
    const targetId = id || notificationId?.value;
    if (!targetId) {
      error.value = "缺少通知ID";
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await getNotificationDetail(targetId);

      if (response.success && response.data) {
        notification.value = response.data;
        logger.debug("获取通知详情成功", notification.value);
      } else {
        throw new Error(response.message || "获取通知详情失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取通知详情失败";
      logger.error("获取通知详情失败", err);
      message(error.value, { type: "error" });
      notification.value = null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取通知统计
   */
  const fetchStatistics = async (id?: number) => {
    const targetId = id || notificationId?.value;
    if (!targetId) return;

    statisticsLoading.value = true;

    try {
      const response = await getNotificationStatistics(targetId);

      if (response.success && response.data) {
        statistics.value = response.data;
        logger.debug("获取通知统计成功", statistics.value);
      } else {
        throw new Error(response.message || "获取通知统计失败");
      }
    } catch (err: any) {
      logger.error("获取通知统计失败", err);
      statistics.value = null;
    } finally {
      statisticsLoading.value = false;
    }
  };

  /**
   * 刷新详情和统计
   */
  const refresh = async (id?: number) => {
    await Promise.all([fetchDetail(id), fetchStatistics(id)]);
  };

  return {
    notification,
    statistics,
    loading,
    statisticsLoading,
    error,
    fetchDetail,
    fetchStatistics,
    refresh
  };
}

/**
 * 通知操作 Composable
 */
export function useNotificationActions() {
  const loading = ref(false);

  /**
   * 创建通知
   */
  const create = async (data: NotificationCreateParams): Promise<Notification | null> => {
    loading.value = true;

    try {
      const response = await createNotification(data);

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
   * 更新通知
   */
  const update = async (
    id: number,
    data: NotificationUpdateParams
  ): Promise<Notification | null> => {
    loading.value = true;

    try {
      const response = await updateNotification(id, data);

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
   * 删除通知
   */
  const remove = async (id: number): Promise<boolean> => {
    loading.value = true;

    try {
      const response = await deleteNotification(id);

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
   * 发布通知
   */
  const publish = async (id: number): Promise<Notification | null> => {
    loading.value = true;

    try {
      const response = await publishNotification(id);

      if (response.success && response.data) {
        message("发布成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "发布失败");
      }
    } catch (err: any) {
      message(err.message || "发布失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 归档通知
   */
  const archive = async (id: number): Promise<Notification | null> => {
    loading.value = true;

    try {
      const response = await archiveNotification(id);

      if (response.success && response.data) {
        message("归档成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "归档失败");
      }
    } catch (err: any) {
      message(err.message || "归档失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    create,
    update,
    remove,
    publish,
    archive
  };
}

/**
 * 通知接收者管理 Composable
 */
export function useNotificationRecipients(notificationId: Ref<number> | ComputedRef<number>) {
  const recipients = ref<NotificationRecipient[]>([]);
  const loading = ref(false);
  const actionLoading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  const params = reactive<NotificationRecipientListParams>({
    page: 1,
    page_size: 10
  });

  /**
   * 获取接收者列表
   */
  const fetchRecipients = async () => {
    if (!notificationId.value) return;

    loading.value = true;
    error.value = null;

    try {
      logger.debug("请求接收者列表", { notificationId: notificationId.value, params });
      const response = await getNotificationRecipients(notificationId.value, params);
      logger.debug("接收者列表API响应", response);

      if (response.success && response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          recipients.value = response.data.results;

          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 10;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            // DRF 标准分页格式
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 10;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (Array.isArray(response.data)) {
          recipients.value = response.data;
          pagination.total = response.data.length;
        }

        logger.debug("获取接收者列表成功", {
          count: recipients.value.length,
          total: pagination.total,
          page: pagination.page,
          pageSize: pagination.pageSize,
          hasNext: pagination.hasNext
        });
      } else {
        throw new Error(response.message || "获取接收者列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取接收者列表失败";
      logger.error("获取接收者列表失败", err);
      recipients.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 添加接收者
   */
  const addRecipients = async (memberIds: number[]): Promise<boolean> => {
    if (!notificationId.value || memberIds.length === 0) return false;

    actionLoading.value = true;

    try {
      const response = await addNotificationRecipients(notificationId.value, {
        member_ids: memberIds
      });

      if (response.success) {
        message(response.data?.detail || `成功添加 ${memberIds.length} 个接收者`, {
          type: "success"
        });
        await fetchRecipients();
        return true;
      } else {
        throw new Error(response.message || "添加接收者失败");
      }
    } catch (err: any) {
      message(err.message || "添加接收者失败", { type: "error" });
      return false;
    } finally {
      actionLoading.value = false;
    }
  };

  /**
   * 移除接收者
   */
  const removeRecipients = async (memberIds: number[]): Promise<boolean> => {
    if (!notificationId.value || memberIds.length === 0) return false;

    actionLoading.value = true;

    try {
      const response = await removeNotificationRecipients(notificationId.value, {
        member_ids: memberIds
      });

      if (response.success) {
        message(response.data?.detail || `成功移除 ${memberIds.length} 个接收者`, {
          type: "success"
        });
        await fetchRecipients();
        return true;
      } else {
        throw new Error(response.message || "移除接收者失败");
      }
    } catch (err: any) {
      message(err.message || "移除接收者失败", { type: "error" });
      return false;
    } finally {
      actionLoading.value = false;
    }
  };

  /**
   * 翻页
   */
  const changePage = (page: number) => {
    params.page = page;
    pagination.page = page; // 同步更新 UI 状态
    fetchRecipients();
  };

  /**
   * 修改每页数量
   */
  const changePageSize = (size: number) => {
    params.page_size = size;
    params.page = 1;
    pagination.pageSize = size; // 同步更新 UI 状态
    pagination.page = 1;
    fetchRecipients();
  };

  /**
   * 刷新
   */
  const refresh = () => {
    fetchRecipients();
  };

  return {
    recipients,
    loading,
    actionLoading,
    error,
    pagination,
    params,
    fetchRecipients,
    addRecipients,
    removeRecipients,
    changePage,
    changePageSize,
    refresh
  };
}
