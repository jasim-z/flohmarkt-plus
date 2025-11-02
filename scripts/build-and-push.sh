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

# Build images
echo "🔨 Building images..."
$DOCKER_COMPOSE -f docker-compose.prod.yml build

# Tag images for Docker Hub
echo "🏷️  Tagging images..."
docker tag flohmarkt-plus-auth $DOCKER_USERNAME/flohmarkt-plus-auth:latest
docker tag flohmarkt-plus-listings $DOCKER_USERNAME/flohmarkt-plus-listings:latest
docker tag flohmarkt-plus-markets $DOCKER_USERNAME/flohmarkt-plus-markets:latest
docker tag flohmarkt-plus-messages $DOCKER_USERNAME/flohmarkt-plus-messages:latest
docker tag flohmarkt-plus-frontend $DOCKER_USERNAME/flohmarkt-plus-frontend:latest

# Push to Docker Hub
echo "📤 Pushing images to Docker Hub..."
docker push $DOCKER_USERNAME/flohmarkt-plus-auth:latest
docker push $DOCKER_USERNAME/flohmarkt-plus-listings:latest
docker push $DOCKER_USERNAME/flohmarkt-plus-markets:latest
docker push $DOCKER_USERNAME/flohmarkt-plus-messages:latest
docker push $DOCKER_USERNAME/flohmarkt-plus-frontend:latest

echo "✅ Done! Images pushed to Docker Hub"
echo ""
echo "📝 On EC2, run:"
echo "   export DOCKER_USERNAME=$DOCKER_USERNAME"
echo "   $DOCKER_COMPOSE -f docker-compose.prod.hub.yml pull"
echo "   $DOCKER_COMPOSE -f docker-compose.prod.hub.yml up -d"

