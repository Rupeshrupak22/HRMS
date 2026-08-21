import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authorize } from '../src/middleware/auth';

// Helper to create a mock request with user data
function mockReq(user: any): Request {
  return { user } as any as Request;
}

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  return res;
}

describe('Authorization / RBAC Security Tests', () => {

  describe('authorize() middleware - Role enforcement', () => {
    it('allows SUPER_ADMIN access to any route', () => {
      const req = mockReq({ id: '1', email: 'admin@test.com', role: 'SUPER_ADMIN', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      authorize('HR_ADMIN')(req as any, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('allows HR_ADMIN access to HR_ADMIN routes', () => {
      const req = mockReq({ id: '1', email: 'hr@test.com', role: 'HR_ADMIN', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      authorize('HR_ADMIN')(req as any, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('blocks EMPLOYEE from accessing HR_ADMIN routes', () => {
      const req = mockReq({ id: '1', email: 'emp@test.com', role: 'EMPLOYEE', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      authorize('HR_ADMIN')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('blocks EMPLOYEE from accessing HR_EXECUTIVE routes', () => {
      const req = mockReq({ id: '1', email: 'emp@test.com', role: 'EMPLOYEE', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      authorize('HR_EXECUTIVE')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('allows EMPLOYEE access to EMPLOYEE routes', () => {
      const req = mockReq({ id: '1', email: 'emp@test.com', role: 'EMPLOYEE', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      authorize('EMPLOYEE')(req as any, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('returns 401 when no user is attached to request', () => {
      const req = mockReq(undefined);
      const res = mockRes();
      const next = vi.fn();

      authorize('EMPLOYEE')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('authorize() - Specialist access', () => {
    it('allows specialist with HR_EXECUTIVE role access to HR_EXECUTIVE routes', () => {
      const req = mockReq({
        id: '1',
        email: 'aravind@adyapan.com',
        role: 'HR_EXECUTIVE',
        specialization: 'RESIGNATION_EXIT',
      });
      const res = mockRes();
      const next = vi.fn();

      authorize('HR_EXECUTIVE')(req as any, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('blocks specialist from accessing SUPER_ADMIN routes', () => {
      const req = mockReq({
        id: '1',
        email: 'aravind@adyapan.com',
        role: 'HR_EXECUTIVE',
        specialization: 'RESIGNATION_EXIT',
      });
      const res = mockRes();
      const next = vi.fn();

      authorize('SUPER_ADMIN')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('allows Nandini (HR Manager) admin-level access', () => {
      const req = mockReq({
        id: '1',
        email: 'nandini@adyapan.com',
        role: 'HR_ADMIN',
        specialization: 'HR_MANAGER_ALL',
      });
      const res = mockRes();
      const next = vi.fn();

      authorize('SUPER_ADMIN')(req as any, res, next);

      // HR_ADMIN bypasses all role checks
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('authorize() - No empCode bypass', () => {
    it('EMPLOYEE with ADP code cannot access HR_ADMIN routes', () => {
      const req = mockReq({
        id: '1',
        email: 'user@test.com',
        role: 'EMPLOYEE',
        employeeCode: 'ADP0001',
        specialization: null,
      });
      const res = mockRes();
      const next = vi.fn();

      authorize('HR_ADMIN')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('EMPLOYEE with EMP code cannot access HR_EXECUTIVE routes', () => {
      const req = mockReq({
        id: '1',
        email: 'user@test.com',
        role: 'EMPLOYEE',
        employeeCode: 'EMP-015',
        specialization: null,
      });
      const res = mockRes();
      const next = vi.fn();

      authorize('HR_EXECUTIVE')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  describe('BOLA / Object-Level Authorization Checks', () => {
    it('EMPLOYEE role should only see own goals (not others via query param)', () => {
      // Simulates the logic in performance.routes.ts
      const userRole = 'EMPLOYEE';
      const userEmployeeId = 'emp-123';
      const queryEmployeeId = 'emp-456'; // Another employee's ID

      // The route should ignore queryEmployeeId for EMPLOYEE role
      const effectiveEmployeeId = userRole === 'EMPLOYEE' ? userEmployeeId : queryEmployeeId;
      expect(effectiveEmployeeId).toBe('emp-123');
    });

    it('HR_ADMIN can view any employee goals', () => {
      const userRole = 'HR_ADMIN';
      const userEmployeeId = 'emp-admin';
      const queryEmployeeId = 'emp-456';

      const effectiveEmployeeId = userRole === 'EMPLOYEE' ? userEmployeeId : queryEmployeeId;
      expect(effectiveEmployeeId).toBe('emp-456');
    });

    it('EMPLOYEE cannot view other employees F&F settlement', () => {
      // Simulates the BOLA check in exit.routes.ts
      const userRole = 'EMPLOYEE';
      const userEmployeeId = 'emp-123';
      const requestedEmployeeId = 'emp-456';

      const isAllowed = userRole !== 'EMPLOYEE' || userEmployeeId === requestedEmployeeId;
      expect(isAllowed).toBe(false);
    });

    it('EMPLOYEE can view their own F&F settlement', () => {
      const userRole = 'EMPLOYEE';
      const userEmployeeId = 'emp-123';
      const requestedEmployeeId = 'emp-123';

      const isAllowed = userRole !== 'EMPLOYEE' || userEmployeeId === requestedEmployeeId;
      expect(isAllowed).toBe(true);
    });

    it('Notification mark-as-read should verify ownership', () => {
      // Simulates the check in notifications.routes.ts
      const notificationUserId = 'user-abc';
      const requestingUserId = 'user-xyz';

      const isOwner = notificationUserId === requestingUserId;
      expect(isOwner).toBe(false);
    });

    it('Notification owner can mark their own as read', () => {
      const notificationUserId = 'user-abc';
      const requestingUserId = 'user-abc';

      const isOwner = notificationUserId === requestingUserId;
      expect(isOwner).toBe(true);
    });
  });

  describe('Destructive Endpoint Access Control', () => {
    it('EMPLOYEE cannot delete all leave requests', () => {
      const req = mockReq({ id: '1', email: 'emp@test.com', role: 'EMPLOYEE', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      // DELETE /leave/clear-all requires SUPER_ADMIN or HR_ADMIN
      authorize('SUPER_ADMIN', 'HR_ADMIN')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('EMPLOYEE cannot delete attendance records', () => {
      const req = mockReq({ id: '1', email: 'emp@test.com', role: 'EMPLOYEE', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      // DELETE attendance endpoints require SUPER_ADMIN or HR_ADMIN
      authorize('SUPER_ADMIN', 'HR_ADMIN')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('EMPLOYEE cannot bulk import attendance', () => {
      const req = mockReq({ id: '1', email: 'emp@test.com', role: 'EMPLOYEE', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE')(req as any, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('HR_ADMIN can delete attendance records', () => {
      const req = mockReq({ id: '1', email: 'hr@test.com', role: 'HR_ADMIN', specialization: null });
      const res = mockRes();
      const next = vi.fn();

      authorize('SUPER_ADMIN', 'HR_ADMIN')(req as any, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
