import { NextResponse } from 'next/server';

// Simple metrics endpoint for Prometheus monitoring
export async function GET() {
  const timestamp = Date.now();
  
  // Basic application metrics in Prometheus format
  const metrics = [
    `# HELP frontend_health_status Frontend application health status`,
    `# TYPE frontend_health_status gauge`,
    `frontend_health_status{status="healthy"} 1 ${timestamp}`,
    `frontend_health_status{status="unhealthy"} 0 ${timestamp}`,
    ``,
    `# HELP frontend_uptime_seconds Frontend application uptime in seconds`,
    `# TYPE frontend_uptime_seconds counter`,
    `frontend_uptime_seconds ${Math.floor(process.uptime())} ${timestamp}`,
    ``,
    `# HELP frontend_memory_usage_bytes Frontend memory usage in bytes`,
    `# TYPE frontend_memory_usage_bytes gauge`,
    `frontend_memory_usage_bytes ${process.memoryUsage().heapUsed} ${timestamp}`,
    ``,
    `# HELP frontend_timestamp Current timestamp`,
    `# TYPE frontend_timestamp gauge`,
    `frontend_timestamp ${timestamp} ${timestamp}`,
  ].join('\n');

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}
