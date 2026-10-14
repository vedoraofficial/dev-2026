import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface HitRecord {
  timestamps: number[];
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, HitRecord>();
  private lastCleanup = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) return true; // No rate limit specified for this handler

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Use Express req.ip (which validates upstream proxy configuration) or remoteAddress
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown_ip';

    // Canonical route key: prefix with baseUrl and strip query params to prevent cross-controller collisions and query bypasses
    const canonicalPath = req.route?.path
      ? `${req.baseUrl || ''}${req.route.path}`
      : (req.path || req.url?.split('?')[0] || '');
    const routeKey = `${req.method}_${canonicalPath}_${clientIp}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Periodic cleanup of stale records every 5 minutes
    if (now - this.lastCleanup > 300000) {
      this.lastCleanup = now;
      for (const [key, record] of this.hits.entries()) {
        record.timestamps = record.timestamps.filter((t) => t > now - 600000);
        if (record.timestamps.length === 0) {
          this.hits.delete(key);
        }
      }
    }

    let record = this.hits.get(routeKey);
    if (!record) {
      record = { timestamps: [] };
      this.hits.set(routeKey, record);
    }

    // Filter hits within current window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= options.max) {
      const oldestHit = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((oldestHit + options.windowMs - now) / 1000);
      if (res.setHeader) {
        res.setHeader('Retry-After', retryAfterSeconds);
      }
      throw new HttpException(
        options.message || `Too many requests. Please try again after ${retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.timestamps.push(now);
    return true;
  }
}
