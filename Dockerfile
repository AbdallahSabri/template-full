# syntax=docker/dockerfile:1
#
# Multi-stage build producing a minimal runtime image from Next.js's
# `output: 'standalone'` build. See docs/deploy-checklist.md for the
# Coolify service config (build-time vs runtime env var split) this
# Dockerfile expects.

FROM node:22-alpine AS base

# ---- deps: install dependencies (its own stage so it's cached
#      independently of app source changes) ----
FROM base AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts: the "prepare" script (husky) expects a .git directory,
# which isn't in the build context (see .dockerignore) and isn't needed
# to build/run the app — git hooks are a local-dev concern only.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- builder: run `next build` ----
FROM base AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Only NEXT_PUBLIC_* needs a real value here — it's baked into the client
# JS bundle at build time and can't change afterward. Everything else
# below is a placeholder: src/lib/env.ts validates required vars at
# module-import time, and `next build` evaluates that module graph while
# collecting page data even for routes that don't render statically, so a
# syntactically valid placeholder is enough to get through the build.
# Coolify injects the *real* DATABASE_URL/BETTER_AUTH_SECRET/
# BETTER_AUTH_URL at container runtime, and the standalone server.js reads
# process.env fresh when it boots — completely independent of whatever
# was baked in at build time. Don't "fix" this by making these build ARGs
# required; that defeats the point of build-time/runtime separation (see
# CLAUDE.md convention #7).
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ARG NEXT_PUBLIC_ASSET_BASE_URL
ENV NEXT_PUBLIC_ASSET_BASE_URL=${NEXT_PUBLIC_ASSET_BASE_URL}
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV BETTER_AUTH_SECRET="build-time-placeholder-overridden-at-runtime"
ENV BETTER_AUTH_URL="http://localhost:3000"

RUN pnpm build

# ---- runner: minimal production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output already contains a pruned node_modules with only
# what server.js needs — no separate `pnpm install` in this stage.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
