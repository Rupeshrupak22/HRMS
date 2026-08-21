import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or employee code is required').max(254, 'Identifier too long'),
  password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
  forceLogin: z.boolean().optional(),
  deviceId: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
