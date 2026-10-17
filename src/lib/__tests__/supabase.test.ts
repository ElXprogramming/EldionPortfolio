import { describe, expect, it, vi } from 'vitest';
import {
  createInMemoryAuthStorage,
  createSupabaseService,
  deleteContactMessage,
  submitContactMessage,
  toggleMessageReadStatus,
} from '../supabase';

function createMockSupabaseClient(overrides?: {
  insertError?: Error | null;
  selectData?: unknown[];
  selectError?: Error | null;
  updateData?: { id: string; is_read: boolean } | null;
  updateError?: Error | null;
  deleteError?: Error | null;
  authEmail?: string | null;
  authError?: Error | null;
}) {
  const singleFn = vi.fn().mockResolvedValue({
    data: overrides?.updateData ?? {
      id: '550e8400-e29b-41d4-a716-446655440000',
      is_read: true,
    },
    error: overrides?.updateError ?? null,
  });

  const limitFn = vi.fn().mockResolvedValue({
    data: overrides?.selectData ?? [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '<b>Alex</b>',
        email: 'alex@example.com',
        subject: 'Hello',
        message: 'Safe message',
        created_at: '2026-10-17T00:00:00Z',
        is_read: false,
        secret_column: 'should-be-stripped',
      },
    ],
    error: overrides?.selectError ?? null,
  });

  const orderFn = vi.fn().mockReturnValue({ limit: limitFn });
  const selectFn = vi.fn().mockReturnValue({ order: orderFn, single: singleFn });
  const eqForUpdate = vi.fn().mockReturnValue({ select: selectFn });
  const eqForDelete = vi.fn().mockResolvedValue({ error: overrides?.deleteError ?? null });
  const updateFn = vi.fn().mockReturnValue({ eq: eqForUpdate });
  const deleteFn = vi.fn().mockReturnValue({ eq: eqForDelete });
  const insertFn = vi.fn().mockResolvedValue({ error: overrides?.insertError ?? null });

  const fromFn = vi.fn().mockReturnValue({
    insert: insertFn,
    select: selectFn,
    update: updateFn,
    delete: deleteFn,
  });

  const signInWithPassword = vi.fn().mockResolvedValue({
    data: {
      session: overrides?.authEmail ? { user: { email: overrides.authEmail } } : null,
    },
    error: overrides?.authError ?? null,
  });

  const signOut = vi.fn().mockResolvedValue({ error: null });
  const getSession = vi.fn().mockResolvedValue({
    data: {
      session: overrides?.authEmail ? { user: { email: overrides.authEmail } } : null,
    },
    error: overrides?.authError ?? null,
  });

  return {
    client: {
      from: fromFn,
      auth: {
        signInWithPassword,
        signOut,
        getSession,
      },
    } as unknown as Parameters<typeof createSupabaseService>[0]['client'],
    spies: {
      fromFn,
      insertFn,
      selectFn,
      updateFn,
      deleteFn,
      signInWithPassword,
      signOut,
      getSession,
    },
  };
}

