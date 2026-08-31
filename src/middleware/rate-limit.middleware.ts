import { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { sendApiError } from '../utils/api-error';

function positiveInt(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

type RateLimitedRequest = Request & {
  rateLimit?: { resetTime?: Date };
};

function limiter(name: string, windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    identifier: name,
    handler: (req: Request, res: Response) => {
      sendApiError(res, 429, {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
      });
    },
  });
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: positiveInt('RATE_LIMIT_LOGIN', 5),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  identifier: 'auth-login',
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    sendApiError(res, 429, {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts',
    });
  },
});

export const refreshLimiter = limiter(
  'auth-refresh',
  15 * 60 * 1000,
  positiveInt('RATE_LIMIT_REFRESH', 30)
);

export const passwordLimiter = limiter(
  'auth-password',
  60 * 60 * 1000,
  positiveInt('RATE_LIMIT_PASSWORD', 10)
);

export const csrfTokenLimiter = limiter(
  'auth-csrf',
  15 * 60 * 1000,
  positiveInt('RATE_LIMIT_CSRF', 60)
);

export const publicApiLimiter = limiter(
  'public-api',
  15 * 60 * 1000,
  positiveInt('RATE_LIMIT_PUBLIC', 300)
);

export const adminApiLimiter = limiter(
  'admin-api',
  15 * 60 * 1000,
  positiveInt('RATE_LIMIT_ADMIN', 600)
);

export const contactLimiter = limiter(
  'contact-submit',
  60 * 60 * 1000,
  positiveInt('RATE_LIMIT_CONTACT', 5)
);

export const viewLimiter = limiter(
  'blog-view',
  15 * 60 * 1000,
  positiveInt('RATE_LIMIT_VIEW', 120)
);

export const uploadLimiter = limiter(
  'admin-upload',
  60 * 60 * 1000,
  positiveInt('RATE_LIMIT_UPLOAD', 60)
);
