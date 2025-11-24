# Multi-stage build for Market Pulse

# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY client/package.json ./client/

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile

# Copy source code
COPY client ./client
COPY shared ./shared
COPY tsconfig.json ./

# Build frontend
RUN pnpm --filter client build

# Stage 2: Build server
FROM node:22-alpine AS server-builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile --prod

# Copy server source
COPY server ./server
COPY drizzle ./drizzle
COPY shared ./shared
COPY storage ./storage
COPY tsconfig.json ./

# Stage 3: Production runtime
FROM node:22-alpine
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy production dependencies from builder
COPY --from=server-builder /app/node_modules ./node_modules

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy server code
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/drizzle ./drizzle
COPY --from=server-builder /app/shared ./shared
COPY --from=server-builder /app/storage ./storage
COPY --from=server-builder /app/tsconfig.json ./

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start server
CMD ["pnpm", "start"]
