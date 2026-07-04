FROM node:22-alpine AS builder
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace apps/api --include-workspace-root=false
COPY apps/api apps/api
RUN npm run build --workspace apps/api

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace apps/api --include-workspace-root=false --omit=dev
COPY --from=builder /repo/apps/api/dist apps/api/dist
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
