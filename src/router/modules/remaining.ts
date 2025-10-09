import { $t } from "@/plugins/i18n";
const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: $t("common.loading"),
      showLink: false,
      rank: 102
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  {
    path: "/preview/article/:id",
    name: "ArticlePreview",
    component: () => import("@/views/cms/article/detail.vue"),
    meta: {
      title: $t("cms.article.articleDetail"),
      showLink: false,
      rank: 103
    }
  },
  {
    path: "/cms/article/import",
    name: "ArticleImport",
    component: () => import("@/views/cms/article/import.vue"),
    meta: {
      title: $t("cms.article.import"),
      showLink: false,
      rank: 104
    }
  },
  {
    path: "/cms/article/export",
    name: "ArticleExport",
    component: () => import("@/views/cms/article/export.vue"),
    meta: {
      title: "导出文章",
      showLink: false,
      rank: 105
    }
  }
] satisfies Array<RouteConfigsTable>;
