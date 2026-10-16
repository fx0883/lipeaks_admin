declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "vue3-puzzle-vcode";

declare module "*.yaml" {
  const content: any;
  export default content;
}

declare module "*.yml" {
  const content: any;
  export default content;
}
