import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

function resolveRequestId(req: Request): string {
  const incomingRequestId = req.get('x-request-id');

  if (incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId)) {
    return incomingRequestId;
  }

  return randomUUID();
}

function resolveRouteTemplate(req: Request): string {
  const routePath = req.route?.path;

  if (typeof routePath !== 'string') {
    return 'unmatched';
  }

  const route = `${req.baseUrl}${routePath}`.replace(/\/{2,}/g, '/');
  return route || '/';
}

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = resolveRequestId(req);
  const startedAt = process.hrtime.bigint();

  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const fields = {
      event: 'http_request_completed',
      request_id: requestId,
      method: req.method,
      route: resolveRouteTemplate(req),
      status: res.statusCode,
      duration_ms: Number(durationMs.toFixed(3)),
      ...(res.locals.errorCode
        ? { error_code: String(res.locals.errorCode) }
        : {}),
    };

    if (res.statusCode >= 500) {
      logger.error(fields, 'HTTP request completed with server error');
    } else if (res.statusCode >= 400) {
      logger.warn(fields, 'HTTP request completed with client error');
    } else {
      logger.info(fields, 'HTTP request completed');
    }
  });

  next();
}
