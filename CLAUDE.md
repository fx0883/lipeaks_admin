# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`lipeaks-admin` is a Vue 3 + TypeScript admin dashboard based on the [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin) (i18n version) scaffold. It uses Vite, Element Plus, Pinia, Vue Router, Tailwind CSS v4, and vue-i18n. The backend API is Django REST Framework (DRF), exposed under `/api/v1/`.

- **Package manager**: pnpm (enforced via `preinstall` script)
- **Node version**: `v22.14.0` (see `.nvmrc`)
- **Default dev port**: `8848`
- **Default router mode**: hash (`VITE_ROUTER_HISTORY=hash`)
- **Build-script approvals**: `pnpm-workspace.yaml` lists `allowBuilds` for packages with native/postinstall scripts (`@parcel/watcher`, `@tailwindcss/oxide`, `esbuild`, `vue-demi`).

## Common Commands

All commands are defined in `package.json`. Use `pnpm`.

```bash
# Install dependencies
pnpm install

# Start dev server (port 8848 by default)
pnpm dev

# Production build
pnpm build

# Staging build
pnpm build:staging

# Build and serve dist locally
pnpm preview:build

# Type check (tsc + vue-tsc, no emit)
pnpm typecheck

# Lint and auto-fix everything
pnpm lint

# Lint individual layers
pnpm lint:eslint
pnpm lint:prettier
pnpm lint:stylelint

# Clean dependency cache and reinstall
pnpm clean:cache

# Bundle analyzer (outputs report.html)
pnpm report
```

There is **no test runner configured** in this project. A few `*.test.ts` files (e.g., `src/utils/string.test.ts`, `src/utils/errorSystem.test.ts`) are manual/debug scripts, not automated tests.

## Development Environment

- Use `.env.development` for local overrides. It defaults the API base to `http://localhost:8000/api/v1/`.
- `public/platform-config.json` is fetched at boot to configure UI theme, layout, i18n, and other runtime settings.

## Project Architecture

### Build Layer (`build/`)

Vite configuration is split out of `vite.config.ts` into the `build/` directory:

- `build/utils.ts` — path resolution, aliases (`@` → `src`, `@build` → `build`), env wrapper, and app metadata.
- `build/plugins.ts` — Vite plugin composition (Vue, JSX, i18n, Tailwind, mock server, SVG loader, CDN, compression, bundle analyzer, console removal). The CDN plugin is lazy-loaded via `getCdnPlugin()` so it is only instantiated when `VITE_CDN=true`.
- `build/optimize.ts` — `optimizeDeps.include`/`exclude` lists.
- `build/info.ts` — custom build-time banner and package-size reporting.
- `build/cdn.ts`, `build/compress.ts` — CDN replacement and gzip/brotli compression options.

### Routing

Routes are a mix of **static** and **backend-driven dynamic** routes.

- Static routes live in `src/router/modules/` and are auto-imported via `import.meta.glob(["./modules/**/*.ts", "!./modules/**/remaining.ts"], { eager: true })`.
- `src/router/modules/remaining.ts` holds routes that should not appear in menus (login, redirect, article preview, article import/export).
- Dynamic routes are fetched from `/menus/admin/routes/` (`src/api/routes.ts`) after login and merged in by `initRouter()` in `src/router/utils.ts`.
- `src/router/utils.ts` contains the core routing logic: flattening nested routes, re-parenting routes deeper than two levels for `keep-alive`, role filtering, and component resolution against `import.meta.glob("/src/views/**/*.{vue,tsx}")`.
- Layout shell: `src/layout/index.vue`. IFrame wrapper: `src/layout/frame.vue`.

### State Management

Pinia is set up in `src/store/index.ts`. Stores are in `src/store/modules/`:

- `user.ts` — login/logout, token handling, current admin profile.
- `permission.ts` — menu generation from static + dynamic routes, keep-alive cache.
- `multiTags.ts` — tab state.
- `app.ts`, `settings.ts`, `epTheme.ts`, `menu.ts` — UI/layout/theme state.
- Domain stores: `tenant.ts`, `customer.ts`, `member.ts`, `order.ts`, `application.ts`, `license.ts`, `cms.ts`, `adminUser.ts`.

Use the exported hook helpers (e.g., `useUserStoreHook()`) rather than calling `useUserStore()` directly outside setup.

### HTTP Client

`src/utils/http/index.ts` exports a singleton `http` instance of the `PureHttp` class wrapping Axios.

- Base URL defaults to `import.meta.env.VITE_BASE_API` or `http://43.142.76.105:8000/api/v1`.
- Sends `Authorization: Bearer <access_token>` for all routes except `/auth/login/`.
- Reads CSRF token from `csrftoken` cookie and sends it as `X-CSRFTOKEN`.
- Auto-refreshes access tokens on `401` via `src/utils/http/tokenManager.ts`.
- Normalizes non-standard DRF responses into `{ success, code, message, data }`.
- Domain API modules are in `src/api/modules/`.

