import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ChangePasswordSchema, LoginSchema, SeedAdminSchema } from './auth.types';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

const cookieSecure =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = LoginSchema.parse(req.body);
      const { user, tokens } = await authService.login(dto);

      res.cookie('access_token', tokens.accessToken, COOKIE_OPTIONS);
      res.cookie('refresh_token', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(res, {
        user: { id: user.id, email: user.email },
        accessToken: tokens.accessToken,
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    sendSuccess(res, null, 'Logged out');
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refresh_token;
      if (!token) {
        res.status(401).json({ success: false, message: 'No refresh token' });
        return;
      }
      const tokens = await authService.refreshTokens(token);
      res.cookie('access_token', tokens.accessToken, COOKIE_OPTIONS);
      sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    sendSuccess(res, req.user, 'Current user');
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const dto = ChangePasswordSchema.parse(req.body);
      await authService.changePassword(req.user.id, dto);
      sendSuccess(res, null, 'Password updated');
    } catch (err) {
      next(err);
    }
  },

  async seedAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ success: false, message: 'Forbidden in production' });
        return;
      }
      const dto = SeedAdminSchema.parse(req.body);
      const user = await authService.seedAdmin(dto.email, dto.password);
      sendSuccess(res, { id: user.id, email: user.email }, 'Admin created', 201);
    } catch (err) {
      next(err);
    }
  },
};
