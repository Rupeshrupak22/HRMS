import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
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
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export type Role = 'SUPER_ADMIN' | 'HR_ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE';
