import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const SeedAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type SeedAdminDto = z.infer<typeof SeedAdminSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

export interface JwtPayload {
  id: number;
  email: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRequestMeta {
  ipHash: string;
  userAgentHash: string;
}
