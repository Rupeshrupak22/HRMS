import { z } from 'zod';

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeCode: z.string().min(1),
  role: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  employmentType: z.string().optional(),
  joiningDate: z.string().optional(),
  mobileNumber: z.string().optional(),
  ctc: z.number().optional(),
  bankAccountNo: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  mobileNumber: z.string().optional(),
  personalEmail: z.string().email().optional(),
  address: z.string().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  teamId: z.string().uuid().nullable().optional(),
  designationId: z.string().uuid().nullable().optional(),
  reportingManagerId: z.string().uuid().nullable().optional(),
  employmentType: z.string().optional(),
  workLocation: z.string().optional(),
  workMode: z.string().optional(),
  status: z.string().optional(),
  bankAccountNo: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emergencyPhone: z.string().optional(),
  profilePhoto: z.string().optional(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
