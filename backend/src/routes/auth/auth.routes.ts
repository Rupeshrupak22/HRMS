import { Router, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, refreshTokenSchema } from './auth.schema';
import * as authService from './auth.service';
import { AuthRequest } from '../../types';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res: Response, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), async (req, res: Response, next) => {
  try {
    const result = await authService.refreshToken(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await authService.logout(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

export default router;
