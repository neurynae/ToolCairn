# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig/

# Copy all package.json files (needed for workspace resolution)
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/graph/package.json ./packages/graph/
COPY packages/queue/package.json ./packages/queue/
COPY packages/search/package.json ./packages/search/
COPY packages/vector/package.json ./packages/vector/
COPY packages/tools/package.json ./packages/tools/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @toolpilot/db exec prisma generate

# Build all packages in dependency order
RUN pnpm --filter @toolpilot/config build && \
    pnpm --filter @toolpilot/core build && \
    pnpm --filter @toolpilot/db build && \
    pnpm --filter @toolpilot/graph build && \
    pnpm --filter @toolpilot/queue build && \
    pnpm --filter @toolpilot/search build && \
    pnpm --filter @toolpilot/vector build && \
    pnpm --filter @toolpilot/tools build && \
    pnpm --filter @toolpilot/api build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig/

# Copy package.json files
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/graph/package.json ./packages/graph/
COPY packages/queue/package.json ./packages/queue/
COPY packages/search/package.json ./packages/search/
COPY packages/vector/package.json ./packages/vector/
COPY packages/tools/package.json ./packages/tools/
COPY apps/api/package.json ./apps/api/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built output from builder
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/graph/dist ./packages/graph/dist
COPY --from=builder /app/packages/queue/dist ./packages/queue/dist
COPY --from=builder /app/packages/search/dist ./packages/search/dist
COPY --from=builder /app/packages/vector/dist ./packages/vector/dist
COPY --from=builder /app/packages/tools/dist ./packages/tools/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "apps/api/dist/index.js"]