### Auth & Permissions

- Tokens are stored in both a cookie (`authorized-token`) and `localStorage` (`user-info`). A second cookie (`multiple-tabs`) lets the app stay logged in across tabs until the browser is fully closed.
- `src/utils/auth.ts` provides `getToken`, `setToken`, `removeToken`, `hasPerms`.
- Page-level permissions use `meta.roles` on routes; button-level permissions use `meta.auths` on the current route plus the global `permissions` array.
- Components `ReAuth` and `RePerms` plus directives `v-auth` and `v-perms` handle UI-level permission gating.

### Internationalization

- Translations are YAML files in `locales/` (`zh-CN.yaml`, `en.yaml`).
- `src/plugins/i18n.ts` creates the vue-i18n instance, merges Element Plus locales, and provides `transformI18n` and `$t` helpers.
- `$t()` is a no-op identity helper used only for i18n Ally IDE hints; runtime translation goes through `transformI18n` or `i18n.global.t`.

### Components

- `src/components/` contains reusable UI components and domain-specific component folders (`License/`, `OrderManagement/`, `CustomerManagement/`, etc.).
- `src/components/index.ts` registers selected components globally (`svg-icon`, order-management components, etc.).
- `Re*` prefixed components (`ReDialog`, `ReIcon`, `ReAuth`, `RePerms`, `RePureTableBar`, etc.) come from the pure-admin scaffold.

### Styling

- Tailwind CSS v4 is imported in `src/main.ts` via `src/style/tailwind.css`.
- Global styles: `src/style/index.scss`, `src/style/reset.scss`, `src/style/element-plus.scss`, `src/style/dark.scss`, `src/style/sidebar.scss`, `src/style/transition.scss`.
- Sass is available; PostCSS config is minimal and only enables `cssnano` in production.

### Mock Server

`vite-plugin-fake-server` serves files under `mock/` during development and production builds. Existing mocks: `mock/asyncRoutes.ts`, `mock/login.ts`, `mock/refreshToken.ts`.

## Key Files to Know

| File | Purpose |
|------|---------|
| `vite.config.ts` | Main Vite config, delegates to `build/` |
| `src/main.ts` | App bootstrap, plugin registration, global components/directives |
| `src/App.vue` | Root template with `el-config-provider`, `router-view`, `ReDialog` |
| `src/router/index.ts` | Router instance, guards, route reset |
| `src/router/utils.ts` | Dynamic route handling and route utility functions |
| `src/store/index.ts` | Pinia setup |
| `src/utils/http/index.ts` | Axios wrapper and interceptors |
| `src/utils/http/tokenManager.ts` | Access/refresh token lifecycle |
| `src/config/index.ts` | Loads `public/platform-config.json` and exposes `getConfig` |
| `src/utils/responsive.ts` | Injects `responsive-storage` with platform defaults |
| `public/platform-config.json` | Runtime UI configuration |
| `.env.development` | Local dev environment variables |
| `.env.production` | Production environment variables |
| `pnpm-workspace.yaml` | pnpm workspace config including allowed package build scripts |

## Linting & Formatting

- **ESLint**: flat config in `eslint.config.js`. Uses `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`, Prettier integration. Key notes:
  - `no-explicit-any` is off.
  - `consistent-type-imports` is enforced with inline type imports.
  - Vue files require self-closing tags (`vue/html-self-closing`).
- **Prettier**: configured in `.prettierrc.js`.
- **Stylelint**: configured in `stylelint.config.js`, supports Vue/SCSS, ignores Tailwind/at-rules and `deep`/`global` pseudo-selectors.
- **Commitlint**: conventional commits in `commitlint.config.js`; allowed types include `feat`, `fix`, `perf`, `style`, `docs`, `test`, `refactor`, `build`, `ci`, `chore`, `revert`, `wip`, `workflow`, `types`, `release`.
- Husky + lint-staged are enabled via `prepare`.

## TypeScript Notes

- `tsconfig.json` has `strict: false` and `strictFunctionTypes: false`.
- Path mapping: `@/*` → `src/*`, `@build/*` → `build/*`.
- Global types are declared in `types/index.d.ts` and `types/global.d.ts`.
- `vue-tsc --skipLibCheck` is used for type checking.

## Deployment Notes

- Production builds target `es2015`, output to `dist/` with assets under `static/`.
- `VITE_CDN` toggles CDN replacement of local libraries.
- `VITE_COMPRESSION` controls gzip/brotli/both/none (with `-clear` variants to remove original files).
- The current `.env.production` points the API to `https://backend.compressx.online/api/v1/`.
