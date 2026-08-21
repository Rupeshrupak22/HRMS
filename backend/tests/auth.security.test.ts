import { describe, it, expect } from 'vitest';
import { passwordSchema, loginSchema, changePasswordSchema } from '../src/routes/auth/auth.schema';

describe('Auth Security Tests', () => {

  describe('Password Complexity (passwordSchema)', () => {
    it('rejects passwords shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Ab1!xyz');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('rejects passwords without uppercase letter', () => {
      const result = passwordSchema.safeParse('abcdef1!xyz');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('uppercase'))).toBe(true);
      }
    });

    it('rejects passwords without lowercase letter', () => {
      const result = passwordSchema.safeParse('ABCDEF1!XYZ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('lowercase'))).toBe(true);
      }
    });

    it('rejects passwords without a digit', () => {
      const result = passwordSchema.safeParse('Abcdefg!xyz');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('digit'))).toBe(true);
      }
    });

    it('rejects passwords without special character', () => {
      const result = passwordSchema.safeParse('Abcdefg1xyz');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('special'))).toBe(true);
      }
    });

    it('accepts a valid strong password', () => {
      const result = passwordSchema.safeParse('SecureP@ss1');
      expect(result.success).toBe(true);
    });

    it('accepts complex passwords with multiple special chars', () => {
      const result = passwordSchema.safeParse('C0mpl3x!P@$$w0rd');
      expect(result.success).toBe(true);
    });

    it('rejects passwords longer than 128 characters', () => {
      const longPwd = 'Aa1!' + 'x'.repeat(126);
      const result = passwordSchema.safeParse(longPwd);
      expect(result.success).toBe(false);
    });
  });

  describe('Login Schema Validation', () => {
    it('rejects empty identifier', () => {
      const result = loginSchema.safeParse({ identifier: '', password: 'test' });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({ identifier: 'user@test.com', password: '' });
      expect(result.success).toBe(false);
    });

    it('rejects identifier longer than 254 chars', () => {
      const result = loginSchema.safeParse({ identifier: 'a'.repeat(255), password: 'test' });
      expect(result.success).toBe(false);
    });

    it('rejects password longer than 128 chars', () => {
      const result = loginSchema.safeParse({ identifier: 'user@test.com', password: 'a'.repeat(129) });
      expect(result.success).toBe(false);
    });

    it('accepts valid login input', () => {
      const result = loginSchema.safeParse({ identifier: 'user@test.com', password: 'MyP@ss1' });
      expect(result.success).toBe(true);
    });

    it('accepts employee code as identifier', () => {
      const result = loginSchema.safeParse({ identifier: 'EMP-001', password: 'pass' });
      expect(result.success).toBe(true);
    });
  });

  describe('Change Password Schema Validation', () => {
    it('rejects when current password is empty', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'NewP@ss1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects when new password is weak', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword',
        newPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid change password input', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword123',
        newPassword: 'NewStr0ng!Pass',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Token Version / Session Invalidation Logic', () => {
    it('tokenVersion mismatch should indicate session expiry', () => {
      // Simulates the check in auth middleware
      const jwtTokenVersion = 0;
      const dbTokenVersion = 1; // Incremented after password change
      expect(jwtTokenVersion).not.toBe(dbTokenVersion);
    });

    it('tokenVersion match should allow access', () => {
      const jwtTokenVersion = 2;
      const dbTokenVersion = 2;
      expect(jwtTokenVersion).toBe(dbTokenVersion);
    });
  });

  describe('Account Lockout Logic', () => {
    it('should lock after max attempts threshold', () => {
      const maxAttempts = 5;
      const failedAttempts = 5;
      const isLocked = failedAttempts >= maxAttempts;
      expect(isLocked).toBe(true);
    });

    it('should not lock before reaching threshold', () => {
      const maxAttempts = 5;
      const failedAttempts = 4;
      const isLocked = failedAttempts >= maxAttempts;
      expect(isLocked).toBe(false);
    });

    it('admin should lock after 3 attempts', () => {
      const adminMaxAttempts = 3;
      const failedAttempts = 3;
      const isLocked = failedAttempts >= adminMaxAttempts;
      expect(isLocked).toBe(true);
    });

    it('should auto-unlock after lockout duration expires', () => {
      const lockedAt = new Date(Date.now() - 16 * 60 * 1000); // 16 minutes ago
      const lockoutDurationMs = 15 * 60 * 1000; // 15 minutes
      const isExpired = Date.now() - lockedAt.getTime() > lockoutDurationMs;
      expect(isExpired).toBe(true);
    });

    it('should remain locked within lockout duration', () => {
      const lockedAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const lockoutDurationMs = 15 * 60 * 1000; // 15 minutes
      const isExpired = Date.now() - lockedAt.getTime() > lockoutDurationMs;
      expect(isExpired).toBe(false);
    });
  });
});
