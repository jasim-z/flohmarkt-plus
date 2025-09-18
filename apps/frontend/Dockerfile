# Use a smaller base image for dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm with minimal memory usage
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with minimal memory usage
ENV NODE_OPTIONS=--max-old-space-size=1024
ENV PNPM_NETWORK_CONCURRENCY=1
ENV PNPM_CHILD_CONCURRENCY=1
RUN pnpm install --frozen-lockfile --prefer-offline --no-optional --child-concurrency=1 --network-concurrency=1

# Development stage
FROM node:18-alpine AS development
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Install pnpm
RUN npm install -g pnpm@8

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Copy source code
COPY . .

# Set environment variables for better performance
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=false
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV PNPM_NETWORK_CONCURRENCY=1
ENV PNPM_CHILD_CONCURRENCY=1
ENV NEXT_TURBO=1

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start development server
CMD ["pnpm", "run", "dev"]

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
