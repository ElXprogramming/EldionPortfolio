import { z } from 'zod';
import { sanitizeText } from './security';

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 2000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const FORBIDDEN_VITE_SECRET_KEYS: readonly string[] = [
  'VITE_ADMIN_PIN',
  'VITE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_DATABASE_URL',
  'VITE_PRIVATE_KEY',
  'VITE_API_SECRET',
  'VITE_JWT_SECRET',
];

const sanitizedText = () => z.string().transform(sanitizeText);

const sanitizedBoundedText = (max: number, emptyMessage: string, maxMessage: string) =>
  sanitizedText().pipe(z.string().min(1, emptyMessage).max(max, maxMessage));

const sanitizedEmail = (invalidMessage: string) =>
  z
    .string()
    .transform((val) => sanitizeText(val).toLowerCase())
    .pipe(
      z
        .string()
        .email(invalidMessage)
        .max(MAX_EMAIL_LENGTH, `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`)
    );

export const contactMessageInputSchema = z
  .object({
    name: sanitizedBoundedText(
      MAX_NAME_LENGTH,
      'Name is required.',
      `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
    ),
    email: sanitizedEmail('Please provide a valid email address.'),
    subject: sanitizedBoundedText(
      MAX_SUBJECT_LENGTH,
      'Subject is required.',
      `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer.`
    ),
    message: sanitizedBoundedText(
      MAX_MESSAGE_LENGTH,
      'Message cannot be empty.',
      `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`
    ),
  })
  .strip();

export type ContactMessageInput = z.infer<typeof contactMessageInputSchema>;

export const adminLoginInputSchema = z
  .object({
    email: sanitizedEmail('Please enter a valid admin email address.'),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      .max(MAX_PASSWORD_LENGTH, 'Password exceeds maximum allowed length.'),
  })
  .strip();

export type AdminLoginInput = z.infer<typeof adminLoginInputSchema>;

export const messageIdSchema = z.string().uuid('Invalid message identifier.');

export const toggleReadInputSchema = z
  .object({
    id: messageIdSchema,
    isRead: z.boolean(),
  })
  .strip();

export const inboxPasscodeSchema = sanitizedBoundedText(
  100,
  'Passcode is required.',
  'Passcode is too long.'
);

export const contactMessageResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: sanitizedText(),
    email: sanitizedEmail('Invalid email address.'),
    subject: sanitizedText(),
    message: sanitizedText(),
    created_at: z.string(),
    is_read: z
      .boolean()
      .nullable()
      .optional()
      .transform((val) => Boolean(val)),
  })
  .strip();

export type ValidatedContactMessage = z.infer<typeof contactMessageResponseSchema>;

export interface ClientEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
}

const clientEnvObjectSchema = z
  .object({
    VITE_SUPABASE_URL: z
      .string()
      .trim()
      .optional()
      .default('')
      .refine((val) => val === '' || val.startsWith('https://'), {
        message: 'VITE_SUPABASE_URL must use https:// protocol.',
      }),
    VITE_SUPABASE_ANON_KEY: z.string().trim().optional().default(''),
  })
  .strip();

export function validateClientEnv(rawEnv: Record<string, unknown>): ClientEnvConfig {
  for (const forbiddenKey of FORBIDDEN_VITE_SECRET_KEYS) {
    const val = rawEnv[forbiddenKey];
    if (typeof val === 'string' && val.trim().length > 0) {
      throw new Error(
        `Forbidden secret environment variable "${forbiddenKey}" detected in client bundle. Never expose private credentials with VITE_ prefix.`
      );
    }
  }

  const parsed = clientEnvObjectSchema.parse(rawEnv);
  const isConfigured =
    parsed.VITE_SUPABASE_URL.length > 0 && parsed.VITE_SUPABASE_ANON_KEY.length > 0;

  return {
    supabaseUrl: parsed.VITE_SUPABASE_URL,
    supabaseAnonKey: parsed.VITE_SUPABASE_ANON_KEY,
    isConfigured,
  };
}

export {
  githubContributionsResponseSchema,
  leetcodeStatsResponseSchema,
  chessStatsResponseSchema,
  monkeytypeStatsResponseSchema,
  type GithubContributionDay,
  type GithubContributionsResponse,
  type LeetCodeStatsResponse,
  type ChessStatsResponse,
  type MonkeytypeStatsResponse,
} from './statsSchemas';
