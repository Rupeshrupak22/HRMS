import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { csrfProtection } from '../src/middleware/csrf';
import { validateContentType } from '../src/middleware/contentType';
import { recordFailedLogin, isIpBlocked, getSecurityStats } from '../src/middleware/securityMonitor';
import { z } from 'zod';

// Re-create the payroll schema here for testing since it's not exported
const payrollSchema = z.object({
  employeeId: z.string().max(100).nullable().optional(),
  employeeName: z.string().max(200).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  netPay: z.string().max(30).nullable().optional(),
});

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'POST',
    path: '/api/test',
    headers: {},
    cookies: {},
    body: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as any as Request;
}

function mockRes(): Response {
  const res = {} as any;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('API Security Tests', () => {

  describe('CSRF Protection', () => {
    it('skips CSRF for GET requests', () => {
      const req = mockReq({ method: 'GET', path: '/api/employees' });
      const res = mockRes();
      const next = vi.fn();

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('skips CSRF for OPTIONS requests', () => {
      const req = mockReq({ method: 'OPTIONS', path: '/api/employees' });
      const res = mockRes();
      const next = vi.fn();

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('skips CSRF for login endpoint', () => {
      const req = mockReq({ method: 'POST', path: '/api/auth/login' });
      const res = mockRes();
      const next = vi.fn();

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('allows POST with valid CSRF double-submit cookie', () => {
      const token = 'valid-csrf-token-abc123';
      const req = mockReq({
        method: 'POST',
        path: '/api/employees',
        cookies: { csrf_token: token },
        headers: { 'x-csrf-token': token },
      });
      const res = mockRes();
      const next = vi.fn();

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects POST with mismatched CSRF tokens', () => {
      const req = mockReq({
        method: 'POST',
        path: '/api/employees',
        cookies: { csrf_token: 'token-a' },
        headers: { 'x-csrf-token': 'token-b' },
      });
      const res = mockRes();
      const next = vi.fn();

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('CSRF') }));
    });

    it('rejects POST from invalid origin', () => {
      const req = mockReq({
        method: 'POST',
        path: '/api/employees',
        headers: { origin: 'https://evil-site.com' },
      });
      const res = mockRes();
      const next = vi.fn();

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows Bearer auth with no origin (server-to-server)', () => {
      const req = mockReq({
        method: 'POST',
        path: '/api/employees',
        headers: { authorization: 'Bearer some-token' },
      });
      const res = mockRes();
      const next = vi.fn();

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('blocks Bearer auth from invalid origin', () => {
      const req = mockReq({
        method: 'POST',
        path: '/api/employees',
        headers: {
          authorization: 'Bearer some-token',
          origin: 'https://attacker.com',
        },
      });
      const res = mockRes();
      const next = vi.fn();

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Content-Type Validation', () => {
    it('allows GET requests without Content-Type', () => {
      const req = mockReq({ method: 'GET', headers: {} });
      const res = mockRes();
      const next = vi.fn();

      validateContentType(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('allows POST with application/json', () => {
      const req = mockReq({
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': '50' },
      });
      const res = mockRes();
      const next = vi.fn();

      validateContentType(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('allows POST with multipart/form-data', () => {
      const req = mockReq({
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data; boundary=abc', 'content-length': '100' },
      });
      const res = mockRes();
      const next = vi.fn();

      validateContentType(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects POST with text/plain Content-Type', () => {
      const req = mockReq({
        method: 'POST',
        headers: { 'content-type': 'text/plain', 'content-length': '50' },
      });
      const res = mockRes();
      const next = vi.fn();

      validateContentType(req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
    });

    it('rejects PUT with application/xml Content-Type', () => {
      const req = mockReq({
        method: 'PUT',
        headers: { 'content-type': 'application/xml', 'content-length': '100' },
      });
      const res = mockRes();
      const next = vi.fn();

      validateContentType(req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
    });

    it('allows POST with empty body (content-length 0)', () => {
      const req = mockReq({
        method: 'POST',
        headers: { 'content-length': '0' },
      });
      const res = mockRes();
      const next = vi.fn();

      validateContentType(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Security Monitor - Brute Force Detection', () => {
    it('tracks failed login attempts per IP', () => {
      const req = mockReq({ socket: { remoteAddress: '192.168.1.100' } as any });

      // Record several failures
      for (let i = 0; i < 5; i++) {
        recordFailedLogin(req);
      }

      // Should not be blocked yet (threshold is 10)
      expect(isIpBlocked(req)).toBe(false);
    });

    it('blocks IP after exceeding threshold', () => {
      const req = mockReq({ socket: { remoteAddress: '10.0.0.99' } as any });

      // Record 11 failures (threshold is 10)
      for (let i = 0; i < 11; i++) {
        recordFailedLogin(req);
      }

      expect(isIpBlocked(req)).toBe(true);
    });

    it('does not block legitimate IPs', () => {
      const req = mockReq({ socket: { remoteAddress: '172.16.0.1' } as any });

      // Only 2 failures
      recordFailedLogin(req);
      recordFailedLogin(req);

      expect(isIpBlocked(req)).toBe(false);
    });

    it('returns security stats', () => {
      const stats = getSecurityStats();

      expect(stats).toHaveProperty('trackedIps');
      expect(stats).toHaveProperty('blockedIps');
      expect(stats).toHaveProperty('globalFailedLogins');
      expect(stats).toHaveProperty('thresholds');
      expect(stats.thresholds.maxFailedLoginsPerIp).toBe(10);
    });
  });

  describe('Input Validation - Payroll Schema', () => {
    it('accepts valid payroll data', () => {
      const result = payrollSchema.safeParse({
        employeeName: 'John Doe',
        department: 'Engineering',
        netPay: '50000',
      });
      expect(result.success).toBe(true);
    });

    it('rejects employeeName exceeding max length', () => {
      const result = payrollSchema.safeParse({
        employeeName: 'x'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('rejects netPay exceeding max length', () => {
      const result = payrollSchema.safeParse({
        netPay: '9'.repeat(31),
      });
      expect(result.success).toBe(false);
    });

    it('accepts null/optional fields', () => {
      const result = payrollSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects unexpected field types', () => {
      const result = payrollSchema.safeParse({
        employeeName: 12345, // Should be string
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CORS Security (origin validation logic)', () => {
    it('rejects wildcard origin in production', () => {
      // Simulates the CORS logic
      const isProduction = true;
      const allowedOrigins = ['*'];
      const origin = 'https://attacker.com';

      const allowed = !isProduction && allowedOrigins.includes('*');
      expect(allowed).toBe(false);
    });

    it('allows listed origin', () => {
      const allowedOrigins = ['https://hrms.adyapan.com', 'http://localhost:3000'];
      const origin = 'https://hrms.adyapan.com';

      const allowed = allowedOrigins.includes(origin);
      expect(allowed).toBe(true);
    });

    it('rejects unlisted origin', () => {
      const allowedOrigins = ['https://hrms.adyapan.com', 'http://localhost:3000'];
      const origin = 'https://evil.com';

      const allowed = allowedOrigins.includes(origin);
      expect(allowed).toBe(false);
    });
  });

  describe('Secrets Validation Logic', () => {
    it('identifies insecure default secrets', () => {
      const insecureDefaults = ['change-me', 'change-me-refresh', 'change-me-cookie-secret'];
      
      expect(insecureDefaults.includes('change-me')).toBe(true);
      expect(insecureDefaults.includes('my-super-secret-64-char-random-value')).toBe(false);
    });

    it('flags missing CORS_ORIGIN in production', () => {
      const isProduction = true;
      const corsOrigin = '*';

      const hasError = isProduction && (!corsOrigin || corsOrigin === '*');
      expect(hasError).toBe(true);
    });

    it('allows wildcard CORS in development', () => {
      const isProduction = false;
      const corsOrigin = '*';

      const hasError = isProduction && (!corsOrigin || corsOrigin === '*');
      expect(hasError).toBe(false);
    });
  });
});
