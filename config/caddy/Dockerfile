# One image that both builds the two web frontends and serves them (INC-032).
#
# They are static files, so giving each its own runtime container would cost memory for nothing.
# Caddy serves both site roots and proxies each site's /api/* to api-gateway.
#
# Build context is the REPOSITORY ROOT, not this directory: both apps depend on workspace
# packages (@busmate/ui, @busmate/api-client-*) that live outside their own folders.

# ── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS web-builder

RUN corepack enable
WORKDIR /repo

COPY . .

# Only these two apps and their workspace dependencies. A bare `pnpm install` would also pull the
# Expo apps' React Native toolchains, which this image neither needs nor can use.
RUN pnpm install --frozen-lockfile \
    --filter "@busmate/passenger-web..." \
    --filter "@busmate/new-react-portal..."

# Vite inlines these at build time — they are baked into the bundle, so they are build args, not
# runtime environment. Each app's API base is its OWN origin (see Caddyfile: same-origin keeps the
# portal's SameSite=Lax session cookie working and avoids CORS).
ARG PASSENGER_WEB_ORIGIN=https://busmate.site
ARG PORTAL_ORIGIN=https://portal.busmate.site
ARG VITE_GOOGLE_MAPS_API_KEY=""

# Written as files rather than passed as shell env so the value is unambiguous: a stray .env in the
# build context can no longer win, and the bundle's API base is exactly what was asked for.
RUN printf 'VITE_API_GATEWAY_URL=%s\nVITE_GOOGLE_MAPS_API_KEY=%s\n' \
        "$PASSENGER_WEB_ORIGIN" "$VITE_GOOGLE_MAPS_API_KEY" \
        > apps/frontend/passenger-web/.env.production.local \
 && printf 'VITE_API_GATEWAY_URL=%s\nVITE_GEMINI_ENABLED=true\n' \
        "$PORTAL_ORIGIN" \
        > apps/frontend/new-react-portal/.env.production.local

RUN pnpm --filter @busmate/passenger-web build \
 && pnpm --filter @busmate/new-react-portal build

# ── Runtime stage ───────────────────────────────────────────────────────────
FROM caddy:2-alpine

COPY --from=web-builder /repo/apps/frontend/passenger-web/dist /srv/passenger-web
COPY --from=web-builder /repo/apps/frontend/new-react-portal/dist /srv/portal
COPY config/caddy/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
