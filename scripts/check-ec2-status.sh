#!/bin/bash
# Quick status check script for EC2 deployment

echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Container Logs (last 5 lines each) ==="
docker compose ps
echo ""

echo "=== Service Health Checks ==="
services=("http://localhost:3000" "http://localhost:3950" "http://localhost:3952" "http://localhost:3953" "http://localhost:3954")
for service in "${services[@]}"; do
    if curl -s --max-time 2 "$service" > /dev/null 2>&1; then
        echo "✅ $service - UP"
    else
        echo "❌ $service - DOWN or not ready"
    fi
done

echo ""
echo "=== Resource Usage ==="
echo "Memory:"
free -h | grep -E "Mem|Swap"
echo ""
echo "Disk:"
df -h / | tail -1

echo ""
echo "=== Docker System ==="
docker system df

