# Dockerfile pro Express API
FROM node:18-alpine AS builder

# Nastav pracovní adresář na /app/api
WORKDIR /app/api

# Kopíruj package.json a prisma schema
COPY apps/api/package*.json ./
COPY prisma ../../prisma/

# Instaluj dependencies
RUN npm ci

# Kopíruj zdrojové kódy
COPY apps/api/src ./src/
COPY apps/api/tsconfig.json ./

# Generuj Prisma klienta
RUN npx prisma generate

# Build aplikace
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app/api

# Kopíruj pouze produkční soubory
COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/api/node_modules ./node_modules
COPY --from=builder /app/api/node_modules/.prisma ./node_modules/.prisma

# Nastav environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Spusť aplikaci
CMD ["node", "dist/index.js"] 