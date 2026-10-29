# Production image (docs/07 > Deployment architecture). Targets:
#   migrate  one-shot: apply migrations and seed the first organizer
#   runner   the Next.js standalone server
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json prisma7.config.ts ./
COPY prisma ./prisma
# postinstall runs `prisma generate` into src/generated/prisma
RUN npm ci

FROM deps AS build
COPY . .
# The build never connects to these; real values come from .env at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    AUTH_SECRET="build-only-placeholder" \
    AUTH_URL="http://localhost:3000" \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM build AS migrate
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    UPLOAD_DIR=/app/uploads
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
# Event images (src/lib/uploads). docker-compose.prod.yml mounts the "uploads"
# volume here; a new volume copies this directory's owner, so nextjs can write.
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
