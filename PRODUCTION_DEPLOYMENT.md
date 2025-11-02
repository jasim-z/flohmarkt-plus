# Production Deployment Guide

## Prerequisites

1. AWS EC2 instance running (t3.micro or higher recommended)
2. Docker and Docker Compose installed
3. MongoDB Atlas M0 cluster created
4. Secrets files prepared in `./secrets/` directory

## Environment Variables Setup

Create a `.env.production` file in the project root with the following variables:

```bash
# ============================================
# MongoDB Configuration
# ============================================
# Store MongoDB URI in: secrets/mongodb_uri.txt
# Format: mongodb+srv://username:password@cluster.mongodb.net/database

# ============================================
# JWT Secret
# ============================================
# Store JWT secret in: secrets/jwt_secret.txt

# ============================================
# Frontend API URLs (NEXT_PUBLIC_*)
# ============================================
# These URLs will be used by the browser and need to be publicly accessible
# Update these after setting up Cloudflare Tunnel or Nginx

# For local/testing (before HTTPS setup):
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3950
NEXT_PUBLIC_API_URL=http://localhost:3953
NEXT_PUBLIC_MESSAGES_API_URL=http://localhost:3954
NEXT_PUBLIC_LISTINGS_API_URL=http://localhost:3952
NEXT_PUBLIC_USERS_API_URL=http://localhost:3950
NEXT_PUBLIC_MESSAGES_WS_URL=http://localhost:3954

# After Cloudflare Tunnel setup, use HTTPS URLs:
# NEXT_PUBLIC_AUTH_API_URL=https://auth.your-tunnel-domain.trycloudflare.com
# NEXT_PUBLIC_API_URL=https://markets.your-tunnel-domain.trycloudflare.com
# NEXT_PUBLIC_MESSAGES_API_URL=https://messages.your-tunnel-domain.trycloudflare.com
# NEXT_PUBLIC_LISTINGS_API_URL=https://listings.your-tunnel-domain.trycloudflare.com
# NEXT_PUBLIC_USERS_API_URL=https://auth.your-tunnel-domain.trycloudflare.com
# NEXT_PUBLIC_MESSAGES_WS_URL=wss://messages.your-tunnel-domain.trycloudflare.com

# ============================================
# RabbitMQ Configuration (optional)
# ============================================
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin

# ============================================
# Node Environment
# ============================================
NODE_ENV=production
```

## Secrets Files

Ensure these files exist in `./secrets/` directory:

1. **`secrets/jwt_secret.txt`** - JWT secret key (any random string)
2. **`secrets/mongodb_uri.txt`** - MongoDB Atlas connection URI

Example:
```bash
mkdir -p secrets
echo "your-jwt-secret-key-here" > secrets/jwt_secret.txt
echo "mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority" > secrets/mongodb_uri.txt
```

## Building and Running Production Services

### On EC2 Instance:

```bash
# 1. Navigate to project directory
cd /opt/flohmarkt-plus

# 2. Ensure .env.production exists
# Create it using the template above

# 3. Build production images
docker compose -f docker-compose.prod.yml build

# 4. Start services
docker compose -f docker-compose.prod.yml up -d

# 5. Check status
docker compose -f docker-compose.prod.yml ps

# 6. View logs
docker compose -f docker-compose.prod.yml logs -f
```

## Service Ports

- **Frontend**: `3000` (Next.js)
- **Auth**: `3950`
- **Listings**: `3952`
- **Markets**: `3953`
- **Messages**: `3954`
- **RabbitMQ Management UI**: `15672`
- **RabbitMQ AMQP**: `5673`

## Health Checks

All services have health checks configured:
- **Backend services**: `/health` endpoint
- **Frontend**: `/api/health` endpoint

Check service health:
```bash
# Individual service
curl http://localhost:3950/health
curl http://localhost:3000/api/health

# All services via docker
docker compose -f docker-compose.prod.yml ps
```

## Differences from Development

1. **No volume mounts** - Code is baked into images
2. **Production Dockerfile targets** - Uses optimized production builds
3. **No hot-reload** - Services need to be rebuilt to update code
4. **Health checks enabled** - Docker monitors service availability
5. **Optimized resource usage** - Lower memory footprint
6. **Restart policies** - Services auto-restart on failure

## Updating Services

To update services:

```bash
# 1. Pull latest code
git pull

# 2. Rebuild images
docker compose -f docker-compose.prod.yml build

# 3. Restart services
docker compose -f docker-compose.prod.yml up -d

# 4. Check logs
docker compose -f docker-compose.prod.yml logs -f
```

## Troubleshooting

### Services won't start
- Check logs: `docker compose -f docker-compose.prod.yml logs <service-name>`
- Verify `.env.production` exists and has required variables
- Verify secrets files exist: `ls -la secrets/`

### Out of memory
- Check resource usage: `free -h` and `df -h`
- Consider upgrading EC2 instance size
- Reduce `NODE_OPTIONS=--max-old-space-size` values

### Connection errors
- Verify MongoDB URI is correct
- Check MongoDB Atlas IP whitelist includes EC2 instance IP
- Verify all services can reach each other via Docker network

## Next Steps

1. Set up **Cloudflare Tunnel** for HTTPS without domain
2. Or set up **Nginx** reverse proxy with **Certbot** for HTTPS
3. Update `.env.production` with public HTTPS URLs
4. Configure domain (optional)
5. Set up monitoring and backups

