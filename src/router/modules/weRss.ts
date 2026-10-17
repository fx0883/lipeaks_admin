const Layout = () => import("@/layout/index.vue");

export default {
  path: "/we-rss",
  name: "WeRssManagement",
  component: Layout,
  redirect: "/we-rss/articles",
  meta: {
    icon: "ep/reading",
    title: "微信聚合",
    rank: 19
  },
  children: [
    {
      path: "/we-rss/articles",
      name: "WeRssArticles",
      component: () => import("@/views/we-rss/articles/index.vue"),
      meta: {
        title: "微信文章大厅"
      }
    },
    {
      path: "/we-rss/feeds",
      name: "WeRssFeeds",
      component: () => import("@/views/we-rss/feeds/index.vue"),
      meta: {
        title: "公众号订阅源"
      }
    },
    {
      path: "/we-rss/credentials",
      name: "WeRssCredentials",
      component: () => import("@/views/we-rss/credentials/index.vue"),
      meta: {
        title: "托管凭证管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
