import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AuthRequest } from '../types';

/**
 * Key by authenticated user ID; fall back to IPv6-safe IP key for unauthenticated requests.
 */
function userOrIpKey(req: any): string {
  const userId = (req as AuthRequest).user?.id;
  if (userId) return `user:${userId}`;
  return `ip:${ipKeyGenerator(req.ip || '')}`;
}

/**
 * Per-authenticated-user rate limiter: 60 requests per minute
 * Tracks by user ID (not IP), so VPN switching doesn't bypass it.
 */
export const perUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});

/**
 * Stricter limit for expensive/heavy endpoints: 10 per minute per user
 * Applies to dashboard-metrics, AI copilot, bulk imports.
 */
export const heavyEndpointLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'Rate limit exceeded for this operation. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});