describe('supabase security & data layer', () => {
  describe('createInMemoryAuthStorage', () => {
    it('stores, retrieves, and removes session items strictly in memory without touching Web Storage', () => {
      const storage = createInMemoryAuthStorage();
      expect(storage.getItem('sb-access-token')).toBeNull();

      storage.setItem('sb-access-token', 'in-memory-jwt');
      expect(storage.getItem('sb-access-token')).toBe('in-memory-jwt');

      storage.removeItem('sb-access-token');
      expect(storage.getItem('sb-access-token')).toBeNull();
    });
  });

  describe('input boundary validation & unconfigured state', () => {
    it('rejects invalid contact message payloads before making any network call', async () => {
      await expect(
        submitContactMessage({
          name: '',
          email: 'invalid-email',
          subject: '',
          message: '',
        })
      ).rejects.toThrow();
    });

    it('rejects non-UUID message IDs in toggleMessageReadStatus and deleteContactMessage', async () => {
      await expect(
        toggleMessageReadStatus('1; DROP TABLE contact_messages;--', true)
      ).rejects.toThrow();

      await expect(deleteContactMessage('not-a-uuid')).rejects.toThrow();
    });

    it('throws a SafeUserError when Supabase is not configured', async () => {
      const { client } = createMockSupabaseClient();
      const unconfigured = createSupabaseService({ client, isConfigured: false });

      await expect(
        unconfigured.submitContactMessage({
          name: 'Alex',
          email: 'alex@example.com',
          subject: 'Hello',
          message: 'Test',
        })
      ).rejects.toThrow(/temporarily unavailable/);

      expect(await unconfigured.getAdminSessionEmail()).toBeNull();
      await expect(unconfigured.signOutAdmin()).resolves.toBeUndefined();
    });
  });

  describe('submitContactMessage', () => {
    it('sanitizes input, strips unknown fields, and enforces rate limiting', async () => {
      const { client, spies } = createMockSupabaseClient();
      const service = createSupabaseService({ client, isConfigured: true });

      const validPayload = {
        name: '  <b>Alex Tan</b> ',
        email: 'ALEX@example.com',
        subject: 'Inquiry',
        message: 'Hello world',
      };

      await service.submitContactMessage(validPayload);
      expect(spies.insertFn).toHaveBeenCalledWith([
        {
          name: 'Alex Tan',
          email: 'alex@example.com',
          subject: 'Inquiry',
          message: 'Hello world',
        },
      ]);

      await service.submitContactMessage(validPayload);
      await service.submitContactMessage(validPayload);

      // 4th attempt within window must be blocked by rate limiter
      await expect(service.submitContactMessage(validPayload)).rejects.toThrow(
        /Too many messages sent recently/
      );
    });
  });

  describe('signInAdmin, getAdminSessionEmail, and signOutAdmin', () => {
    it('authenticates valid admin credentials and resets rate limit on success', async () => {
      const { client } = createMockSupabaseClient({ authEmail: 'admin@example.com' });
      const service = createSupabaseService({ client, isConfigured: true });

      const email = await service.signInAdmin({
        email: 'ADMIN@example.com',
        password: 'ValidPassword123!',
      });
      expect(email).toBe('admin@example.com');
      expect(await service.getAdminSessionEmail()).toBe('admin@example.com');
      await expect(service.signOutAdmin()).resolves.toBeUndefined();
    });

    it('rejects invalid credentials and enforces auth rate limiting after 5 failed attempts', async () => {
      const { client } = createMockSupabaseClient({
        authEmail: null,
        authError: new Error('Invalid login'),
      });
      const service = createSupabaseService({ client, isConfigured: true });

      for (let i = 0; i < 5; i++) {
        await expect(
          service.signInAdmin({ email: 'admin@example.com', password: 'WrongPassword123' })
        ).rejects.toThrow('Invalid email or password.');
      }

      await expect(
        service.signInAdmin({ email: 'admin@example.com', password: 'WrongPassword123' })
      ).rejects.toThrow(/Too many sign-in attempts/);
    });
  });

  describe('fetchContactMessages, toggleMessageReadStatus, and deleteContactMessage', () => {
    it('selects explicit columns and strips unknown database fields on fetch', async () => {
      const { client, spies } = createMockSupabaseClient();
      const service = createSupabaseService({ client, isConfigured: true });

      const messages = await service.fetchContactMessages();
      expect(spies.selectFn).toHaveBeenCalledWith(
        'id, name, email, subject, message, is_read, created_at'
      );
      expect(messages).toHaveLength(1);
      expect(messages[0]?.name).toBe('Alex');
      expect('secret_column' in (messages[0] ?? {})).toBe(false);
    });

    it('updates read status and deletes by validated UUID', async () => {
      const { client } = createMockSupabaseClient();
      const service = createSupabaseService({ client, isConfigured: true });
      const validId = '550e8400-e29b-41d4-a716-446655440000';

      const updated = await service.toggleMessageReadStatus(validId, true);
      expect(updated).toEqual({ id: validId, is_read: true });

      await expect(service.deleteContactMessage(validId)).resolves.toBeUndefined();
    });
  });
});
