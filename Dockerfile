# Dockerfile pro Express API
FROM node:18-alpine AS builder

WORKDIR /app

# Kopíruj pouze potřebné soubory pro instalaci
COPY apps/api/package*.json ./
COPY prisma ./prisma/

# Instaluj pouze produkční dependencies
RUN npm ci --only=production

# Kopíruj zdrojové kódy
COPY apps/api/src ./src/
COPY apps/api/tsconfig.json ./

# Generuj Prisma klienta
RUN npx prisma generate

# Build aplikace
RUN npm run build

# Production stage - použij stejný base image pro menší velikost
FROM node:18-alpine

WORKDIR /app

# Kopíruj pouze produkční soubory
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Nastav environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Spusť aplikaci
CMD ["node", "dist/index.js"] 