import { NextFunction, Request, Response } from 'express';
import { AppError } from './error.middleware';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function trustedOriginMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next();

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!allowedOrigins.includes(origin)) {
    return next(new AppError('Untrusted request origin', 403));
  }
  next();
}
