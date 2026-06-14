# Multi-stage Dockerfile for Next.js (production)
FROM node:18-bullseye AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci  --include=dev --no-audit --no-fund 

FROM node:18-bullseye AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time public envs (baked into client bundle)
ARG NEXT_PUBLIC_BACKEND_HTTP_BASE
ARG NEXT_PUBLIC_BACKEND_WS_BASE
ENV NEXT_PUBLIC_BACKEND_HTTP_BASE=${NEXT_PUBLIC_BACKEND_HTTP_BASE}
ENV NEXT_PUBLIC_BACKEND_WS_BASE=${NEXT_PUBLIC_BACKEND_WS_BASE}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# RUN npx prisma migrate reset --force

RUN npx prisma db push --force-reset
RUN npx prisma generate
RUN npm run build

FROM node:18-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.moz/standalone ./
COPY --from=builder /app/.moz/static ./.moz/static

EXPOSE 3000
EXPOSE 5555
CMD ["node", "server.js"]
