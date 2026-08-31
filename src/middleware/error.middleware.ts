import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  ApiErrorCode,
  defaultErrorCode,
  sendApiError,
} from '../utils/api-error';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code: ApiErrorCode = defaultErrorCode(statusCode),
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    sendApiError(res, 422, {
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      details: err.issues,
    });
    return;
  }

  if (err instanceof AppError) {
    sendApiError(res, err.statusCode, {
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  console.error('[Error]', err);
  sendApiError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  });
}
