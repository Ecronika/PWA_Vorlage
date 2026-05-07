# ── Stage 1: Build ──────────────────────────────────
FROM node:lts-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────
FROM caddy:alpine AS runner
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
