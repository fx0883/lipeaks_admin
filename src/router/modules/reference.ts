import { $t } from "@/plugins/i18n";
import ableRoutes from "../reference/able";
import aboutRoutes from "../reference/about";
import boardRoutes from "../reference/board";
import chataiRoutes from "../reference/chatai";
import codemirrorRoutes from "../reference/codemirror";
import componentRoutes from "../reference/components";
import editorRoutes from "../reference/editor";
import flowchartRoutes from "../reference/flowchart";
import formRoutes from "../reference/form";
import formdesignRoutes from "../reference/formdesign";
import ganttasticRoutes from "../reference/ganttastic";
import guideRoutes from "../reference/guide";
import listRoutes from "../reference/list";
import markdownRoutes from "../reference/markdown";
import menuoverflowRoutes from "../reference/menuoverflow";
import mindRoutes from "../reference/mind";
import nestedRoutes from "../reference/nested";
import pptRoutes from "../reference/ppt";
import resultRoutes from "../reference/result";
import tableRoutes from "../reference/table";
import vueflowRoutes from "../reference/vueflow";
import errorExampleRoutes from "../reference/errorExample";

export default {
  path: "/reference",
  redirect: "/components/dialog",
  meta: {
    icon: "ri/tools-line",
    title: $t("menus.pureDevReference") || "示例/开发参考",
    rank: 999
  },
  children: [
    componentRoutes,
    tableRoutes,
    formRoutes,
    formdesignRoutes,
    flowchartRoutes,
    vueflowRoutes,
    ganttasticRoutes,
    editorRoutes,
    markdownRoutes,
    codemirrorRoutes,
    chataiRoutes,
    ableRoutes,
    listRoutes,
    nestedRoutes,
    resultRoutes,
    guideRoutes,
    boardRoutes,
    pptRoutes,
    mindRoutes,
    aboutRoutes,
    menuoverflowRoutes,
    errorExampleRoutes
  ] as unknown as RouteChildrenConfigsTable[]
} satisfies RouteConfigsTable;
