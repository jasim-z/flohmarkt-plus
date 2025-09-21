# Install dependencies only when needed
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Development stage
FROM node:20-alpine AS development
WORKDIR /app

# Install system dependencies for better performance
RUN apk add --no-cache curl

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with optimizations
# Use memory-efficient install with fallback
RUN pnpm install --frozen-lockfile --prefer-offline --no-optional || \
    pnpm install --no-optional || \
    pnpm install --no-optional --shamefully-hoist

# Copy source code
COPY . .

# Set environment variables for better performance
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start development server with optimizations
CMD ["pnpm", "dev"]

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm install -g pnpm && pnpm build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN npm install -g pnpm
COPY --from=builder /app .
EXPOSE 3000
CMD ["pnpm", "start"] 