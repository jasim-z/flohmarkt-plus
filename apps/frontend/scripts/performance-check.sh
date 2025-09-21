#!/bin/bash

echo "🔍 Frontend Performance Check"
echo "=============================="

# Check if container is running
if ! docker ps | grep -q "flohmarkt-plus-frontend"; then
    echo "❌ Frontend container is not running"
    exit 1
fi

# Check memory usage
echo "📊 Memory Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep frontend

# Check if frontend is responding
echo "🌐 Health Check:"
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
fi

# Check build size
echo "📦 Build Size:"
if [ -d ".next" ]; then
    du -sh .next
else
    echo "No build directory found"
fi

echo "=============================="
echo "Performance check complete!"
