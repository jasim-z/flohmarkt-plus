# EC2 Recovery Guide - CPU Throttling

## Immediate Actions

### Option 1: Stop Docker Build (if terminal works)
```bash
# Stop all Docker processes
docker ps -q | xargs docker stop 2>/dev/null
docker-compose -f docker-compose.prod.yml down

# Kill any running builds
pkill -f "docker build"
pkill -f "pnpm"
pkill -f "npm"

# Free memory
docker system prune -af --volumes
```

### Option 2: Reboot Instance (if terminal is unresponsive)
1. Go to AWS Console → EC2 → Instances
2. Select your instance
3. Actions → Instance State → Stop
4. Wait 5-10 minutes (allows CPU credits to replenish)
5. Actions → Instance State → Start
6. SSH back in

### Option 3: Upgrade Instance Type
The t3.micro is too small for building Docker images. Consider:
- **t3.small** (2 vCPU, 2GB RAM) - ~$15/month
- **t3.medium** (2 vCPU, 4GB RAM) - ~$30/month
- **t3.large** (2 vCPU, 8GB RAM) - ~$60/month

To upgrade:
1. Stop instance (not terminate!)
2. Actions → Instance Settings → Change Instance Type
3. Select larger type (t3.small minimum)
4. Start instance

## Alternative: Build Locally and Push Images

Instead of building on EC2, build on your local machine and push to Docker Hub or AWS ECR:

```bash
# On your local machine
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml push  # if using registry

# On EC2 - just pull and run
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Reduce Build Load on EC2

If you must build on EC2:
1. Build one service at a time
2. Increase swap space
3. Build during off-peak hours
4. Use `.dockerignore` to reduce build context

