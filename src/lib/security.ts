import DOMPurify from 'dompurify';
import { stripControlChars } from './urlSecurity';

export {
  SafeUserError,
  sanitizeExternalUrl,
  sanitizeMailtoUrl,
  sanitizeInternalRoute,
  resolveAppView,
  createRateLimiter,
  createSafeErrorMessage,
  copyToClipboard,
  type RateLimiterOptions,
  type RateLimitResult,
  type RateLimiter,
} from './urlSecurity';

const SCRIPT_STYLE_BLOCK_REGEX = /<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HTML_TAG_REGEX = /<[^>]*>/g;

export function sanitizeText(input: string): string {
  const withoutControls = stripControlChars(input);
  const withoutScripts = withoutControls.replace(SCRIPT_STYLE_BLOCK_REGEX, '');
  const domPurified =
    typeof window !== 'undefined' && DOMPurify.isSupported
      ? DOMPurify.sanitize(withoutScripts, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      : withoutScripts.replace(HTML_TAG_REGEX, '');

  return domPurified.replace(HTML_TAG_REGEX, '').trim();
}
