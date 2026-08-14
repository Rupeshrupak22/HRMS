import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { env } from '../../lib/env';
import { UnauthorizedError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { LoginDto, RefreshTokenDto } from './auth.schema';
import { JwtPayload } from '../../types';

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
    logAudit({ action: 'LOGIN_FAILED', userId: user.id, userEmail: user.email, metadata: { reason: 'account_locked' } });
    throw new UnauthorizedError('Account is locked. Please contact HR admin.');
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
      },
    });
    logAudit({
      action: isNowLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
      userId: user.id,
      userEmail: user.email,
      metadata: { failedAttempts: updatedAttempts, locked: isNowLocked },
    });
    throw new UnauthorizedError('Invalid credentials');
  }

  // Reset failed attempts on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lastLoginAt: new Date() },
  });

  logAudit({ action: 'LOGIN_SUCCESS', userId: user.id, userEmail: user.email });

  const tokens = generateTokens(user.id, user.email, user.role);
  await updateRefreshToken(user.id, tokens.refreshToken);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
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
      throw new UnauthorizedError('Invalid refresh token');
    }

    const isTokenMatching = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isTokenMatching) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = generateTokens(user.id, user.email, user.role);
    await updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
  logAudit({ action: 'LOGOUT', userId });
  return { success: true, message: 'Logged out successfully' };
}

function generateTokens(userId: string, email: string, role: string) {
  const payload: JwtPayload = { sub: userId, email, role };
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
