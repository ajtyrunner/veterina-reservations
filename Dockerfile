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

# Copy API source, excluding test files and scripts
COPY apps/api/src ./apps/api/src/
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/package*.json ./apps/api/

# Remove test and development files
RUN rm -rf apps/api/src/routes/test-auth.ts && \
    rm -rf apps/api/src/scripts/

# Generate Prisma Client to root node_modules
RUN npx prisma generate

# Create directories if they don't exist
RUN mkdir -p apps/api/node_modules/.prisma && \
    mkdir -p apps/api/node_modules/@prisma

# Copy generated Prisma Client to API node_modules
RUN cp -r node_modules/.prisma/client apps/api/node_modules/.prisma/ && \
    cp -r node_modules/@prisma/client apps/api/node_modules/@prisma/

# Build API
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