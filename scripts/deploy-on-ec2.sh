#!/bin/bash
# Quick deployment script for EC2
# Usage: ./scripts/deploy-on-ec2.sh your-dockerhub-username

set -e

DOCKER_USERNAME=${1:-${DOCKER_USERNAME}}

if [ -z "$DOCKER_USERNAME" ]; then
  echo "❌ Error: Docker Hub username required"
  echo "Usage: ./scripts/deploy-on-ec2.sh YOUR_DOCKERHUB_USERNAME"
  exit 1
fi

# Detect docker compose command
if command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
else
  echo "❌ Error: docker-compose or docker compose not found"
  exit 1
fi

echo "🚀 Deploying on EC2 as $DOCKER_USERNAME..."

# Export DOCKER_USERNAME for docker-compose
export DOCKER_USERNAME=$DOCKER_USERNAME

# Login to Docker Hub (if needed)
echo "📦 Checking Docker Hub login..."
if ! docker info | grep -q "Username"; then
  echo "Please login to Docker Hub:"
  docker login
fi

# Pull images
echo "⬇️  Pulling images from Docker Hub..."
$DOCKER_COMPOSE -f docker-compose.prod.hub.yml pull

# Stop existing services
echo "🛑 Stopping existing services..."
$DOCKER_COMPOSE -f docker-compose.prod.hub.yml down 2>/dev/null || true

# Start services
echo "▶️  Starting services..."
$DOCKER_COMPOSE -f docker-compose.prod.hub.yml up -d

# Wait a bit for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "📊 Service Status:"
$DOCKER_COMPOSE -f docker-compose.prod.hub.yml ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Check logs with:"
echo "   $DOCKER_COMPOSE -f docker-compose.prod.hub.yml logs -f"
echo ""
echo "🏥 Health checks:"
echo "   curl http://localhost:3950/health  # Auth"
echo "   curl http://localhost:3952/health  # Listings"
echo "   curl http://localhost:3953/health  # Markets"
echo "   curl http://localhost:3954/health  # Messages"
echo "   curl http://localhost:3000/api/health  # Frontend"

