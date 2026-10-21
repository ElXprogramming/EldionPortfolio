import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import {
  adminLoginInputSchema,
  contactMessageInputSchema,
  contactMessageResponseSchema,
  inboxPasscodeSchema,
  messageIdSchema,
  toggleReadInputSchema,
  validateClientEnv,
  type AdminLoginInput,
  type ContactMessageInput,
  type ValidatedContactMessage,
} from './schemas';
import { createRateLimiter, SafeUserError } from './security';

const CONTACT_MAX_REQUESTS = 3;
const CONTACT_WINDOW_MS = 10 * 60 * 1_000;
const AUTH_MAX_ATTEMPTS = 5;
const AUTH_WINDOW_MS = 5 * 60 * 1_000;
const MAX_FETCHED_MESSAGES = 100;

const EXPLICIT_MESSAGE_COLUMNS =
  'id, name, email, subject, message, is_read, created_at' as const;

export function createInMemoryAuthStorage(): SupportedStorage {
  const store = new Map<string, string>();

  return {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
  };
}

export type ContactMessage = ValidatedContactMessage;

export interface SupabaseServiceOptions {
  client: Pick<SupabaseClient, 'from' | 'auth'>;
  isConfigured: boolean;
}

export function createSupabaseService({ client, isConfigured }: SupabaseServiceOptions) {
  const contactSubmissionLimiter = createRateLimiter({
    maxRequests: CONTACT_MAX_REQUESTS,
    windowMs: CONTACT_WINDOW_MS,
  });

  const adminAuthLimiter = createRateLimiter({
    maxRequests: AUTH_MAX_ATTEMPTS,
    windowMs: AUTH_WINDOW_MS,
  });

  const ensureConfigured = (): void => {
    if (!isConfigured) {
      throw new SafeUserError(
        'Messaging service is temporarily unavailable. Please reach out directly via email.'
      );
    }
  };

  const submitContactMessage = async (payload: ContactMessageInput): Promise<void> => {
    const parseResult = contactMessageInputSchema.safeParse(payload);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message ?? 'Invalid form input.';
      throw new SafeUserError(firstIssue);
    }

    const rateCheck = contactSubmissionLimiter.tryConsume('contact_submit');
    if (!rateCheck.allowed) {
      throw new SafeUserError(
        `Too many messages sent recently. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`
      );
    }

    ensureConfigured();

    const validated = parseResult.data;
    const { error } = await client.from('contact_messages').insert([
      {
        name: validated.name,
        email: validated.email,
        subject: validated.subject,
        message: validated.message,
      },
    ]);

    if (error) {
      throw new Error('Database insert failed');
    }
  };

  const signInAdmin = async (credentials: AdminLoginInput): Promise<string> => {
    const parseResult = adminLoginInputSchema.safeParse(credentials);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message ?? 'Invalid login credentials.';
      throw new SafeUserError(firstIssue);
    }

    const rateCheck = adminAuthLimiter.tryConsume('admin_login');
    if (!rateCheck.allowed) {
      throw new SafeUserError(
        `Too many sign-in attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before retrying.`
      );
    }

    ensureConfigured();

    const { data, error } = await client.auth.signInWithPassword({
      email: parseResult.data.email,
      password: parseResult.data.password,
    });

    if (error || !data.session?.user?.email) {
      throw new SafeUserError('Invalid email or password.');
    }

    adminAuthLimiter.reset('admin_login');
    return data.session.user.email;
  };

  const signOutAdmin = async (): Promise<void> => {
    if (!isConfigured) {
      return;
    }
    await client.auth.signOut();
  };

  const verifyInboxPasscode = (passcode: string): boolean => {
    const rateCheck = adminAuthLimiter.tryConsume('admin_passcode');
    if (!rateCheck.allowed) {
      throw new SafeUserError(
        `Too many unlock attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before retrying.`
      );
    }

    const parseResult = inboxPasscodeSchema.safeParse(passcode);
    if (!parseResult.success) {
      throw new SafeUserError('Invalid passcode format.');
    }

    const isValid = parseResult.data === 'eldion';
    if (!isValid) {
      throw new SafeUserError('Incorrect passcode.');
    }

    adminAuthLimiter.reset('admin_passcode');
    return true;
  };

  const getAdminSessionEmail = async (): Promise<string | null> => {
    if (!isConfigured) {
      return null;
    }
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.user?.email) {
      return null;
    }
    return data.session.user.email;
  };

  const fetchContactMessages = async (): Promise<ContactMessage[]> => {
    ensureConfigured();

    const { data, error } = await client
      .from('contact_messages')
      .select(EXPLICIT_MESSAGE_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(MAX_FETCHED_MESSAGES);

    if (error) {
      throw new Error('Database select failed');
    }

    const rows = Array.isArray(data) ? data : [];
    return rows.reduce<ContactMessage[]>((acc, row) => {
      const parsed = contactMessageResponseSchema.safeParse(row);
      return parsed.success ? [...acc, parsed.data] : acc;
    }, []);
  };

  const toggleMessageReadStatus = async (
    id: string,
    isRead: boolean
  ): Promise<{ id: string; is_read: boolean }> => {
    const validated = toggleReadInputSchema.parse({ id, isRead });
    ensureConfigured();

    const { data, error } = await client
      .from('contact_messages')
      .update({ is_read: validated.isRead })
      .eq('id', validated.id)
      .select('id, is_read')
      .single();

    if (error || !data) {
      throw new Error('Database update failed');
    }

    return {
      id: String(data.id),
      is_read: Boolean(data.is_read),
    };
  };

  const deleteContactMessage = async (id: string): Promise<void> => {
    const validatedId = messageIdSchema.parse(id);
    ensureConfigured();

    const { error } = await client
      .from('contact_messages')
      .delete()
      .eq('id', validatedId);

    if (error) {
      throw new Error('Database delete failed');
    }
  };

  return {
    submitContactMessage,
    verifyInboxPasscode,
    signInAdmin,
    signOutAdmin,
    getAdminSessionEmail,
    fetchContactMessages,
    toggleMessageReadStatus,
    deleteContactMessage,
  };
}

const envConfig = validateClientEnv(import.meta.env as Record<string, unknown>);
const inMemoryStorage = createInMemoryAuthStorage();

export const supabase = createClient(
  envConfig.isConfigured ? envConfig.supabaseUrl : 'https://placeholder.supabase.co',
  envConfig.isConfigured ? envConfig.supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      storage: inMemoryStorage,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

const defaultService = createSupabaseService({
  client: supabase,
  isConfigured: envConfig.isConfigured,
});

export const submitContactMessage = defaultService.submitContactMessage;
export const verifyInboxPasscode = defaultService.verifyInboxPasscode;
export const signInAdmin = defaultService.signInAdmin;
export const signOutAdmin = defaultService.signOutAdmin;
export const getAdminSessionEmail = defaultService.getAdminSessionEmail;
export const fetchContactMessages = defaultService.fetchContactMessages;
export const toggleMessageReadStatus = defaultService.toggleMessageReadStatus;
export const deleteContactMessage = defaultService.deleteContactMessage;
