import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  deviceId?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  employeeId: string | null;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  departmentId: string | null;
  specialization?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export type Role = 'SUPER_ADMIN' | 'HR_ADMIN' | 'HR_EXECUTIVE' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE';
