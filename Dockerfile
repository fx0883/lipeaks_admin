FROM node:22-alpine AS build-stage

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

RUN npm config set registry https://registry.npmmirror.com

COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

COPY . .
RUN pnpm run build:docker

FROM nginx:stable-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8848

CMD ["nginx", "-g", "daemon off;"]
