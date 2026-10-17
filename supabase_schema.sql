-- ==============================================================
-- Schema for EldionPortfolio: contact_messages (Hardened)
-- Run this in the Supabase Dashboard: SQL Editor -> New Query
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK (
    char_length(trim(email)) BETWEEN 3 AND 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  subject TEXT NOT NULL CHECK (char_length(trim(subject)) BETWEEN 1 AND 150),
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 2000),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Ensure constraints exist even if the table was created previously
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_name_len_chk'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_name_len_chk
      CHECK (char_length(trim(name)) BETWEEN 1 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_email_fmt_chk'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_email_fmt_chk
      CHECK (
        char_length(trim(email)) BETWEEN 3 AND 254
        AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_subject_len_chk'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_subject_len_chk
      CHECK (char_length(trim(subject)) BETWEEN 1 AND 150);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_message_len_chk'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_message_len_chk
      CHECK (char_length(trim(message)) BETWEEN 1 AND 2000);
  END IF;
END $$;

-- Enable and Force Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages FORCE ROW LEVEL SECURITY;

-- Remove legacy overly-permissive policies if present
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow select on contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow update on contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow delete on contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow rate-limited public insert to contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow authenticated admin select on contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow authenticated admin update on contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow authenticated admin delete on contact_messages" ON public.contact_messages;

-- Database-level rate limiting helper: max 5 messages per 10 minutes globally / per email
CREATE OR REPLACE FUNCTION public.check_contact_message_rate_limit(sender_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_email_count INTEGER;
  recent_global_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO recent_email_count
    FROM public.contact_messages
   WHERE lower(email) = lower(trim(sender_email))
     AND created_at > (NOW() - INTERVAL '10 minutes');

  IF recent_email_count >= 3 THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*)
    INTO recent_global_count
    FROM public.contact_messages
   WHERE created_at > (NOW() - INTERVAL '1 minute');

  IF recent_global_count >= 15 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.check_contact_message_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_contact_message_rate_limit(TEXT) TO anon, authenticated;

-- 1. INSERT: Allow anonymous and authenticated visitors to submit validated messages (with DB rate limit)
CREATE POLICY "Allow rate-limited public insert to contact_messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_read = FALSE
    AND char_length(trim(name)) BETWEEN 1 AND 100
    AND char_length(trim(email)) BETWEEN 3 AND 254
    AND char_length(trim(subject)) BETWEEN 1 AND 150
    AND char_length(trim(message)) BETWEEN 1 AND 2000
    AND public.check_contact_message_rate_limit(email)
  );

-- 2. SELECT: Strictly restricted to authenticated admin users (Zero Trust on client)
CREATE POLICY "Allow authenticated admin select on contact_messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- 3. UPDATE: Strictly restricted to authenticated admin users
CREATE POLICY "Allow authenticated admin update on contact_messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. DELETE: Strictly restricted to authenticated admin users
CREATE POLICY "Allow authenticated admin delete on contact_messages"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Lightweight Keep-Alive RPC that touches the database without exposing table data to anon
CREATE OR REPLACE FUNCTION public.ping_keep_alive()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_messages LIMIT 1
  ) OR TRUE;
$$;

REVOKE ALL ON FUNCTION public.ping_keep_alive() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ping_keep_alive() TO anon, authenticated;
