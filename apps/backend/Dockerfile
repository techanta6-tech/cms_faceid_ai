FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configs
COPY package.json yarn.lock tsconfig.json ./

# Copy workspace packages configs
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install all dependencies (development + production)
RUN yarn install --frozen-lockfile

# Copy backend source code and prisma folder
COPY apps/backend ./apps/backend

# Generate Prisma clients and build the backend NestJS app
RUN yarn workspace backend build

# --- Production runner image ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copy root configs
COPY package.json yarn.lock tsconfig.json ./

# Copy backend config
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built dist files from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy generated Prisma clients and schemas
COPY --from=builder /app/apps/backend/generated ./apps/backend/generated
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Expose backend port
EXPOSE 3000

# Start NestJS backend in production mode
CMD ["yarn", "workspace", "backend", "start:prod"]
