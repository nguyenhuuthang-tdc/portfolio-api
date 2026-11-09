import { Response } from 'express';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CSRF_INVALID'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export function defaultErrorCode(statusCode: number): ApiErrorCode {
  switch (statusCode) {
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMITED';
    default:
      return statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
  }
}

export function sendApiError(
  res: Response,
  statusCode: number,
  error: ApiErrorPayload
): Response {
  res.locals.errorCode = error.code;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  });
}
