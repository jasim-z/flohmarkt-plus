import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  constructor() {
    // Simple sanitization without external dependencies for now
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    // Basic sanitization without external dependencies
    return str
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove any remaining angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .replace(/vbscript:/gi, '') // Remove vbscript: protocols
      .trim();
  }
}

// Utility functions for specific sanitization needs
export class SanitizationUtils {
  static sanitizeText(text: string): string {
    if (typeof text !== 'string') return text;
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/data:/gi, '') // Remove data protocols
      .replace(/vbscript:/gi, '') // Remove vbscript protocols
      .trim();
  }

  static sanitizeUrl(url: string): string {
    if (typeof url !== 'string') return url;
    
    // Only allow http and https protocols
    const allowedProtocols = /^https?:\/\//i;
    if (!allowedProtocols.test(url)) {
      return '';
    }
    
    return this.sanitizeText(url);
  }

  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return email;
    
    // Basic email validation and sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.sanitizeText(email);
    
    return emailRegex.test(sanitized) ? sanitized : '';
  }

  static sanitizePhoneNumber(phone: string): string {
    if (typeof phone !== 'string') return phone;
    
    // Remove all non-digit characters except + at the beginning
    return phone.replace(/[^\d+]/g, '').replace(/^\+?/, '+');
  }
}
