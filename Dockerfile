FROM node:20-bookworm-slim AS base

# ---- build the Vue 3 (Vite) frontend ----
FROM base AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ .
RUN npm run build

# ---- install backend (Express) production deps ----
FROM base AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

# ---- runtime image ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV SERVER_PORT=3000
ENV HOSTNAME=0.0.0.0

# Kept for parity with the previous image (no USER switch below, same as
# before) so the existing production named volume — created while the
# container ran as root — keeps working without a permissions migration.
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nodeuser

COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server
COPY --from=client-build /app/client/dist ./server/public

# Note: the app needs to write to the data directory (mounted as a volume in
# production), same as before.
RUN mkdir -p /app/data

# Seed files for a brand new/empty volume. Existing production volumes are
# untouched by this — Docker only uses image content to initialize a named
# volume the first time it is created.
COPY ramais.json /app/data/ramais.json
COPY ramais.json /app/ramais.json.seed
COPY descriptions.json /app/data/descriptions.json

EXPOSE 3000

CMD ["npm", "run", "start", "--prefix", "server"]
