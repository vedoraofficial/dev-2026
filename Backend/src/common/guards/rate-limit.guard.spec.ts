import { describe, it, expect, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RateLimitGuard(reflector);
  });

  function createMockContext(
    path: string,
    method: string = 'POST',
    ip: string = '127.0.0.1',
    options = { windowMs: 60000, max: 2 },
    baseUrl: string = '',
  ): ExecutionContext {
    reflector.getAllAndOverride = () => options;

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          url: path,
          baseUrl,
          route: { path: path.split('?')[0] },
          ip,
          socket: { remoteAddress: ip },
        }),
        getResponse: () => ({
          setHeader: () => {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('allows requests within limit', () => {
    const ctx1 = createMockContext('/api/test', 'POST', '1.1.1.1', { windowMs: 60000, max: 2 });
    const ctx2 = createMockContext('/api/test', 'POST', '1.1.1.1', { windowMs: 60000, max: 2 });

    expect(guard.canActivate(ctx1)).toBe(true);
    expect(guard.canActivate(ctx2)).toBe(true);
  });

  it('blocks requests exceeding limit with 429', () => {
    const ctx1 = createMockContext('/api/test', 'POST', '1.1.1.2', { windowMs: 60000, max: 2 });
    const ctx2 = createMockContext('/api/test', 'POST', '1.1.1.2', { windowMs: 60000, max: 2 });
    const ctx3 = createMockContext('/api/test', 'POST', '1.1.1.2', { windowMs: 60000, max: 2 });

    expect(guard.canActivate(ctx1)).toBe(true);
    expect(guard.canActivate(ctx2)).toBe(true);
    expect(() => guard.canActivate(ctx3)).toThrowError();
  });

  it('prevents query-string bypass (e.g. ?t=1 vs ?t=2 hit the same bucket)', () => {
    const ctx1 = createMockContext('/api/test?t=1', 'POST', '1.1.1.3', { windowMs: 60000, max: 2 });
    const ctx2 = createMockContext('/api/test?t=2', 'POST', '1.1.1.3', { windowMs: 60000, max: 2 });
    const ctx3 = createMockContext('/api/test?t=3', 'POST', '1.1.1.3', { windowMs: 60000, max: 2 });

    expect(guard.canActivate(ctx1)).toBe(true);
    expect(guard.canActivate(ctx2)).toBe(true);
    // 3rd attempt must be blocked even though query string changed
    expect(() => guard.canActivate(ctx3)).toThrowError();
  });

  it('prevents cross-controller collisions when two controllers have the same sub-path', () => {
    const orderCtx1 = createMockContext('/', 'POST', '1.1.1.4', { windowMs: 60000, max: 1 }, '/api/order');
    const userCtx1 = createMockContext('/', 'POST', '1.1.1.4', { windowMs: 60000, max: 1 }, '/api/user');

    // Hitting order endpoint should succeed
    expect(guard.canActivate(orderCtx1)).toBe(true);
    // Hitting user endpoint must also succeed because they have distinct baseUrls
    expect(guard.canActivate(userCtx1)).toBe(true);
  });
});
