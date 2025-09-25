import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestIdHeader = 'x-request-id';
    const correlationIdHeader = 'x-correlation-id';

    const requestId = (req.headers[requestIdHeader] as string) || randomUUID();
    const correlationId = (req.headers[correlationIdHeader] as string) || requestId;

    (req as any).requestId = requestId;
    (req as any).correlationId = correlationId;

    res.setHeader(requestIdHeader, requestId);
    res.setHeader(correlationIdHeader, correlationId);

    next();
  }
}

