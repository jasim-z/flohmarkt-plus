#!/bin/bash
# Build and push Docker images to Docker Hub
# Usage: ./scripts/build-and-push.sh your-dockerhub-username

set -e

DOCKER_USERNAME=${1:-${DOCKER_USERNAME}}

if [ -z "$DOCKER_USERNAME" ]; then
  echo "Error: Docker Hub username required"
  echo "Usage: ./scripts/build-and-push.sh YOUR_DOCKERHUB_USERNAME"
  echo "   OR: export DOCKER_USERNAME=yourusername && ./scripts/build-and-push.sh"
  exit 1
fi

# Detect docker compose command (v1 or v2)
if command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
else
  echo "Error: docker-compose or docker compose not found"
  exit 1
fi

echo "🚀 Building and pushing images as $DOCKER_USERNAME..."
echo "📦 Using: $DOCKER_COMPOSE"

# Login to Docker Hub (if not already logged in)
echo "📦 Logging in to Docker Hub..."
docker login

# Setup buildx for multi-platform builds (if not exists)
echo "🔧 Setting up buildx..."
docker buildx create --use --name multiarch-builder 2>/dev/null || docker buildx use multiarch-builder

# Build and push images directly using buildx for linux/amd64 platform (EC2 compatible)
echo "🔨 Building and pushing images for linux/amd64 platform..."
echo "   This may take a while as it's cross-compiling from ARM64 to AMD64..."

docker buildx build --platform linux/amd64 --push \
  -t $DOCKER_USERNAME/flohmarkt-plus-auth:latest \
  -f apps/auth/Dockerfile \
  --target production .

docker buildx build --platform linux/amd64 --push \
  -t $DOCKER_USERNAME/flohmarkt-plus-listings:latest \
  -f apps/listings/Dockerfile \
  --target production .

docker buildx build --platform linux/amd64 --push \
  -t $DOCKER_USERNAME/flohmarkt-plus-markets:latest \
  -f apps/markets/Dockerfile \
  --target production .

docker buildx build --platform linux/amd64 --push \
  -t $DOCKER_USERNAME/flohmarkt-plus-messages:latest \
  -f apps/messages/Dockerfile \
  --target production .

docker buildx build --platform linux/amd64 --push \
  -t $DOCKER_USERNAME/flohmarkt-plus-frontend:latest \
  -f apps/frontend/Dockerfile \
  --target runner .

echo "✅ Done! Images pushed to Docker Hub"
echo ""
echo "📝 On EC2, run:"
echo "   export DOCKER_USERNAME=$DOCKER_USERNAME"
echo "   $DOCKER_COMPOSE -f docker-compose.prod.hub.yml pull"
echo "   $DOCKER_COMPOSE -f docker-compose.prod.hub.yml up -d"

