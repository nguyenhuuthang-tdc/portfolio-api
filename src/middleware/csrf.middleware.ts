import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from './error.middleware';
import { authService } from '../modules/auth/auth.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('CSRF_SECRET or JWT_SECRET is required');
  return secret;
}

function signature(sessionId: string, nonce: string): string {
  return crypto.createHmac('sha256', csrfSecret()).update(`${sessionId}.${nonce}`).digest('base64url');
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCsrfToken(sessionId: string): string {
  const nonce = crypto.randomBytes(32).toString('base64url');
  return `${nonce}.${signature(sessionId, nonce)}`;
}

export function isCsrfTokenValid(token: string, sessionId: string): boolean {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;
  const nonce = token.slice(0, separator);
  const presentedSignature = token.slice(separator + 1);
  return constantTimeEqual(presentedSignature, signature(sessionId, nonce));
}

function validateCsrf(req: Request, sessionId: string): void {
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || !constantTimeEqual(cookieToken, headerToken)) {
    throw new AppError('Invalid CSRF token', 403, 'CSRF_INVALID');
  }

  if (!isCsrfTokenValid(cookieToken, sessionId)) {
    throw new AppError('Invalid CSRF token', 403, 'CSRF_INVALID');
  }
}

export function csrfMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (SAFE_METHODS.has(req.method)) return next();
  try {
    if (!req.user?.sessionId) throw new AppError('Unauthorized', 401);
    validateCsrf(req, req.user.sessionId);
    next();
  } catch (error) {
    next(error);
  }
}

export function refreshCsrfMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new AppError('No refresh token', 401);
    const payload = authService.verifyRefreshPayload(refreshToken);
    validateCsrf(req, payload.sessionId);
    next();
  } catch (error) {
    next(error);
  }
}
