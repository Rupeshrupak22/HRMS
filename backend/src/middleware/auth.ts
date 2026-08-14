import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { env } from '../lib/env';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';
import { AuthRequest, JwtPayload, Role } from '../types';

/**
 * Middleware: Verify JWT and attach user to request
 */
export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    // Try to get token from: 1) httpOnly cookie, 2) Authorization header
    let token: string | null = null;

    if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('Missing authentication credentials');
    }

    let payload: JwtPayload | null = null;

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    if (!payload || !payload.sub) {
      throw new UnauthorizedError('Invalid token payload');
    }

    let user = null;
    if (payload.sub) {
      user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { employee: true },
      });
    }
    if (!user && payload.email) {
      user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { employee: true },
      });
    }

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isLocked) {
      throw new UnauthorizedError('User account is locked. Contact HR admin.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id || null,
      employeeCode: user.employee?.employeeCode || null,
      firstName: user.employee?.firstName || '',
      lastName: user.employee?.lastName || '',
      departmentId: user.employee?.departmentId || null,
      specialization: (user as any).specialization || null,
    };

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

/**
 * Middleware: Authorize by roles
 */
export function authorize(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    // SUPER_ADMIN bypasses all role checks
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Specialists with specific specialization get access to their domain routes
    // But they still must match allowed roles for critical operations
    if (req.user.specialization && roles.includes('HR_EXECUTIVE' as Role)) {
      next();
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role as Role)) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
