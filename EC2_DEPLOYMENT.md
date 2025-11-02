# EC2 Deployment Guide

## Prerequisites
- ✅ Docker images pushed to Docker Hub
- ✅ EC2 instance running
- ✅ Docker and docker compose installed on EC2

## Step 1: SSH into EC2

```bash
ssh -i ~/.ssh/id_rsa ec2-user@YOUR_EC2_IP
```

## Step 2: Set Up Project Directory

```bash
# Create directory
sudo mkdir -p /opt/flohmarkt-plus
sudo chown ec2-user:ec2-user /opt/flohmarkt-plus
cd /opt/flohmarkt-plus

# Clone your repository (or pull latest if already cloned)
git clone https://github.com/YOUR_USERNAME/flohmarkt-plus.git .
# OR if already cloned:
# git pull
```

## Step 3: Set Your Docker Hub Username

```bash
# Replace 'yourusername' with your actual Docker Hub username
export DOCKER_USERNAME=yourusername

# Make it persistent (add to ~/.bashrc or ~/.zshrc)
echo "export DOCKER_USERNAME=yourusername" >> ~/.bashrc
```

## Step 4: Set Up Environment Files

### Create .env.production

```bash
nano .env.production
```

Add your production environment variables:

```env
# Frontend API URLs (use EC2 private IP or public IP)
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:3950
NEXT_PUBLIC_LISTINGS_API_URL=http://YOUR_EC2_IP:3952
NEXT_PUBLIC_AUTH_API_URL=http://YOUR_EC2_IP:3950
NEXT_PUBLIC_MESSAGES_API_URL=http://YOUR_EC2_IP:3954
NEXT_PUBLIC_ORDERS_API_URL=http://YOUR_EC2_IP:3955
NEXT_PUBLIC_USERS_API_URL=http://YOUR_EC2_IP:3950

# Backend
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret

# Node Environment
NODE_ENV=production

# AWS S3 (if using)
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=flohmarkt-uploads-bucket-production

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin
```

**Note:** Replace `YOUR_EC2_IP` with your EC2 instance's public IP address.

### Create secrets/ directory

```bash
mkdir -p secrets
```

Copy your secret files from your local machine:

```bash
# On your Mac, run:
scp -i ~/.ssh/id_rsa secrets/* ec2-user@YOUR_EC2_IP:/opt/flohmarkt-plus/secrets/

# Or manually create them on EC2:
nano secrets/jwt_secret.txt
# Paste your JWT secret

nano secrets/mongodb_uri.txt
# Paste your MongoDB URI
```

## Step 5: Pull Images from Docker Hub

```bash
# Login to Docker Hub (you'll be prompted for credentials)
docker login

# Pull all images (fast - just downloads)
docker compose -f docker-compose.prod.hub.yml pull
```

## Step 6: Start Services

```bash
# Start all services in detached mode
docker compose -f docker-compose.prod.hub.yml up -d

# Check status
docker compose -f docker-compose.prod.hub.yml ps

# View logs
docker compose -f docker-compose.prod.hub.yml logs -f
```

## Step 7: Verify Services

```bash
# Check health
curl http://localhost:3950/health  # Auth
curl http://localhost:3952/health  # Listings
curl http://localhost:3953/health  # Markets
curl http://localhost:3954/health  # Messages
curl http://localhost:3000/api/health  # Frontend

# From outside EC2, test:
curl http://YOUR_EC2_IP:3000/api/health
```

## Step 8: Set Up Cloudflare Tunnel (for HTTPS without domain)

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Login to Cloudflare (opens browser)
cloudflared tunnel login

# Create a tunnel
cloudflared tunnel create flohmarkt-plus

# Create config file
nano ~/.cloudflared/config.yml
```

Add this config:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/ec2-user/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: your-app-name.cfargotunnel.com  # Auto-generated, or use your domain
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# Run as a service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

Your app will be accessible at the Cloudflare Tunnel URL (e.g., `https://your-app-name.cfargotunnel.com`).

## Troubleshooting

### Check logs for a specific service:
```bash
docker compose -f docker-compose.prod.hub.yml logs -f frontend
docker compose -f docker-compose.prod.hub.yml logs -f auth
```

### Restart a service:
```bash
docker compose -f docker-compose.prod.hub.yml restart frontend
```

### Stop all services:
```bash
docker compose -f docker-compose.prod.hub.yml down
```

### Update services (after pushing new images):
```bash
docker compose -f docker-compose.prod.hub.yml pull
docker compose -f docker-compose.prod.hub.yml up -d
```

### Check disk space:
```bash
df -h
docker system df
```

### If services fail to start, check:
1. Environment variables are set correctly
2. Secrets files exist and have content
3. MongoDB URI is accessible from EC2
4. Docker Hub username is set: `echo $DOCKER_USERNAME`

## Security Notes

1. **Firewall:** Ensure security group allows:
   - Port 22 (SSH) from your IP only
   - Port 3000 (Frontend) from anywhere (or just Cloudflare IPs)
   - Ports 3950-3955 (Backend APIs) only from localhost/Cloudflare

2. **Secrets:** Never commit `.env.production` or `secrets/` to Git

3. **HTTPS:** Use Cloudflare Tunnel for HTTPS without needing a custom domain

## Next Steps

1. ✅ All services running
2. ✅ Test the application
3. ✅ Set up Cloudflare Tunnel for HTTPS
4. ✅ Configure monitoring/alerting (optional)

