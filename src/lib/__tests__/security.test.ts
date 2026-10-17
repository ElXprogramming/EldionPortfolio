import { describe, expect, it } from 'vitest';
import {
  createRateLimiter,
  createSafeErrorMessage,
  sanitizeExternalUrl,
  sanitizeInternalRoute,
  sanitizeMailtoUrl,
  sanitizeRichHtml,
  sanitizeTelUrl,
  sanitizeText,
} from '../security';

describe('security utilities', () => {
  describe('sanitizeText', () => {
    it('strips HTML tags, script payloads, and ASCII control characters', () => {
      const dirty = '  Hello <script>alert("xss")</script>\x00\x07World!  ';
      expect(sanitizeText(dirty)).toBe('Hello World!');
    });

    it('preserves safe newlines and tabs while stripping tags', () => {
      const dirty = 'Line 1\n<b>Line 2</b>';
      expect(sanitizeText(dirty)).toBe('Line 1\nLine 2');
    });
  });

  describe('sanitizeRichHtml', () => {
    it('removes script tags and inline event handlers', () => {
      const dirty = '<p onclick="evil()">Safe</p><script>alert(1)</script><img src=x onerror=alert(1)>';
      const clean = sanitizeRichHtml(dirty);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('Safe');
    });
  });

  describe('sanitizeExternalUrl', () => {
    it('allows valid https URLs', () => {
      expect(sanitizeExternalUrl('https://github.com/ElXprogramming')).toBe(
        'https://github.com/ElXprogramming'
      );
    });

    it('blocks javascript:, data:, and vbscript: URI schemes', () => {
      expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeExternalUrl('JAVASCRIPT:alert(document.cookie)')).toBeNull();
      expect(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(sanitizeExternalUrl('vbscript:msgbox("xss")')).toBeNull();
      expect(sanitizeExternalUrl('http://insecure.example.com')).toBeNull();
    });

    it('blocks URLs with embedded credentials or invalid hosts when allowlist is provided', () => {
      expect(sanitizeExternalUrl('https://user:pass@github.com')).toBeNull();
      expect(
        sanitizeExternalUrl('https://evil.com/phish', ['github.com', 'www.linkedin.com'])
      ).toBeNull();
      expect(
        sanitizeExternalUrl('https://github.com/ElXprogramming', ['github.com'])
      ).toBe('https://github.com/ElXprogramming');
    });
  });

  describe('sanitizeMailtoUrl', () => {
    it('constructs a safe mailto link for valid email and subject', () => {
      const result = sanitizeMailtoUrl('alex@example.com', 'Hello & Inquiry\r\nBcc: attacker@evil.com');
      expect(result).toBe(
        'mailto:alex@example.com?subject=Re%3A%20Hello%20%26%20Inquiry%20Bcc%3A%20attacker%40evil.com'
      );
    });

    it('returns fallback # for invalid or malicious email addresses', () => {
      expect(sanitizeMailtoUrl('javascript:alert(1)')).toBe('#');
      expect(sanitizeMailtoUrl('not-an-email')).toBe('#');
    });
  });

  describe('sanitizeTelUrl', () => {
    it('constructs a safe tel link for valid phone numbers', () => {
      expect(sanitizeTelUrl('017-820 1365')).toBe('tel:0178201365');
      expect(sanitizeTelUrl('+60 17-820 1365')).toBe('tel:+60178201365');
    });

    it('returns fallback # for invalid phone inputs', () => {
      expect(sanitizeTelUrl('javascript:alert(1)')).toBe('#');
      expect(sanitizeTelUrl('abc')).toBe('#');
    });
  });

  describe('sanitizeInternalRoute', () => {
    it('allows known safe hash anchors and internal paths', () => {
      expect(sanitizeInternalRoute('#about')).toBe('#about');
      expect(sanitizeInternalRoute('#projects')).toBe('#projects');
      expect(sanitizeInternalRoute('#inbox')).toBe('#inbox');
      expect(sanitizeInternalRoute('/Eldion_Ryan_Godius_Resume.pdf')).toBe(
        '/Eldion_Ryan_Godius_Resume.pdf'
      );
    });

    it('blocks open redirects and dangerous schemes', () => {
      expect(sanitizeInternalRoute('//evil.com')).toBe('#');
      expect(sanitizeInternalRoute('https://evil.com')).toBe('#');
      expect(sanitizeInternalRoute('javascript:alert(1)')).toBe('#');
      expect(sanitizeInternalRoute('/\\evil.com')).toBe('#');
    });
  });

  describe('createRateLimiter', () => {
    it('allows requests within quota and blocks once quota is exceeded', () => {
      let currentTime = 1_000;
      const limiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 60_000,
        nowFn: () => currentTime,
      });

      expect(limiter.tryConsume('contact').allowed).toBe(true);
      expect(limiter.tryConsume('contact').allowed).toBe(true);

      const thirdAttempt = limiter.tryConsume('contact');
      expect(thirdAttempt.allowed).toBe(false);
      expect(thirdAttempt.retryAfterSeconds).toBe(60);

      currentTime += 60_001;
      expect(limiter.tryConsume('contact').allowed).toBe(true);
    });
  });

  describe('createSafeErrorMessage', () => {
    it('masks raw database errors, stack traces, and file paths', () => {
      const dbError = new Error(
        'relation "public.contact_messages" does not exist at /var/lib/postgresql/data:5432'
      );
      const msg = createSafeErrorMessage(dbError, 'Unable to process your request right now.');
      expect(msg).toBe('Unable to process your request right now.');
      expect(msg).not.toContain('contact_messages');
      expect(msg).not.toContain('/var/lib');
    });

    it('preserves safe validation or rate-limit user notices when explicitly marked safe', () => {
      const rateError = new Error('Too many requests. Please wait 30 seconds before trying again.');
      rateError.name = 'SafeUserError';
      expect(createSafeErrorMessage(rateError, 'Fallback')).toBe(
        'Too many requests. Please wait 30 seconds before trying again.'
      );
    });
  });
});
