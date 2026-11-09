import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  ApiErrorCode,
  defaultErrorCode,
  sendApiError,
} from '../utils/api-error';
import { logger } from '../config/logger';

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
    res.locals.errorCode = 'VALIDATION_ERROR';
    logger.warn({
      event: 'request_rejected',
      request_id: res.locals.requestId,
      error_code: 'VALIDATION_ERROR',
      status: 422,
    }, 'Request validation failed');

    sendApiError(res, 422, {
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      details: err.issues,
    });
    return;
  }

  if (err instanceof AppError) {
    res.locals.errorCode = err.code;
    logger.warn({
      event: 'request_rejected',
      request_id: res.locals.requestId,
      error_code: err.code,
      status: err.statusCode,
    }, 'Request rejected');

    sendApiError(res, err.statusCode, {
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  res.locals.errorCode = 'INTERNAL_ERROR';
  logger.error({
    event: 'application_error',
    request_id: res.locals.requestId,
    error_code: 'INTERNAL_ERROR',
    err,
  }, 'Unhandled application error');

  sendApiError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  });
}
