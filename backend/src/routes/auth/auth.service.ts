import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { env } from '../../lib/env';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { LoginDto, RefreshTokenDto, ChangePasswordDto } from './auth.schema';
import { JwtPayload } from '../../types';

// Lockout configuration
const LOCKOUT_CONFIG = {
  maxAttempts: 5,          // Regular users: 5 attempts
  adminMaxAttempts: 3,     // Admin users: 3 attempts
  lockoutDuration: 15,     // Regular: 15 minutes
  adminLockoutDuration: 30, // Admin: 30 minutes
};

// Idle session timeout (15 minutes)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Generate a unique device ID for session tracking
 */
function generateDeviceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Check if an account lockout has expired
 */
function isLockoutExpired(user: { role: string; lockedAt: Date | null }): boolean {
  if (!user.lockedAt) return true;
  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);
  const durationMs = (isAdmin ? LOCKOUT_CONFIG.adminLockoutDuration : LOCKOUT_CONFIG.lockoutDuration) * 60 * 1000;
  return Date.now() - user.lockedAt.getTime() > durationMs;
}

/**
 * Get max attempts based on role
 */
function getMaxAttempts(role: string): number {
  return ['SUPER_ADMIN', 'HR_ADMIN'].includes(role) ? LOCKOUT_CONFIG.adminMaxAttempts : LOCKOUT_CONFIG.maxAttempts;
}

/**
 * Check if there's an active session (activity within idle timeout)
 */
function hasActiveSession(user: { lastActivityAt: Date | null; forceLogout: boolean }): boolean {
  if (user.forceLogout) return false;
  if (!user.lastActivityAt) return false;
  return Date.now() - user.lastActivityAt.getTime() < IDLE_TIMEOUT_MS;
}

/**
 * LOGIN — Complete workflow with session management
 */
export async function login(dto: LoginDto & { forceLogin?: boolean; deviceId?: string }) {
  const identifier = dto.identifier.trim().toLowerCase();

  // Find user by email or employee code
  let user = await prisma.user.findUnique({
    where: { email: identifier },
    include: { employee: true },
  });

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
    // Always run bcrypt to prevent timing attacks
    await bcrypt.hash('dummy', 10);
    logAudit({ action: 'LOGIN_FAILED', userEmail: identifier, metadata: { reason: 'user_not_found' } });
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if account is deactivated by admin
  if (!user.isActive) {
    logAudit({ action: 'LOGIN_FAILED', userId: user.id, userEmail: user.email, metadata: { reason: 'account_deactivated' } });
    throw new UnauthorizedError('Your account has been deactivated. Please contact HR admin.');
  }

  // Check account lockout
  if (user.isLocked) {
    if (isLockoutExpired(user)) {
      // Lockout expired — unlock the account
      await prisma.user.update({
        where: { id: user.id },
        data: { isLocked: false, failedAttempts: 0, lockedAt: null },
      });
    } else {
      const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);
      const duration = isAdmin ? LOCKOUT_CONFIG.adminLockoutDuration : LOCKOUT_CONFIG.lockoutDuration;
      const remaining = Math.ceil((duration * 60 * 1000 - (Date.now() - (user.lockedAt?.getTime() || 0))) / 60000);
      logAudit({ action: 'LOGIN_FAILED', userId: user.id, userEmail: user.email, metadata: { reason: 'account_locked' } });
      throw new UnauthorizedError(`Account temporarily locked. Try again in ${remaining} minutes.`);
    }
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isPasswordValid) {
    const maxAttempts = getMaxAttempts(user.role);
    const updatedAttempts = user.failedAttempts + 1;
    const isNowLocked = updatedAttempts >= maxAttempts;
    const remaining = maxAttempts - updatedAttempts;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: updatedAttempts,
        isLocked: isNowLocked,
        lockedAt: isNowLocked ? new Date() : undefined,
      },
    });

    logAudit({
      action: isNowLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
      userId: user.id,
      userEmail: user.email,
      metadata: { failedAttempts: updatedAttempts, locked: isNowLocked },
    });

    if (isNowLocked) {
      const duration = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role)
        ? LOCKOUT_CONFIG.adminLockoutDuration
        : LOCKOUT_CONFIG.lockoutDuration;
      throw new UnauthorizedError(`Account locked. Try again in ${duration} minutes.`);
    }
    throw new UnauthorizedError(`Invalid email or password. ${remaining} attempts remaining.`);
  }

  // Password valid — check for active session on another device
  // Only show popup if session is truly active (user interacting within 15 min)
  // After idle timeout, session is considered dead — no popup needed
  const activeSession = hasActiveSession(user);
  if (activeSession && !dto.forceLogin && dto.deviceId !== user.activeDeviceId) {
    // Return requireSessionConfirmation flag — frontend shows popup
    return {
      requireSessionConfirmation: true,
      message: 'There is an active session on another device. Do you want to end it and login here?',
    };
  }

  // If forceLogin, mark old device for force logout
  if (dto.forceLogin && user.activeDeviceId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { forceLogout: true },
    });
  }

  // Generate new device ID
  const deviceId = dto.deviceId || generateDeviceId();

  // Reset failed attempts + update session tracking
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: 0,
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
      forceLogout: false,
      activeDeviceId: deviceId,
    },
  });

  logAudit({ action: 'LOGIN_SUCCESS', userId: user.id, userEmail: user.email, metadata: { deviceId } });

  const tokens = generateTokens(user.id, user.email, user.role, deviceId, (user as any).tokenVersion || 0);
  await updateRefreshToken(user.id, tokens.refreshToken);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    deviceId,
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

