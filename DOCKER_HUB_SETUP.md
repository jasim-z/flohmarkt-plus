# Docker Hub Setup Guide

## Overview
Build Docker images locally on your Mac (powerful), push to Docker Hub, then EC2 only pulls and runs them.

## Step 1: Create Docker Hub Account (if you don't have one)
1. Go to https://hub.docker.com/signup
2. Create free account
3. Create a repository (public is free) for each service OR use one repo with tags

## Step 2: Login to Docker Hub

```bash
# On your Mac
docker login
# Enter your Docker Hub username and password
```

## Step 3: Build and Push Images Locally

On your Mac, from the project root:

```bash
# Set your Docker Hub username (replace 'yourusername' with your actual username)
export DOCKER_USERNAME=yourusername

# Build all images
docker-compose -f docker-compose.prod.yml build

# Tag images for Docker Hub
docker tag flohmarkt-plus-auth $DOCKER_USERNAME/flohmarkt-plus-auth:latest
docker tag flohmarkt-plus-listings $DOCKER_USERNAME/flohmarkt-plus-listings:latest
docker tag flohmarkt-plus-markets $DOCKER_USERNAME/flohmarkt-plus-markets:latest
docker tag flohmarkt-plus-messages $DOCKER_USERNAME/flohmarkt-plus-messages:latest
docker tag flohmarkt-plus-frontend $DOCKER_USERNAME/flohmarkt-plus-frontend:latest

# Push to Docker Hub
docker push $DOCKER_USERNAME/flohmarkt-plus-auth:latest
docker push $DOCKER_USERNAME/flohmarkt-plus-listings:latest
docker push $DOCKER_USERNAME/flohmarkt-plus-markets:latest
docker push $DOCKER_USERNAME/flohmarkt-plus-messages:latest
docker push $DOCKER_USERNAME/flohmarkt-plus-frontend:latest
```

## Step 4: Create docker-compose.prod.hub.yml

This will use pre-built images from Docker Hub instead of building on EC2.

## Step 5: On EC2 - Pull and Run

```bash
# Pull images (much faster than building)
docker-compose -f docker-compose.prod.hub.yml pull

# Start services
docker-compose -f docker-compose.prod.hub.yml up -d
```

## Advantages
- ✅ No CPU-intensive builds on EC2
- ✅ Faster deployments (just pull pre-built images)
- ✅ Same images run on local and production
- ✅ Free Docker Hub public repos
- ✅ Easy to version with tags

## Updating Services
When you update code:
1. Build and push new images locally
2. On EC2: `docker-compose -f docker-compose.prod.hub.yml pull && docker-compose -f docker-compose.prod.hub.yml up -d`

