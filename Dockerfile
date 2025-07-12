# Dockerfile pro Express API
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY prisma ./prisma/

# Install all dependencies without postinstall
RUN npm ci --ignore-scripts

# Install API dependencies
RUN cd apps/api && npm ci

COPY apps/api ./apps/api/

# Generate Prisma Client to root node_modules (as in development)
RUN npx prisma generate

# Create symlinks so API can find Prisma Client
RUN cd apps/api && \
    ln -s ../../node_modules/.prisma node_modules/.prisma && \
    ln -s ../../node_modules/@prisma node_modules/@prisma

# Build API (now it can find Prisma Client via symlinks)
RUN cd apps/api && npx tsc

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