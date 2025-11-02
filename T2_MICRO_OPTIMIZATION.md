# t2.micro Optimization Guide

## Problem
t2.micro instances have very limited resources:
- 1 vCPU (burst-based with credits)
- 1GB RAM
- Can throttle under load, causing unresponsiveness

## Quick Fixes

### 1. Stop Services When Not Needed
```bash
# Stop all services to free resources
docker compose -f docker-compose.prod.hub.yml down

# Start only essential services
docker compose -f docker-compose.prod.hub.yml up -d auth rabbitmq frontend
```

### 2. Check Resource Usage
```bash
# Check Docker container stats
docker stats --no-stream

# Check system resources
free -h
df -h
top
```

### 3. Clean Up Docker
```bash
# Remove unused Docker resources
docker system prune -af

# Remove unused volumes
docker volume prune -f
```

### 4. Use Commands That Don't Block
When working with t2.micro, avoid commands that keep the terminal busy:

❌ **Don't use:**
```bash
docker compose logs -f  # Blocks terminal
docker stats            # Continuously updates
```

✅ **Use instead:**
```bash
docker compose logs --tail=50  # Shows last 50 lines and exits
docker stats --no-stream       # Shows stats once and exits
```

### 5. Optimize Health Checks
Health checks are now configured to run less frequently to reduce load.

### 6. Consider Upgrading Instance Type

**Option 1: Upgrade to t3.small** (~$15/month)
- 2 vCPU (always available)
- 2GB RAM
- Much better performance

**How to upgrade:**
1. AWS Console → EC2 → Your Instance
2. Instance State → Stop
3. Actions → Instance Settings → Change Instance Type
4. Select **t3.small**
5. Start instance

**Option 2: Use EC2 Instance Connect**
Instead of SSH, use AWS Console's EC2 Instance Connect for faster access:
1. AWS Console → EC2 → Your Instance
2. Connect → EC2 Instance Connect
3. Click Connect

### 7. Reduce Running Services

If you only need the frontend for demos:
```bash
# Stop backend services, keep only frontend
docker compose -f docker-compose.prod.hub.yml stop auth listings markets messages

# When needed, start them
docker compose -f docker-compose.prod.hub.yml start auth listings markets messages
```

## Current Resource Limits (Optimized)

- **Auth, Listings, Markets, Messages**: 256MB RAM, 0.5 CPU each
- **Frontend**: 512MB RAM, 0.75 CPU
- **RabbitMQ**: 256MB RAM, 0.5 CPU

**Total**: ~1.8GB RAM (may exceed t2.micro's 1GB, but Docker will swap)
**Total CPU**: ~3.25 CPUs (will throttle, but limits prevent complete overload)

## Best Practices for t2.micro

1. ✅ Run only essential services
2. ✅ Use resource limits (already configured)
3. ✅ Monitor resource usage regularly
4. ✅ Clean up Docker regularly
5. ✅ Use non-blocking commands
6. ✅ Consider upgrading for production use
7. ✅ Use EC2 Instance Connect instead of SSH when SSH is slow

## Monitoring Script

Create a simple monitoring script:

```bash
#!/bin/bash
# monitor.sh
echo "=== Docker Stats ==="
docker stats --no-stream
echo ""
echo "=== System Memory ==="
free -h
echo ""
echo "=== Disk Usage ==="
df -h
echo ""
echo "=== Container Status ==="
docker compose -f docker-compose.prod.hub.yml ps
```

Run with: `bash monitor.sh` (won't block terminal)

