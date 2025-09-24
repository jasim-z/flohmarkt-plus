import { Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Registry, Histogram, Counter } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();
  readonly httpRequestDuration: Histogram<string>;
  readonly httpRequestCounter: Counter<string>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in ms',
      labelNames: ['method', 'route', 'status'],
      buckets: [50, 100, 200, 300, 500, 1000, 2000, 5000],
      registers: [this.registry],
    });
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });
  }

  onModuleInit() {}

  getRegistry() {
    return this.registry;
  }
}

