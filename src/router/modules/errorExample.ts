import { $t } from "@/plugins/i18n";

export default {
  path: "/error-example",
  name: "ErrorExample",
  component: () => import("@/utils/errorService.example.vue"),
  meta: {
    icon: "ri/bug-line",
    title: "错误处理示例",
    showLink: import.meta.env.DEV, // 只在开发环境显示
    rank: 99
  }
} satisfies RouteConfigsTable;
