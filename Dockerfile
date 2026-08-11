FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# We also need build tools for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++ 
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry is disabled
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Note: Since the app needs to write to the db directory, ensure it has permissions
RUN mkdir -p /app/data

# Copy the initial database so it works out-of-the-box (into data/ where permissions allow WAL creation)
COPY ramais.db /app/data/ramais.db
COPY ramais.db /app/ramais.db.seed

# better-sqlite3 native bindings need to be present
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
