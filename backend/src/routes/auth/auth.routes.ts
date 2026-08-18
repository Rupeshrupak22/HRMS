import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, refreshTokenSchema } from './auth.schema';
import * as authService from './auth.service';
import { AuthRequest } from '../../types';
import { env } from '../../lib/env';

const router = Router();

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.IS_PRODUCTION,
  sameSite: env.IS_PRODUCTION ? 'strict' as const : 'lax' as const,
  path: '/',
};

// Rate limiting: max 20 login attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), async (req, res: Response, next) => {
  try {
    const result = await authService.login(req.body);

    // Set tokens as httpOnly cookies
    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });
    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh', // Only sent to refresh endpoint
    });

    // Also return tokens in response body for backward compatibility
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res: Response, next) => {
  try {
    // Try to get refresh token from cookie first, then body
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token provided' });
      return;
    }

    const result = await authService.refreshToken({ refreshToken });

    // Update cookies with new tokens
    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await authService.logout(req.user!.id);

    // Clear httpOnly cookies
    res.clearCookie('access_token', { ...COOKIE_OPTIONS });
    res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

// GET /api/auth/csrf-token — CSRF protection token endpoint
router.get('/csrf-token', authenticate, async (req: AuthRequest, res: Response) => {
  const crypto = await import('crypto');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false, // Must be readable by frontend JS
    secure: env.IS_PRODUCTION,
    sameSite: env.IS_PRODUCTION ? 'strict' as const : 'lax' as const,
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({ csrfToken });
});

export default router;
