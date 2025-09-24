# 📊 Flohmarkt Plus - Monitoring & Observability

Complete Grafana + Prometheus monitoring stack for your application.

## 🚀 Quick Start

```bash
# Start monitoring stack
./start-monitoring.sh

# Access dashboards
open http://localhost:3001  # Grafana (admin/admin123)
open http://localhost:9090  # Prometheus
```

## 📋 Available Dashboards

### 1. **Main Dashboard** (Auto-loaded)
- **File**: `grafana/provisioning/dashboards/flohmarkt-dashboard.json`
- **Shows**: All HTTP requests including monitoring traffic
- **Use Case**: Complete system overview

### 2. **User Traffic Dashboard** (Manual import)
- **File**: `user-traffic-dashboard.json`
- **Shows**: Only user traffic (excludes `/metrics` and `/health`)
- **Use Case**: Focus on actual app usage

**To import User Traffic Dashboard:**
1. Go to Grafana → **"+"** → **"Import"**
2. Upload `user-traffic-dashboard.json`
3. Select **"Prometheus"** as data source

## 📊 What You Get

### Grafana Dashboards
- **HTTP Request Rate**: Real-time requests per second
- **Response Time**: 95th percentile with color-coded thresholds
- **Error Rate**: Percentage of 5xx errors
- **Request Trends**: Historical performance graphs
- **Traffic Breakdown**: Requests by method and route

### Prometheus Metrics
- **Application Metrics**: Custom HTTP request duration and counters
- **System Metrics**: CPU, memory, disk usage via node-exporter
- **Health Checks**: Service availability monitoring

## 🔍 Understanding Your Data

### **Monitoring vs User Traffic**
- **Monitoring Traffic**: ~0.2 req/s (Prometheus scraping every 5 seconds)
- **User Traffic**: ~0.05 req/s (actual app usage)
- **Health Checks**: Periodic `/health` endpoint calls

### **Key Metrics Explained**
```promql
# All requests (including monitoring)
http_requests_total

# User traffic only (excluding monitoring)
http_requests_total{route!~"/metrics|/health"}

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))
```

## 🎯 Prometheus Queries

### **Basic Queries**
```promql
# See all HTTP requests
http_requests_total

# Request rate
rate(http_requests_total[5m])

# Response time
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

### **Advanced Queries**
```promql
# User traffic only
sum(rate(http_requests_total{route!~"/metrics|/health"}[5m]))

# Compare monitoring vs user traffic
sum(rate(http_requests_total{route=~"/metrics|/health"}[5m]))
sum(rate(http_requests_total{route!~"/metrics|/health"}[5m]))

# Top slowest endpoints
topk(10, rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m]))
```

## 🔧 Configuration Files

- `prometheus.yml` - Prometheus scraping configuration
- `grafana/provisioning/` - Auto-configured datasources and dashboards
- `start-monitoring.sh` - Startup script

## 🛑 Stop Monitoring
```bash
docker compose stop prometheus grafana node-exporter
```

## 📝 Notes

- Wait 1-2 minutes after startup for initial data collection
- Dashboard auto-refreshes every 5 seconds
- All metrics are stored locally in Docker volumes
- No external dependencies required

## 🆘 Troubleshooting

### **Dashboard Not Loading**
1. Check Grafana logs: `docker compose logs grafana`
2. Verify Prometheus connection in Grafana settings
3. Import dashboard manually if auto-provisioning fails

### **No Data in Prometheus**
1. Check targets: http://localhost:9090/targets
2. Verify markets service is running: `docker compose ps markets`
3. Check metrics endpoint: `curl http://localhost:3953/metrics`

### **High Request Counts**
- **Expected**: `/metrics` requests from Prometheus (every 5 seconds)
- **Solution**: Use User Traffic Dashboard to filter out monitoring traffic

## 🚀 Production Tips

1. **Set up alerting** for high error rates or slow response times
2. **Monitor business metrics** like market creation rates
3. **Use the comparison panel** to distinguish monitoring vs user traffic
4. **Regular cleanup** of old metrics data (configured for 200h retention)