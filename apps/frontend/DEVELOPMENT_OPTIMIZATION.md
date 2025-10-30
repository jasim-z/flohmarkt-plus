# Frontend Development Optimization Guide

## Problem
The frontend was restarting frequently during development, causing:
- Slow development experience
- Interrupted workflows
- Excessive resource usage
- Poor developer experience

## Root Causes
1. **Excessive file watching**: The entire `./apps/frontend` directory was mounted, causing Next.js to watch unnecessary files
2. **Polling enabled**: File watching was using polling mode which is resource-intensive
3. **Missing optimizations**: Next.js configuration wasn't optimized for Docker development
4. **Build artifacts in watch scope**: `.next`, `node_modules`, and other build directories were being watched

## Solutions Implemented

### 1. Docker Volume Optimization
**Before:**
```yaml
volumes:
  - ./apps/frontend:/app  # Mounts entire directory
  - /app/node_modules
  - /app/.next
```

**After:**
```yaml
volumes:
  # Mount only source files, not build artifacts
  - ./apps/frontend/src:/app/src
  - ./apps/frontend/public:/app/public
  - ./apps/frontend/package.json:/app/package.json
  - ./apps/frontend/pnpm-lock.yaml:/app/pnpm-lock.yaml
  - ./apps/frontend/next.config.ts:/app/next.config.ts
  - ./apps/frontend/tsconfig.json:/app/tsconfig.json
  - ./apps/frontend/tailwind.config.js:/app/tailwind.config.js
  - ./apps/frontend/postcss.config.js:/app/postcss.config.js
  # Exclude node_modules and build directories
  - /app/node_modules
  - /app/.next
  - /app/.turbo
  - /app/dist
  - /app/coverage
```

### 2. Environment Variables
```yaml
environment:
  - WATCHPACK_POLLING=false
  - CHOKIDAR_USEPOLLING=false
  - TURBO_FORCE=true
  - NEXT_WATCH_IGNORE="node_modules,\.next,\.git,dist,coverage"
```

### 3. Next.js Configuration Optimizations
```typescript
// Disabled polling for file watching
config.watchOptions = {
  poll: false,
  aggregateTimeout: 600,
  ignored: [
    '**/node_modules/**',
    '**/.git/**',
    '**/.next/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/logs/**',
    '**/tmp/**',
    '**/*.log',
  ],
};

// Disabled source maps for better performance
config.optimization = {
  devtool: false,
  stats: 'minimal',
  // ... other optimizations
};
```

### 4. Development Scripts
Added optimized development script:
```json
{
  "scripts": {
    "dev:stable": "NODE_OPTIONS='--max-old-space-size=2048' WATCHPACK_POLLING=false CHOKIDAR_USEPOLLING=false next dev -H 0.0.0.0 --turbo"
  }
}
```

### 5. Docker Ignore File
Created `.dockerignore` to exclude unnecessary files from Docker build context:
- Build outputs (`.next`, `dist`, `build`)
- Dependencies (`node_modules`)
- Cache directories (`.turbo`, `.cache`)
- Log files and temporary files

## Results
- ✅ **Reduced restart frequency**: Frontend now runs stably without frequent restarts
- ✅ **Faster compilation**: Optimized webpack configuration reduces build time
- ✅ **Lower resource usage**: Disabled polling and unnecessary file watching
- ✅ **Better developer experience**: Stable development environment
- ✅ **Faster hot reload**: Only watches relevant source files

## Monitoring
To monitor the frontend service:
```bash
# Check service status
docker compose ps frontend

# View logs
docker compose logs frontend -f

# Check resource usage
docker stats flohmarkt-plus-frontend-1
```

## Troubleshooting
If you still experience issues:

1. **Clear Next.js cache:**
   ```bash
   docker compose exec frontend pnpm clean
   ```

2. **Rebuild the container:**
   ```bash
   docker compose build --no-cache frontend
   docker compose up frontend
   ```

3. **Check file permissions:**
   ```bash
   docker compose exec frontend ls -la /app
   ```

4. **Monitor file watching:**
   ```bash
   docker compose logs frontend | grep -i "watch\|change"
   ```
