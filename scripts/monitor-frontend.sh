#!/bin/bash

# Frontend Performance Monitoring Script
# This script monitors the frontend container for performance issues

CONTAINER_NAME="ordering-app-frontend-1"
LOG_FILE="frontend-performance.log"

echo "🔍 Frontend Performance Monitor Started at $(date)"
echo "📊 Monitoring container: $CONTAINER_NAME"
echo "📝 Log file: $LOG_FILE"

# Function to log performance metrics
log_metrics() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check container status
check_container_status() {
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$CONTAINER_NAME"; then
        STATUS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$CONTAINER_NAME" | awk '{print $2}')
        log_metrics "Container Status: $STATUS"
    else
        log_metrics "❌ Container not running!"
        return 1
    fi
}

# Function to check memory usage
check_memory_usage() {
    if docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep -q "$CONTAINER_NAME"; then
        MEMORY=$(docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep "$CONTAINER_NAME" | awk '{print $2 " (" $3 ")"}')
        log_metrics "Memory Usage: $MEMORY"
    fi
}

# Function to check CPU usage
check_cpu_usage() {
    if docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}" | grep -q "$CONTAINER_NAME"; then
        CPU=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}" | grep "$CONTAINER_NAME" | awk '{print $2}')
        log_metrics "CPU Usage: $CPU"
    fi
}

# Function to check container logs for errors
check_container_logs() {
    ERROR_COUNT=$(docker logs --since 5m "$CONTAINER_NAME" 2>&1 | grep -i "error\|fatal\|exit" | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_metrics "⚠️  Found $ERROR_COUNT errors in last 5 minutes"
        docker logs --since 5m "$CONTAINER_NAME" 2>&1 | grep -i "error\|fatal\|exit" | tail -5 >> "$LOG_FILE"
    fi
}

# Function to restart container if needed
restart_if_needed() {
    if ! check_container_status; then
        log_metrics "🔄 Restarting frontend container..."
        docker-compose restart frontend
        sleep 10
        if check_container_status; then
            log_metrics "✅ Container restarted successfully"
        else
            log_metrics "❌ Failed to restart container"
        fi
    fi
}

# Main monitoring loop
while true; do
    echo "----------------------------------------"
    
    # Check container status
    check_container_status
    
    # Check resource usage
    check_memory_usage
    check_cpu_usage
    
    # Check for errors
    check_container_logs
    
    # Restart if needed
    restart_if_needed
    
    echo "----------------------------------------"
    echo ""
    
    # Wait 30 seconds before next check
    sleep 30
done 