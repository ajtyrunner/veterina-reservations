# Dockerfile pro Express API
FROM node:18-alpine AS builder

WORKDIR /app

# Kopíruj package.json files
COPY apps/api/package*.json ./apps/api/
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies včetně dev dependencies pro build
RUN cd apps/api && npm ci

# Kopíruj zdrojové kódy
COPY apps/api ./apps/api/

# Generuj Prisma klienta
RUN npx prisma generate

# Build aplikace
RUN cd apps/api && npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Vytvoř non-root uživatele
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Kopíruj built aplikaci
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER apiuser

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

CMD ["node", "dist/index.js"] 