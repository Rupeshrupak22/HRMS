import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { env } from '../lib/env';
import { UnauthorizedError, ForbiddenError, ServiceUnavailableError, AuthError } from '../lib/errors';
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

// In-memory cache for authenticated users to avoid redundant DB hits during parallel requests (TTL: 5s)
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
  userCache.set(key, { user, expiry: Date.now() + 5 * 1000 });
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
        console.error('Auth DB query failed:', dbErr?.message);
        throw new ServiceUnavailableError('Authentication service temporarily unavailable. Please retry.');
      }
    }

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isLocked) {
      // Auto-unlock check
      const lockDuration = 15 * 60 * 1000;
      const lastTime = user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;
      if (Date.now() - lastTime > lockDuration) {
        // Will be unlocked on next login attempt
      } else {
        const remainingMins = Math.max(1, Math.ceil((lockDuration - (Date.now() - lastTime)) / 60000));
        throw new AuthError(`User account is locked. Try again in ${remainingMins} minutes.`, 401, {
          code: 'ACCOUNT_LOCKED',
          lockoutMinutes: remainingMins,
        });
      }
    }

    // Strict Single-Device Session enforcement — if another device logs in, invalidate this session
    const tokenTv = (payload as any).tv;
    const tokenDeviceId = (payload as any).deviceId;

    if (tokenTv !== undefined && (user as any).tokenVersion !== undefined && tokenTv < (user as any).tokenVersion) {
      throw new AuthError('FORCE_LOGOUT', 401, { code: 'FORCE_LOGOUT', forceLogout: true });
    }
    if (tokenDeviceId && user.activeDeviceId && tokenDeviceId !== user.activeDeviceId) {
      throw new AuthError('FORCE_LOGOUT', 401, { code: 'FORCE_LOGOUT', forceLogout: true });
    }


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
