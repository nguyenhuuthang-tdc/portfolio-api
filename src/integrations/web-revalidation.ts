import crypto from 'crypto';
import { logger } from '../config/logger';

export type WebRevalidationEvent =
  | { event: 'blog.changed'; slugs: string[] }
  | { event: 'blog-category.changed' }
  | { event: 'project.changed'; slugs: string[] }
  | { event: 'about.changed'; keys: string[] }
  | { event: 'skill.changed' };

const DEFAULT_TIMEOUT_MS = 2500;
const MAX_ATTEMPTS = 2;
let configurationWarningReported = false;

function timeoutMs(): number {
  const configured = Number(process.env.WEB_REVALIDATION_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return DEFAULT_TIMEOUT_MS;
  return Math.min(10_000, Math.max(500, Math.floor(configured)));
}

function configuration(): { url: string; secret: string } | null {
  const url = process.env.WEB_REVALIDATION_URL?.trim();
  const secret = process.env.WEB_REVALIDATION_SECRET;

  if (!url && !secret) return null;
  if (!url || !secret || secret.length < 32) {
    if (!configurationWarningReported) {
      configurationWarningReported = true;
      logger.error({
        event: 'web_revalidation_configuration_invalid',
        reason: 'url_or_secret_missing',
      }, 'Web revalidation configuration is invalid');
    }
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('invalid protocol');
  } catch {
    if (!configurationWarningReported) {
      configurationWarningReported = true;
      logger.error({
        event: 'web_revalidation_configuration_invalid',
        reason: 'url_invalid',
      }, 'Web revalidation configuration is invalid');
    }
    return null;
  }

  return { url, secret };
}

function signature(body: string, timestamp: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown delivery error';
}

export async function publishWebRevalidation(payload: WebRevalidationEvent): Promise<boolean> {
  const config = configuration();
  if (!config) return false;

  const body = JSON.stringify(payload);
  let lastFailure = 'Unknown delivery error';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Revalidation-Timestamp': timestamp,
          'X-Revalidation-Signature': signature(body, timestamp, config.secret),
        },
        body,
        signal: AbortSignal.timeout(timeoutMs()),
      });

      if (response.ok) return true;
      lastFailure = `Web returned HTTP ${response.status}`;
    } catch (error) {
      lastFailure = errorMessage(error);
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
    }
  }

  logger.error({
    event: 'web_revalidation_delivery_failed',
    revalidation_event: payload.event,
    failure_reason: lastFailure,
    attempts: MAX_ATTEMPTS,
  }, 'Web revalidation delivery failed');
  return false;
}