/**
 * REFRESH TOKEN — With rotation and theft detection
 */
export async function refreshToken(dto: RefreshTokenDto) {
  try {
    const payload = jwt.verify(dto.refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload & { deviceId?: string };

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if account is still active
    if (!user.isActive) {
      // Revoke ALL refresh tokens for this user
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null, forceLogout: true },
      });
      throw new UnauthorizedError('Your account has been deactivated.');
    }

    // Check if refresh token hash exists (was it already revoked?)
    if (!user.refreshToken) {
      // THEFT DETECTED: Token is valid JWT but not in DB (already rotated)
      // Revoke ALL sessions for this user
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null, forceLogout: true, activeDeviceId: null },
      });
      logAudit({
        action: 'TOKEN_THEFT_DETECTED',
        userId: user.id,
        userEmail: user.email,
        metadata: { reason: 'refresh_token_reuse_after_rotation' },
      });
      throw new UnauthorizedError('Security alert: Session compromised. All sessions revoked.');
    }

    // Verify token matches stored hash
    const isTokenMatching = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isTokenMatching) {
      // THEFT DETECTED: Valid JWT but doesn't match stored hash
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null, forceLogout: true, activeDeviceId: null },
      });
      logAudit({
        action: 'TOKEN_THEFT_DETECTED',
        userId: user.id,
        userEmail: user.email,
        metadata: { reason: 'refresh_token_hash_mismatch' },
      });
      throw new UnauthorizedError('Security alert: Session compromised. All sessions revoked.');
    }

    // Check force logout flag
    if (user.forceLogout) {
      // Another device logged in — this session is terminated
      await prisma.user.update({
        where: { id: user.id },
        data: { forceLogout: false },
      });
      throw new UnauthorizedError('Session ended. You have been logged in on another device.');
    }

    // Rotate: delete old refresh token, generate new pair
    const deviceId = payload.deviceId || user.activeDeviceId || generateDeviceId();
    const tokens = generateTokens(user.id, user.email, user.role, deviceId, (user as any).tokenVersion || 0);
    await updateRefreshToken(user.id, tokens.refreshToken);

    // Update activity timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
    });

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

/**
 * RECORD ACTIVITY — Called by authenticate middleware on each request
 */
export async function recordActivity(userId: string, deviceId?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { forceLogout: true, isActive: true, activeDeviceId: true },
    });

    if (!user) return { allowed: false, code: 'USER_NOT_FOUND' };
    if (!user.isActive) return { allowed: false, code: 'ACCOUNT_DEACTIVATED' };

    // Check if this device has been force-logged-out
    if (user.forceLogout && deviceId && user.activeDeviceId !== deviceId) {
      return { allowed: false, code: 'FORCE_LOGOUT' };
    }

    // Update last activity
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() },
    });

    return { allowed: true };
  } catch {
    return { allowed: true }; // Fail open — don't block requests on DB errors
  }
}

/**
 * CHECK SESSION — Returns whether user has an active session
 */
export async function checkSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActivityAt: true, forceLogout: true, activeDeviceId: true, isActive: true },
  });

  if (!user) return { hasActiveSession: false };

  return {
    hasActiveSession: hasActiveSession(user),
    isActive: user.isActive,
    forceLogout: user.forceLogout,
  };
}

/**
 * LOGOUT
 */
export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null, activeDeviceId: null, lastActivityAt: null },
  });
  logAudit({ action: 'LOGOUT', userId });
  return { success: true, message: 'Logged out successfully' };
}

/**
 * Generate JWT tokens with device ID embedded
 */
function generateTokens(userId: string, email: string, role: string, deviceId?: string, tokenVersion?: number) {
  const payload: JwtPayload & { deviceId?: string; tokenVersion?: number } = { sub: userId, email, role };
  if (deviceId) payload.deviceId = deviceId;
  if (tokenVersion !== undefined) payload.tokenVersion = tokenVersion;

  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
  return { accessToken, refreshToken };
}

/**
 * Store hashed refresh token
 */
async function updateRefreshToken(userId: string, token: string) {
  const hash = await bcrypt.hash(token, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: hash },
  });
}

/**
 * CHANGE PASSWORD — Validates current password, updates hash, invalidates all sessions
 */
export async function changePassword(userId: string, dto: ChangePasswordDto) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Verify current password
  const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Ensure new password is different from current
  const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new BadRequestError('New password must be different from current password');
  }

  // Hash new password and invalidate all sessions
  const newHash = await bcrypt.hash(dto.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      refreshToken: null,       // Invalidate refresh token
      activeDeviceId: null,     // Clear active device
      tokenVersion: { increment: 1 }, // Increment token version to invalidate all JWTs
    },
  });

  logAudit({ action: 'PASSWORD_CHANGE', userId, userEmail: user.email });

  return { success: true, message: 'Password changed successfully. Please log in again.' };
}
