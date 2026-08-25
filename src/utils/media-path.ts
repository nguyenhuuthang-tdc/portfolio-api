/**
 * Persist uploads as host-free paths so dumps / local / prod stay portable.
 * External http(s) URLs that are not /uploads stay unchanged.
 */

export function toStoredMediaPath(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const pathname = new URL(trimmed).pathname;
      if (pathname.startsWith('/uploads/')) return pathname;
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function stripMediaOrigins(markdown: string): string {
  if (!markdown) return markdown;
  return markdown
    .replace(/src=(["'])https?:\/\/[^"'/\s]+(\/uploads\/[^"']+)\1/gi, 'src=$1$2$1')
    .replace(/\]\(https?:\/\/[^)\s]+(\/uploads\/[^)]+)\)/g, ']($1');
}

export function toUploadDiskPath(publicPath: string): string {
  const stored = toStoredMediaPath(publicPath) ?? publicPath;
  if (stored.startsWith('http://') || stored.startsWith('https://')) {
    try {
      return new URL(stored).pathname.replace(/^\/uploads\//, '');
    } catch {
      return stored.replace(/^\/uploads\//, '');
    }
  }
  return stored.replace(/^\/uploads\//, '');
}
