import { Request, Response, NextFunction } from 'express';

/**
 * Fields that should NEVER be settable by the client.
 * These are system-managed fields — stripped from req.body before reaching route handlers.
 */
const BLOCKED_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'role',
  'isActive',
  'isLocked',
  'passwordHash',
  'activeSessionId',
  'activeDeviceId',
  'tokenVersion',
  'failedAttempts',
  'refreshToken',
  'userId',
  'isEmailVerified',
  'isMfaEnabled',
  'mfaSecret',
  'lastLoginAt',
];

/**
 * Middleware: Strip dangerous/system fields from request body.
 * Prevents mass assignment attacks where client injects fields like id, role, passwordHash.
 * Only operates on top-level object bodies — arrays (bulk imports) pass through untouched.
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const field of BLOCKED_FIELDS) {
      delete req.body[field];
    }
  }
  next();
}
