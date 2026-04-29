-- Cleanup Script: Run this in Supabase SQL Editor to wipe the broken manually-seeded users
-- This allows you to register them cleanly via the App UI.

DO $$
DECLARE
  v_viewer_id UUID;
  v_adv_id UUID;
BEGIN
  -- 1. Find the IDs of the broken users
  SELECT id INTO v_viewer_id FROM public.users WHERE phone_number = '+96599999999';
  SELECT id INTO v_adv_id FROM public.users WHERE phone_number = '+96588888888';

  -- 2. Delete their wallets
  DELETE FROM public.wallets WHERE user_id IN (v_viewer_id, v_adv_id);

  -- 3. Delete their public profiles
  DELETE FROM public.users WHERE id IN (v_viewer_id, v_adv_id);

  -- 4. Delete from auth.users
  DELETE FROM auth.users WHERE email IN ('96599999999@viewapp.com', '96588888888@viewapp.com');
END $$;
