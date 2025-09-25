#!/bin/bash

# Flohmarkt Plus - Monitoring Stack Startup Script
echo "🚀 Starting Flohmarkt Plus Monitoring Stack..."

# Check if docker compose is available
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Desktop."
    exit 1
fi

# Create monitoring directory if it doesn't exist
mkdir -p monitoring/grafana/provisioning/{datasources,dashboards}

echo "📊 Starting Prometheus and Grafana..."
docker compose up -d prometheus grafana node-exporter

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🔍 Checking service status..."
docker compose ps prometheus grafana node-exporter

echo ""
echo "✅ Monitoring stack is starting up!"
echo ""
echo "🌐 Access your monitoring dashboards:"
echo "   📊 Grafana:     http://localhost:3001 (admin/admin123)"
echo "   🔍 Prometheus:  http://localhost:9090"
echo "   📈 Node Metrics: http://localhost:9100/metrics"
echo ""
echo "📋 Your app metrics endpoints:"
echo "   🏪 Markets:     http://localhost:3953/metrics"
echo "   💚 Frontend:    http://localhost:3000/api/health"
echo ""
echo "💡 Tips:"
echo "   - Wait 1-2 minutes for initial data collection"
echo "   - Check Grafana dashboard: 'Flohmarkt Plus - Application Metrics'"
echo "   - Use Prometheus to run custom queries"
echo ""
echo "🛑 To stop monitoring: docker compose stop prometheus grafana node-exporter"
