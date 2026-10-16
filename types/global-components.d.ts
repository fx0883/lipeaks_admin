import type { IconifyIcon } from "@iconify/types";
import type { iconType } from "../src/components/ReIcon/src/types";
import type { Component, DefineComponent, HTMLAttributes } from "vue";

type IconifyIconOfflineProps = {
  icon?: IconifyIcon | string | Component;
} & iconType &
  HTMLAttributes;

type IconifyIconOnlineProps = {
  icon?: string;
} & iconType &
  HTMLAttributes;

type FontIconProps = {
  icon?: string;
  /** `unicode` 引用模式 */
  uni?: boolean;
  /** `svg symbol` 引用模式 */
  svg?: boolean;
  iconType?: "uni" | "svg";
} & HTMLAttributes;

/** 权限控制组件公共 `Props` */
type AuthorityProps = {
  value?: string | string[];
};

declare module "vue" {
  /**
   * 自定义全局组件获得 `Volar` 提示
   */
  export interface GlobalComponents {
    IconifyIconOffline: DefineComponent<IconifyIconOfflineProps>;
    IconifyIconOnline: DefineComponent<IconifyIconOnlineProps>;
    FontIcon: DefineComponent<FontIconProps>;
    Auth: DefineComponent<AuthorityProps>;
    Perms: DefineComponent<AuthorityProps>;

    // Customer Management Components
    CustomerForm: (typeof import("../src/components/CustomerManagement"))["CustomerForm"];
    CustomerStatusTag: (typeof import("../src/components/CustomerManagement"))["CustomerStatusTag"];
    CustomerValueTag: (typeof import("../src/components/CustomerManagement"))["CustomerValueTag"];
    ContactPersonForm: (typeof import("../src/components/CustomerManagement"))["ContactPersonForm"];
    TenantLinkForm: (typeof import("../src/components/CustomerManagement"))["TenantLinkForm"];

    ElTableColumn: {
      new (): {
        $props: Record<string, any>;
        $slots: {
          default?: (scope: { row: any; $index: number; column: any; store: any; [key: string]: any }) => any;
          header?: (scope: { column: any; $index: number; store: any }) => any;
        };
      };
    };
  }

  interface ComponentCustomProperties {
    $storage: ResponsiveStorage;
    $config: PlatformConfigs;
    $message: (typeof import("element-plus"))["ElMessage"];
    $notify: (typeof import("element-plus"))["ElNotification"];
    $msgbox: (typeof import("element-plus"))["ElMessageBox"];
    $messageBox: (typeof import("element-plus"))["ElMessageBox"];
    $alert: (typeof import("element-plus"))["ElMessageBox"]["alert"];
    $confirm: (typeof import("element-plus"))["ElMessageBox"]["confirm"];
    $prompt: (typeof import("element-plus"))["ElMessageBox"]["prompt"];
    $loading: (typeof import("element-plus"))["ElLoadingService"];
  }
}

export {};
