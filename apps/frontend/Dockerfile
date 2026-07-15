# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configs
COPY package.json yarn.lock tsconfig.json ./

# Copy workspace packages configs
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy frontend source code
COPY apps/frontend ./apps/frontend

# Build frontend
RUN yarn workspace frontend build

# --- Serve stage using Nginx ---
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy Nginx config for frontend on port 3035
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3035

CMD ["nginx", "-g", "daemon off;"]
