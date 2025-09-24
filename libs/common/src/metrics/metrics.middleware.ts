import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    const method = req.method;
    // route not always available in middleware; fallback to url
    const route = (req as any).route?.path || req.originalUrl || req.url;

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const status = String(res.statusCode);
      this.metrics.httpRequestDuration.labels(method, route, status).observe(durationMs);
      this.metrics.httpRequestCounter.labels(method, route, status).inc();
    });

    next();
  }
}

