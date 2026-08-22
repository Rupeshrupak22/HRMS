import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { env } from '../../lib/env';
import { UnauthorizedError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { LoginDto, RefreshTokenDto } from './auth.schema';
import { JwtPayload } from '../../types';

import crypto from 'crypto';

export async function login(dto: LoginDto) {
  const identifier = dto.identifier.trim().toLowerCase();

  // Try to find user by email
  let user = await prisma.user.findUnique({
    where: { email: identifier },
    include: { employee: true },
  });

  // If not found, try by employee code
  if (!user) {
    const employee = await prisma.employee.findUnique({
      where: { employeeCode: dto.identifier.trim().toUpperCase() },
      include: { user: { include: { employee: true } } },
    });
    if (employee?.user) {
      user = { ...employee.user, employee: employee.user.employee };
    }
  }

  if (!user) {
    logAudit({ action: 'LOGIN_FAILED', userEmail: identifier, metadata: { reason: 'user_not_found' } });
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.isLocked) {
    // Auto-unlock after 15 minutes
    const lockDuration = 15 * 60 * 1000;
    const lastAttemptTime = user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;
    if (Date.now() - lastAttemptTime > lockDuration) {
      // Unlock the account
      await prisma.user.update({
        where: { id: user.id },
        data: { isLocked: false, failedAttempts: 0 },
      });
    } else {
      const remainingMins = Math.ceil((lockDuration - (Date.now() - lastAttemptTime)) / 60000);
      logAudit({ action: 'LOGIN_FAILED', userId: user.id, userEmail: user.email, metadata: { reason: 'account_locked' } });
      throw new UnauthorizedError(`Account locked due to too many failed attempts. Try again in ${remainingMins} minutes.`);
    }
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isPasswordValid) {
    const updatedAttempts = user.failedAttempts + 1;
    const isNowLocked = updatedAttempts >= 5;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: updatedAttempts,
        isLocked: isNowLocked,
        lastLoginAt: isNowLocked ? new Date() : user.lastLoginAt, // Record lock time
      },
    });
    logAudit({
      action: isNowLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
      userId: user.id,
      userEmail: user.email,
      metadata: { failedAttempts: updatedAttempts, locked: isNowLocked },
    });
    if (isNowLocked) {
      throw new UnauthorizedError('Account locked after 5 failed attempts. Try again after 15 minutes.');
    }
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate a unique session ID & device ID — invalidates all previous device sessions
  const sessionId = crypto.randomBytes(16).toString('hex');
  const incomingDeviceId = (dto as any).deviceId || crypto.randomBytes(8).toString('hex');

  // Increment tokenVersion to invalidate ALL previous sessions on other devices instantly
  const newTokenVersion = ((user as any).tokenVersion || 0) + 1;

  // Reset failed attempts, update lastLogin, update activeDeviceId, increment tokenVersion
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: 0,
      lastLoginAt: new Date(),
      activeDeviceId: incomingDeviceId,
      tokenVersion: newTokenVersion,
    } as any,
  });

  // Invalidate any in-memory user cache
  const { invalidateUserCache } = await import('../../middleware/auth');
  invalidateUserCache(user.id);
  invalidateUserCache(user.email);

  logAudit({ action: 'LOGIN_SUCCESS', userId: user.id, userEmail: user.email });

  const tokens = generateTokens(user.id, user.email, user.role, sessionId, newTokenVersion, incomingDeviceId);
  await updateRefreshToken(user.id, tokens.refreshToken);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    deviceId: incomingDeviceId,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            profilePhoto: user.employee.profilePhoto,
            departmentId: user.employee.departmentId,
          }
        : null,
    },
  };
}

export async function refreshToken(dto: RefreshTokenDto) {
  try {
    const payload = jwt.verify(dto.refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedError('Session expired. Please login again.');
    }

    const isTokenMatching = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isTokenMatching) {
      throw new UnauthorizedError('Your account has been logged in on another device. For security reasons, you have been signed out.');
    }

    const sessionId = (payload as any).sessionId || crypto.randomBytes(16).toString('hex');
    const tokenVersion = (user as any).tokenVersion || 0;
    const deviceId = (payload as any).deviceId || (user as any).activeDeviceId;
    const tokens = generateTokens(user.id, user.email, user.role, sessionId, tokenVersion, deviceId);
    await updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Session expired. Please login again.');
  }
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null, activeDeviceId: null },
  });
  const { invalidateUserCache } = await import('../../middleware/auth');
  invalidateUserCache(userId);
  logAudit({ action: 'LOGOUT', userId });
  return { success: true, message: 'Logged out successfully' };
}

function generateTokens(userId: string, email: string, role: string, sessionId?: string, tokenVersion?: number, deviceId?: string) {
  const payload: any = {
    sub: userId,
    email,
    role,
    sessionId: sessionId || crypto.randomBytes(16).toString('hex'),
    tv: tokenVersion || 0,
    deviceId: deviceId || '',
  };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
  return { accessToken, refreshToken };
}

async function updateRefreshToken(userId: string, token: string) {
  const hash = await bcrypt.hash(token, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: hash },
  });
}

export async function checkSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, refreshToken: true, lastLoginAt: true, isLocked: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (user.isLocked) {
    throw new UnauthorizedError('Account is locked');
  }

  return {
    valid: Boolean(user.refreshToken),
    lastLoginAt: user.lastLoginAt,
  };
}

export async function changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  if (dto.newPassword.length < 8) {
    throw new UnauthorizedError('New password must be at least 8 characters');
  }

  const newHash = await bcrypt.hash(dto.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, refreshToken: null },
  });

  logAudit({ action: 'PASSWORD_CHANGE', userId, userEmail: user.email });

  return { success: true, message: 'Password changed successfully. Please login again.' };
}
