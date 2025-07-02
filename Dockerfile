# Dockerfile pro Express API v Railway prostředí
FROM node:18-alpine AS builder

WORKDIR /app

# Kopíruj package.json soubory
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Kopíruj Prisma schema a konfiguraci
COPY prisma ./prisma/

# Instaluj dependencies v apps/api
WORKDIR /app/apps/api
RUN npm ci

# Kopíruj zdrojové kódy API
COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./

# Generuj Prisma Client (důležité: jsme v /app/apps/api)
RUN cd ../.. && npx prisma generate

# Build aplikace
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Vytvoř non-root uživatele
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Kopíruj Prisma schema a konfiguraci (potřebné pro runtime)
COPY --from=builder /app/prisma ./prisma/

# Kopíruj built aplikaci a dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules

# Kopíruj vygenerovaný Prisma Client
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Nastav práva pro apiuser
RUN chown -R apiuser:nodejs /app

# Přepni na non-root uživatele
USER apiuser

# Railway očekává port 3000
EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

# Spusť aplikaci
CMD ["node", "dist/index.js"] 