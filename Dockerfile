# Dockerfile pro Express API
FROM node:18-alpine AS builder

WORKDIR /app

COPY apps/api/package*.json ./apps/api/
COPY package*.json ./
COPY prisma ./prisma/

RUN cd apps/api && npm ci

COPY apps/api ./apps/api/

RUN npx prisma generate

RUN cd apps/api && npm run build

FROM node:18-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER apiuser

EXPOSE 3000
ENV NODE_ENV production

CMD ["node", "dist/index.js"]