import { CookieOptions, Response } from 'express';
import { AuthTokens } from './auth.types';

export const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production';
}

function cookieSameSite(): 'lax' | 'strict' | 'none' {
  const value = process.env.COOKIE_SAME_SITE?.toLowerCase();
  if (value === 'strict' || value === 'none') return value;
  return 'lax';
}

function commonOptions(httpOnly: boolean, path = '/'): CookieOptions {
  const options: CookieOptions = {
    httpOnly,
    secure: cookieSecure(),
    sameSite: cookieSameSite(),
    path,
  };
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie('access_token', tokens.accessToken, {
    ...commonOptions(true),
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  res.cookie('refresh_token', tokens.refreshToken, {
    ...commonOptions(true),
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie('csrf_token', token, {
    ...commonOptions(true),
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', commonOptions(true));
  res.clearCookie('refresh_token', commonOptions(true));
  res.clearCookie('csrf_token', commonOptions(true));
}
