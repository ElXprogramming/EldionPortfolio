-- ==============================================================
-- Schema for EldionPortfolio: contact_messages
-- Run this in the Supabase Dashboard: SQL Editor -> New Query
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous visitors to insert new contact messages from the website
CREATE POLICY "Allow public insert to contact_messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow reading messages (for Secret Inbox and Keep-Alive ping queries)
CREATE POLICY "Allow select on contact_messages"
  ON public.contact_messages
  FOR SELECT
  USING (true);

-- Allow updating is_read status
CREATE POLICY "Allow update on contact_messages"
  ON public.contact_messages
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow deleting messages
CREATE POLICY "Allow delete on contact_messages"
  ON public.contact_messages
  FOR DELETE
  USING (true);
