import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { ZodError } from 'zod';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    const authErr = err as any;
    res.status(err.statusCode).json({
      message: err.message,
      code: authErr.code,
      remainingAttempts: authErr.remainingAttempts,
      lockoutMinutes: authErr.lockoutMinutes,
      forceLogout: authErr.forceLogout ?? (err.message === 'FORCE_LOGOUT' || err.message.includes('FORCE_LOGOUT')),
    });
    return;
  }

  // Prisma / Database connection errors
  if (err.message?.includes("Can't reach database") || err.message?.includes('PrismaClient')) {
    console.error('Database connection error:', err.message);
    res.status(503).json({
      message: 'Database temporarily unavailable. Please try again in a moment.',
    });
    return;
  }

  // Unknown errors — never expose internal details
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
  });
}
