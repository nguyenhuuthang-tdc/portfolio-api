import { Response } from 'express';
import { ApiErrorCode, defaultErrorCode, sendApiError } from './api-error';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  details?: unknown,
  code: ApiErrorCode = defaultErrorCode(statusCode)
): Response {
  return sendApiError(res, statusCode, { code, message, details });
}

export function sendPaginated<T>(
  res: Response,
  rows: T[],
  total: number,
  page: number,
  limit: number
): Response {
  return res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
