import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { env } from '../lib/env';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';
import { AuthRequest, JwtPayload, Role } from '../types';

const SPECIALIST_CONFIG: Record<string, { role: Role; specialization: string }> = {
  'pavitra@adyapan.com': { role: 'HR_EXECUTIVE', specialization: 'ATTENDANCE_LEAVE' },
  'nandini@adyapan.com': { role: 'HR_ADMIN', specialization: 'HR_MANAGER_ALL' },
  'nandani@adyapan.com': { role: 'HR_ADMIN', specialization: 'HR_MANAGER_ALL' },
  'charitha@adyapan.com': { role: 'HR_EXECUTIVE', specialization: 'SALARY_PAYROLL' },
  'veena@adyapan.com': { role: 'HR_EXECUTIVE', specialization: 'ONBOARDING_HIRING' },
  'nitisha@adyapan.com': { role: 'HR_EXECUTIVE', specialization: 'DISCIPLINE_POSH' },
  'aravind@adyapan.com': { role: 'HR_EXECUTIVE', specialization: 'RESIGNATION_EXIT' },
};

// In-memory cache for authenticated users to avoid redundant DB hits during parallel requests (TTL: 10s)
const userCache = new Map<string, { user: any; expiry: number }>();

export function invalidateUserCache(key?: string) {
  if (key) {
    userCache.delete(key);
  } else {
    userCache.clear();
  }
}

function getCachedUser(key: string) {
  const cached = userCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.user;
  }
  userCache.delete(key);
  return null;
}

function setCachedUser(key: string, user: any) {
  userCache.set(key, { user, expiry: Date.now() + 10 * 1000 });
}

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

    const cacheKey = payload.sub || payload.email || '';
    let user = getCachedUser(cacheKey);

    if (!user) {
      try {
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
        if (user) {
          setCachedUser(cacheKey, user);
        }
      } catch (dbErr: any) {
        console.warn('⚠️ Auth DB query fallback to token payload:', dbErr?.message);
        // Fallback: If DB connection pool is momentarily saturated, construct user from valid JWT payload
        user = {
          id: payload.sub,
          email: payload.email || '',
          role: payload.role || 'HR_ADMIN',
          isLocked: false,
          employee: null,
        };
      }
    }

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isLocked) {
      throw new UnauthorizedError('User account is locked. Contact HR admin.');
    }

    // Check if account is deactivated
    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated.');
    }

    // Check tokenVersion — invalidates all JWTs issued before password change
    const tokenVersion = (payload as any).tokenVersion;
    if (tokenVersion !== undefined && user.tokenVersion !== undefined && tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedError('Session expired due to security update. Please log in again.');
    }

    // Strict Single-Device Session enforcement — if another device/browser logs in, invalidate this session
    const tokenDeviceId = (payload as any).deviceId;
    if (tokenDeviceId && user.activeDeviceId && tokenDeviceId !== user.activeDeviceId) {
      throw new UnauthorizedError('FORCE_LOGOUT');
    }

    // Record activity (non-blocking)
    prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});


    const emailKey = (user.email || '').toLowerCase().trim();
    const specialistInfo = SPECIALIST_CONFIG[emailKey];

    const effectiveRole = specialistInfo
      ? (user.role === 'EMPLOYEE' || !user.role ? specialistInfo.role : user.role)
      : user.role;

    const effectiveSpecialization =
      (user as any).specialization ||
      specialistInfo?.specialization ||
      null;

    req.user = {
      id: user.id,
      email: user.email,
      role: effectiveRole,
      employeeId: user.employee?.id || null,
      employeeCode: user.employee?.employeeCode || null,
      firstName: user.employee?.firstName || '',
      lastName: user.employee?.lastName || '',
      departmentId: user.employee?.departmentId || null,
      specialization: effectiveSpecialization,
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

    const email = (req.user.email || '').toLowerCase().trim();
    const userRole = (req.user.role || 'EMPLOYEE') as Role;
    const isSpecialist = Boolean(req.user.specialization) || Boolean(SPECIALIST_CONFIG[email]);
    const isNandini = email === 'nandini@adyapan.com' || email === 'nandani@adyapan.com' || req.user.specialization === 'HR_MANAGER_ALL';

    // SUPER_ADMIN always has access
    if (userRole === 'SUPER_ADMIN') {
      next();
      return;
    }

    // HR_ADMIN and Nandini (HR Manager) have access to admin-level routes
    if (userRole === 'HR_ADMIN' || isNandini) {
      next();
      return;
    }

    // HR Specialists (including Pavitra) get HR_EXECUTIVE level access
    if (isSpecialist && roles.includes('HR_EXECUTIVE' as Role)) {
      next();
      return;
    }

    // Standard role check: user's role must be in the allowed list
    if (roles.length > 0 && !roles.includes(userRole)) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
