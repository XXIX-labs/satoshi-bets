FROM node:22-alpine AS base
RUN npm install -g pnpm@10.23.0
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
EXPOSE 3001
USER node
CMD ["node", "dist/index.js"]
