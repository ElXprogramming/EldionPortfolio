import DOMPurify from 'dompurify';

const CRLF_REGEX = /[\r\n]+/g;
const SCRIPT_STYLE_BLOCK_REGEX = /<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_TAG_REGEX = /<[^>]*>/g;
const EVENT_HANDLER_ATTR_REGEX = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const SAFE_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const SAFE_PHONE_REGEX = /^\+?[0-9]{7,15}$/;

function stripControlChars(input: string): string {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
    const isPrintable = code >= 32 && code !== 127;
    if (isAllowedWhitespace || isPrintable) {
      result += input[i];
    }
  }
  return result;
}

const ALLOWED_INTERNAL_HASHES: ReadonlySet<string> = new Set([
  '#',
  '#hero',
  '#about',
  '#skills',
  '#projects',
  '#contributions',
  '#github',
  '#activity',
  '#education',
  '#contact',
  '#inbox',
  '#admin',
  '#secret-inbox',
]);

const ALLOWED_INTERNAL_PATHS: ReadonlySet<string> = new Set([
  '/',
  '/inbox',
  '/admin',
  '/Eldion_Ryan_Godius_Resume.pdf',
]);

export class SafeUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeUserError';
  }
}

export function sanitizeText(input: string): string {
  const withoutControls = stripControlChars(input);
  const withoutScripts = withoutControls.replace(SCRIPT_STYLE_BLOCK_REGEX, '');
  const domPurified =
    typeof window !== 'undefined' && DOMPurify.isSupported
      ? DOMPurify.sanitize(withoutScripts, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      : withoutScripts.replace(HTML_TAG_REGEX, '');

  return domPurified.replace(HTML_TAG_REGEX, '').trim();
}

export function sanitizeRichHtml(dirtyHtml: string): string {
  const withoutControls = stripControlChars(dirtyHtml);
  if (typeof window !== 'undefined' && DOMPurify.isSupported) {
    return DOMPurify.sanitize(withoutControls, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'style'],
    });
  }

  return withoutControls
    .replace(SCRIPT_STYLE_BLOCK_REGEX, '')
    .replace(EVENT_HANDLER_ATTR_REGEX, '');
}

export function sanitizeExternalUrl(
  rawUrl: string,
  allowedHosts?: readonly string[]
): string | null {
  const trimmed = stripControlChars(rawUrl).trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    if (parsed.username || parsed.password) {
      return null;
    }
    if (allowedHosts && allowedHosts.length > 0) {
      const normalizedHost = parsed.hostname.toLowerCase();
      const isAllowed = allowedHosts.some((host) => host.toLowerCase() === normalizedHost);
      if (!isAllowed) {
        return null;
      }
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeMailtoUrl(email: string, subject?: string): string {
  const cleanedEmail = stripControlChars(email).trim().replace(CRLF_REGEX, '');
  if (!SAFE_EMAIL_REGEX.test(cleanedEmail) || cleanedEmail.length > 254) {
    return '#';
  }

  if (!subject) {
    return `mailto:${cleanedEmail}`;
  }

  const cleanedSubject = stripControlChars(subject)
    .replace(CRLF_REGEX, ' ')
    .trim()
    .slice(0, 150);

  const encodedSubject = encodeURIComponent(`Re: ${cleanedSubject}`);
  return `mailto:${cleanedEmail}?subject=${encodedSubject}`;
}

export function sanitizeTelUrl(phone: string): string {
  const normalized = phone.replace(/[\s()-]/g, '').trim();
  if (!SAFE_PHONE_REGEX.test(normalized)) {
    return '#';
  }
  return `tel:${normalized}`;
}

export function sanitizeInternalRoute(hashOrPath: string): string {
  const trimmed = hashOrPath.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '#';
  }
  if (ALLOWED_INTERNAL_HASHES.has(trimmed.toLowerCase())) {
    return trimmed;
  }
  if (ALLOWED_INTERNAL_PATHS.has(trimmed)) {
    return trimmed;
  }
  return '#';
}

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  nowFn?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  tryConsume: (key: string) => RateLimitResult;
  reset: (key: string) => void;
}

export function createRateLimiter({
  maxRequests,
  windowMs,
  nowFn = () => Date.now(),
}: RateLimiterOptions): RateLimiter {
  let buckets: Readonly<Record<string, readonly number[]>> = {};

  const tryConsume = (key: string): RateLimitResult => {
    const now = nowFn();
    const windowStart = now - windowMs;
    const recentTimestamps = (buckets[key] ?? []).filter((ts) => ts > windowStart);

    if (recentTimestamps.length >= maxRequests) {
      const oldestTimestamp = recentTimestamps[0] ?? now;
      const retryAfterMs = Math.max(1_000, oldestTimestamp + windowMs - now);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1_000),
      };
    }

    buckets = {
      ...buckets,
      [key]: [...recentTimestamps, now],
    };

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  };

  const reset = (key: string): void => {
    const { [key]: _removed, ...remaining } = buckets;
    void _removed;
    buckets = remaining;
  };

  return { tryConsume, reset };
}

export function createSafeErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.name === 'SafeUserError') {
    return error.message;
  }
  return fallbackMessage;
}
