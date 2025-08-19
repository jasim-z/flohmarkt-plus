# Frontend Performance Optimization Guide

## 🚀 Performance Issues Fixed

### 1. **Container Stability Issues**
- **Problem**: Frontend container exiting every 4-5 clicks
- **Root Cause**: Memory leaks, resource constraints, and inefficient file watching
- **Solution**: Resource limits, health checks, and optimized configurations

### 2. **Memory Management**
- **Problem**: Large bundle size (829 modules) causing memory pressure
- **Solution**: Memory limits, chunk splitting, and garbage collection optimization

### 3. **File Watching Optimization**
- **Problem**: Inefficient file watching in Docker environment
- **Solution**: Optimized webpack watch options and ignored patterns

## 🛠️ Implemented Solutions

### **Next.js Configuration (`next.config.ts`)**
```typescript
// Performance optimizations
experimental: {
  workerThreads: false,
  cpus: 1,
  optimizePackageImports: ['react-icons', '@radix-ui/react-icons'],
}

// Webpack optimizations
webpack: (config, { dev, isServer }) => {
  if (dev && !isServer) {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/dist/**',
      ],
    };
    
    // Reduce memory usage with chunk splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
  }
}
```

### **Docker Compose Optimization (`docker-compose.yml`)**
```yaml
frontend:
  environment:
    - NODE_OPTIONS=--max-old-space-size=2048
    - NEXT_TELEMETRY_DISABLED=1
  
  deploy:
    resources:
      limits:
        memory: 2G
        cpus: '1.0'
      reservations:
        memory: 1G
        cpus: '0.5'
  
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### **Dockerfile Optimization (`Dockerfile`)**
```dockerfile
# Install system dependencies for better performance
RUN apk add --no-cache curl

# Install dependencies with optimizations
RUN pnpm install --frozen-lockfile --prefer-offline

# Set environment variables for better performance
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### **Package Scripts Optimization (`package.json`)**
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 --turbo",
    "dev:optimized": "NODE_OPTIONS='--max-old-space-size=2048' next dev -H 0.0.0.0 --turbo",
    "clean": "rm -rf .next out",
    "type-check": "tsc --noEmit"
  }
}
```

## 📊 Performance Monitoring

### **Health Check Endpoint (`/api/health`)**
- Container health monitoring
- Memory usage tracking
- Uptime monitoring
- Docker health check integration

### **Monitoring Script (`scripts/monitor-frontend.sh`)**
```bash
# Features:
- Container status monitoring
- Memory and CPU usage tracking
- Error log monitoring
- Automatic container restart
- Performance metrics logging
```

## 🔧 Usage Instructions

### **1. Start Optimized Frontend**
```bash
# Use optimized development script
docker-compose up frontend

# Or run with optimized settings
docker-compose exec frontend pnpm run dev:optimized
```

### **2. Monitor Performance**
```bash
# Run monitoring script
./scripts/monitor-frontend.sh

# Check container stats
docker stats ordering-app-frontend-1

# View health check
curl http://localhost:3000/api/health
```

### **3. Clean and Rebuild**
```bash
# Clean build cache
docker-compose exec frontend pnpm run clean

# Rebuild container
docker-compose build --no-cache frontend
docker-compose up frontend
```

## 📈 Expected Performance Improvements

### **Before Optimization**
- ❌ Container exits every 4-5 clicks
- ❌ 10+ second compilation times
- ❌ Memory leaks and crashes
- ❌ No resource monitoring
- ❌ Inefficient file watching

### **After Optimization**
- ✅ Stable container operation
- ✅ 2-5 second compilation times
- ✅ Memory usage capped at 2GB
- ✅ Real-time performance monitoring
- ✅ Optimized file watching
- ✅ Automatic container restart
- ✅ Health checks and alerts

## 🚨 Troubleshooting

### **Container Still Exiting**
1. Check memory usage: `docker stats ordering-app-frontend-1`
2. View logs: `docker-compose logs frontend`
3. Run monitoring script: `./scripts/monitor-frontend.sh`
4. Check health endpoint: `curl http://localhost:3000/api/health`

### **High Memory Usage**
1. Clean build cache: `pnpm run clean`
2. Restart container: `docker-compose restart frontend`
3. Check for memory leaks in logs
4. Increase memory limit in docker-compose.yml

### **Slow Compilation**
1. Use turbo mode: `pnpm run dev:optimized`
2. Check ignored files in .dockerignore
3. Monitor CPU usage
4. Optimize webpack configuration

## 🔄 Maintenance

### **Weekly Tasks**
- Review performance logs
- Clean build caches
- Update dependencies
- Monitor resource usage

### **Monthly Tasks**
- Review and optimize webpack config
- Update Docker base images
- Performance benchmarking
- Configuration tuning

## 📚 Additional Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/advanced-features/performance)
- [Docker Performance Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Webpack Optimization Guide](https://webpack.js.org/guides/build-performance/)
- [Node.js Memory Management](https://nodejs.org/en/docs/guides/memory-management/) 