import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware
 * Validates that state-changing requests (POST, PUT, PATCH, DELETE) 
 * include a valid CSRF token or originate from an allowed origin.
 * 
 * Uses the "double submit cookie" pattern:
 * - Frontend reads csrf_token cookie and sends it as X-CSRF-Token header
 * - Backend validates header matches cookie
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip safe methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Skip auth login and refresh routes (no session yet)
  if (req.path.includes('/auth/login') || req.path.includes('/auth/refresh') || req.path.includes('/auth/seed-admin')) {
    next();
    return;
  }

  // Skip webhook and cron sync endpoints (authenticated via HMAC/API key)
  if (req.path.includes('/sync/employee') || req.path.includes('/sync/cron')) {
    next();
    return;
  }

  // Origin validation — check that request comes from allowed origin
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());

  const isOriginAllowed = (o: string | undefined) => {
    if (!o) return false;
    return allowedOrigins.some(allowed => o.startsWith(allowed));
  };

  if (origin && !isOriginAllowed(origin)) {
    res.status(403).json({ success: false, message: 'CSRF validation failed: invalid origin' });
    return;
  }

  // Double submit cookie pattern
  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.headers['x-csrf-token'] as string;

  // If CSRF cookie exists, header must match
  if (csrfCookie && csrfHeader && csrfCookie === csrfHeader) {
    next();
    return;
  }

  // Fallback: Allow if request has valid origin header matching CORS
  if (origin && isOriginAllowed(origin)) {
    next();
    return;
  }

  // If using Authorization header (API clients), CSRF is less critical
  if (req.headers.authorization) {
    next();
    return;
  }

  res.status(403).json({ success: false, message: 'CSRF validation failed' });
}
