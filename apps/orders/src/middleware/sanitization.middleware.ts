import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') req.body = this.sanitize(req.body);
    if (req.query && typeof req.query === 'object') req.query = this.sanitize(req.query);
    next();
  }

  private sanitize(input: any): any {
    if (Array.isArray(input)) return input.map(v => this.sanitize(v));
    if (input && typeof input === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(input)) out[k] = this.sanitize(v);
      return out;
    }
    if (typeof input === 'string') return this.sanitizeString(input);
    return input;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }
}


