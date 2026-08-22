import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.schema';
import * as authService from './auth.service';
import { AuthRequest } from '../../types';
import { env } from '../../lib/env';
import { recordFailedLogin, recordSuccessfulLogin } from '../../middleware/securityMonitor';

const router = Router();

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.IS_PRODUCTION,
  sameSite: env.IS_PRODUCTION ? 'strict' as const : 'lax' as const,
  path: '/',
};

// Rate limiting: max 10 login attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.IS_PRODUCTION ? 10 : 100, // 10 in production, 100 in development
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), async (req, res: Response, next) => {
  try {
    const { forceLogin, deviceId, ...credentials } = req.body;
    const result = await authService.login({ ...credentials, forceLogin, deviceId });

    // If session confirmation is required, return early
    if ('requireSessionConfirmation' in result) {
      res.json(result);
      return;
    }

    // Record successful login for security monitoring
    recordSuccessfulLogin(req);

    // Set tokens as httpOnly cookies
    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });
    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh',
    });

    res.json(result);
  } catch (err) {
    // Record failed login for security monitoring
    recordFailedLogin(req);
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res: Response, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token provided' });
      return;
    }

    const result = await authService.refreshToken({ refreshToken });

    // Update cookies with new rotated tokens
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

// GET /api/auth/session-status — Check if current session is still valid
router.get('/session-status', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const status = await authService.checkSession(req.user!.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/csrf-token — CSRF protection token endpoint
router.get('/csrf-token', authenticate, async (req: AuthRequest, res: Response) => {
  const crypto = await import('crypto');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: env.IS_PRODUCTION,
    sameSite: env.IS_PRODUCTION ? 'strict' as const : 'lax' as const,
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({ csrfToken });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, validate(changePasswordSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await authService.changePassword(req.user!.id, req.body);

    // Clear cookies to force re-login with new credentials
    res.clearCookie('access_token', { ...COOKIE_OPTIONS });
    res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
