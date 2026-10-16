import { http } from "@/utils/http";
import { ApiResponse, LoginResponseData, RefreshTokenResponseData, UserInfo } from "@/types/api";

export type { UserInfo };
export type UserResult = ApiResponse<LoginResponseData>;
export type RefreshTokenResult = ApiResponse<RefreshTokenResponseData>;

export type UserInfoResult = {
  code: number;
  message: string;
  data: UserInfo;
};

export type ResultTable = {
  code: number;
  message: string;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/auth/login/", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/auth/refresh/", { data });
};

/** 账户设置-个人信息 */
export const getMine = (data?: object) => {
  return http.request<UserInfoResult>("get", "/mine", { data });
};

/** 账户设置-个人安全日志 */
export const getMineLogs = (data?: object) => {
  return http.request<ResultTable>("get", "/mine-logs", { data });
};

