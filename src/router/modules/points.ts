const Layout = () => import("@/layout/index.vue");

export default {
  path: "/points",
  name: "PointsManagement",
  component: Layout,
  redirect: "/points/overview",
  meta: {
    icon: "ep/coin",
    title: "积分成长",
    rank: 18
  },
  children: [
    {
      path: "/points/overview",
      name: "PointsOverview",
      component: () => import("@/views/points/overview/index.vue"),
      meta: {
        title: "积分监控大屏"
      }
    },
    {
      path: "/points/levels",
      name: "PointsLevels",
      component: () => import("@/views/points/levels/index.vue"),
      meta: {
        title: "成长权益梯队"
      }
    },
    {
      path: "/points/records",
      name: "PointsRecords",
      component: () => import("@/views/points/records/index.vue"),
      meta: {
        title: "积分收支流水"
      }
    }
  ]
} satisfies RouteConfigsTable;
