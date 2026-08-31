import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';
import { createCsrfToken, isCsrfTokenValid } from '../../middleware/csrf.middleware';
import { getClientIp, hashIp } from '../../utils/hash';
import { sendSuccess } from '../../utils/response';
import { sendApiError } from '../../utils/api-error';
import { clearAuthCookies, setAuthCookies, setCsrfCookie } from './auth.cookies';
import { authService } from './auth.service';
import { ChangePasswordSchema, LoginSchema, SeedAdminSchema } from './auth.types';

function requestMeta(req: Request) {
  const userAgent = req.get('user-agent') || 'unknown';
  return {
    ipHash: hashIp(getClientIp(req)),
    userAgentHash: crypto.createHash('sha256').update(userAgent).digest('hex'),
  };
}

function issueCsrf(req: Request, res: Response, sessionId: string): string {
  const currentToken = req.cookies?.csrf_token;
  if (currentToken && isCsrfTokenValid(currentToken, sessionId)) return currentToken;
  const csrfToken = createCsrfToken(sessionId);
  setCsrfCookie(res, csrfToken);
  return csrfToken;
}

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = LoginSchema.parse(req.body);
      const { user, session, tokens } = await authService.login(dto, requestMeta(req));
      setAuthCookies(res, tokens);
      const csrfToken = issueCsrf(req, res, session.id);

      sendSuccess(
        res,
        { user: { id: user.id, email: user.email }, csrfToken },
        'Login successful'
      );
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) await authService.revokeSession(refreshToken);
      clearAuthCookies(res);
      sendSuccess(res, null, 'Logged out');
    } catch (err) {
      clearAuthCookies(res);
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        sendApiError(res, 401, {
          code: 'UNAUTHORIZED',
          message: 'No refresh token',
        });
        return;
      }

      const { session, tokens } = await authService.refreshTokens(refreshToken, requestMeta(req));
      setAuthCookies(res, tokens);
      const csrfToken = issueCsrf(req, res, session.id);
      sendSuccess(res, { csrfToken }, 'Token refreshed');
    } catch (err) {
      if (!(err instanceof AppError && err.statusCode === 409)) clearAuthCookies(res);
      next(err);
    }
  },

  async csrf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        sendApiError(res, 401, {
          code: 'UNAUTHORIZED',
          message: 'No refresh token',
        });
        return;
      }
      const session = await authService.getActiveRefreshSession(refreshToken);
      const csrfToken = issueCsrf(req, res, session.id);
      sendSuccess(res, { csrfToken }, 'CSRF token issued');
    } catch (err) {
      next(err);
    }
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      sendApiError(res, 401, { code: 'UNAUTHORIZED', message: 'Unauthorized' });
      return;
    }
    const csrfToken = issueCsrf(req, res, req.user.sessionId);
    sendSuccess(
      res,
      { id: req.user.id, email: req.user.email, csrfToken },
      'Current user'
    );
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendApiError(res, 401, { code: 'UNAUTHORIZED', message: 'Unauthorized' });
        return;
      }
      const dto = ChangePasswordSchema.parse(req.body);
      await authService.changePassword(req.user.id, dto);
      clearAuthCookies(res);
      sendSuccess(res, { reauthenticate: true }, 'Password updated; please sign in again');
    } catch (err) {
      next(err);
    }
  },

  async seedAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        sendApiError(res, 403, {
          code: 'FORBIDDEN',
          message: 'Forbidden in production',
        });
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
