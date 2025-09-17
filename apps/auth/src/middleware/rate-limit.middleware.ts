import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig { windowMs: number; maxRequests: number; message?: string; }

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: Record<string, { count: number; resetTime: number }> = {};
  private config: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 200, message: 'Too many requests' };

  static create(config: RateLimitConfig) {
    return (req: Request, res: Response, next: NextFunction) => {
      const m = new RateLimitMiddleware();
      m.config = { ...m.config, ...config };
      return m.use(req, res, next);
    };
  }

  use(req: Request, res: Response, next: NextFunction) {
    const key = (req.ip || 'unknown') + ':' + req.path;
    const now = Date.now();
    const entry = this.store[key] || { count: 0, resetTime: now + this.config.windowMs };
    if (now > entry.resetTime) { entry.count = 0; entry.resetTime = now + this.config.windowMs; }
    if (entry.count >= this.config.maxRequests) {
      res.set({ 'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString() });
      throw new HttpException({ statusCode: HttpStatus.TOO_MANY_REQUESTS, message: this.config.message }, HttpStatus.TOO_MANY_REQUESTS);
    }
    entry.count++;
    this.store[key] = entry;
    next();
  }
}

export const RATE_LIMITS = {
  GENERAL: { windowMs: 15 * 60 * 1000, maxRequests: 200, message: 'Too many requests' },
  LOGIN: { windowMs: 5 * 60 * 1000, maxRequests: 20, message: 'Too many login attempts' },
  USERS_CREATE: { windowMs: 15 * 60 * 1000, maxRequests: 30, message: 'Too many user creations' },
};


