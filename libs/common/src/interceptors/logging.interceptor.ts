import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const { method, url } = req;
    const requestId = req.requestId || req.headers['x-request-id'];
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || requestId;

    return next.handle().pipe(
      tap({
        next: () => {
          const res = ctx.getResponse();
          const durationMs = Date.now() - now;
          // eslint-disable-next-line no-console
          console.log(JSON.stringify({ level: 'info', message: 'http_request', method, url, statusCode: res.statusCode, durationMs, requestId, correlationId }));
        },
        error: (err) => {
          const durationMs = Date.now() - now;
          // eslint-disable-next-line no-console
          console.error(JSON.stringify({ level: 'error', message: err?.message || 'error', stack: err?.stack, method, url, durationMs, requestId, correlationId }));
        }
      })
    );
  }
}

