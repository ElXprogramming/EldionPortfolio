import { describe, expect, it } from 'vitest';
import {
  adminLoginInputSchema,
  contactMessageInputSchema,
  contactMessageResponseSchema,
  messageIdSchema,
  toggleReadInputSchema,
  validateClientEnv,
} from '../schemas';

describe('validation schemas', () => {
  describe('contactMessageInputSchema', () => {
    it('validates and strips unknown fields from a valid contact payload', () => {
      const input = {
        name: '  Alex Tan  ',
        email: '  ALEX@Example.com ',
        subject: '  Project Inquiry  ',
        message: '  Hello Eldion, let us collaborate on a web app.  ',
        isAdmin: true,
        role: 'superuser',
      };

      const parsed = contactMessageInputSchema.parse(input);
      expect(parsed).toEqual({
        name: 'Alex Tan',
        email: 'alex@example.com',
        subject: 'Project Inquiry',
        message: 'Hello Eldion, let us collaborate on a web app.',
      });
      expect('isAdmin' in parsed).toBe(false);
      expect('role' in parsed).toBe(false);
    });

    it('rejects payloads with invalid email, empty fields, or oversized content', () => {
      expect(() =>
        contactMessageInputSchema.parse({
          name: '',
          email: 'bad-email',
          subject: 'Hi',
          message: 'Hello',
        })
      ).toThrow();

      expect(() =>
        contactMessageInputSchema.parse({
          name: 'Alex',
          email: 'alex@example.com',
          subject: 'Hi',
          message: 'a'.repeat(2001),
        })
      ).toThrow();
    });
  });

  describe('adminLoginInputSchema', () => {
    it('validates email and password and strips unknown properties', () => {
      const parsed = adminLoginInputSchema.parse({
        email: ' Admin@Example.com ',
        password: 'StrongPassword123!',
        extraField: 'malicious',
      });
      expect(parsed).toEqual({
        email: 'admin@example.com',
        password: 'StrongPassword123!',
      });
    });

    it('rejects short passwords or malformed emails', () => {
      expect(() =>
        adminLoginInputSchema.parse({
          email: 'not-an-email',
          password: '123',
        })
      ).toThrow();
    });
  });

  describe('messageIdSchema and toggleReadInputSchema', () => {
    it('accepts valid UUIDs and rejects SQL injection / non-UUID strings', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(messageIdSchema.parse(validUuid)).toBe(validUuid);
      expect(() => messageIdSchema.parse('1 OR 1=1; DROP TABLE contact_messages;--')).toThrow();

      const toggleParsed = toggleReadInputSchema.parse({
        id: validUuid,
        isRead: true,
        injected: 'bad',
      });
      expect(toggleParsed).toEqual({ id: validUuid, isRead: true });
    });
  });

  describe('contactMessageResponseSchema', () => {
    it('filters database rows to only required UI fields', () => {
      const rawRow = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Alex Tan',
        email: 'alex@example.com',
        subject: 'Hello',
        message: 'Test message',
        created_at: '2026-10-17T00:00:00Z',
        is_read: false,
        internal_flag: 'secret_internal_data',
        password_hash: '$2b$10$abcdef',
      };

      const filtered = contactMessageResponseSchema.parse(rawRow);
      expect(filtered).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Alex Tan',
        email: 'alex@example.com',
        subject: 'Hello',
        message: 'Test message',
        created_at: '2026-10-17T00:00:00Z',
        is_read: false,
      });
      expect('internal_flag' in filtered).toBe(false);
      expect('password_hash' in filtered).toBe(false);
    });
  });

  describe('validateClientEnv', () => {
    it('accepts valid https Supabase URL and anon key', () => {
      const result = validateClientEnv({
        VITE_SUPABASE_URL: 'https://exampleproject.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid',
      });
      expect(result.isConfigured).toBe(true);
      expect(result.supabaseUrl).toBe('https://exampleproject.supabase.co');
    });

    it('detects forbidden secret keys accidentally prefixed with VITE_', () => {
      expect(() =>
        validateClientEnv({
          VITE_SUPABASE_URL: 'https://exampleproject.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid',
          VITE_SERVICE_ROLE_KEY: 'super-secret-service-role',
        })
      ).toThrow(/Forbidden secret environment variable/);
    });
  });
});
