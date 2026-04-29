-- Seed Script for View App (Generates Fake Users)
-- Run this in your Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_viewer_id UUID := gen_random_uuid();
  v_adv_id UUID := gen_random_uuid();
BEGIN
  -------------------------------------------------------
  -- 1. CREATE FAKE VIEWER
  -------------------------------------------------------
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_viewer_id, 'authenticated', 'authenticated', '96599999999@viewapp.com', crypt('ViewApp123!', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()
  );

  INSERT INTO public.users (
    id, role, status, full_name, username, phone_number, civil_id_number
  ) VALUES (
    v_viewer_id, 'viewer', 'active', 'Fahad Al-Viewer', 'fahad_v', '+96599999999', '123456789012'
  );

  INSERT INTO public.wallets (user_id, balance) VALUES (v_viewer_id, 0);


  -------------------------------------------------------
  -- 2. CREATE FAKE ADVERTISER
  -------------------------------------------------------
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_adv_id, 'authenticated', 'authenticated', '96588888888@viewapp.com', crypt('ViewApp123!', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()
  );

  INSERT INTO public.users (
    id, role, status, company_name, commercial_license_number, authorized_signatory, phone_number
  ) VALUES (
    v_adv_id, 'advertiser', 'active', 'Kuwait Marketing Co', 'LIC-8888', 'Ahmad Admin', '+96588888888'
  );

  INSERT INTO public.wallets (user_id, balance) VALUES (v_adv_id, 0);

END $$;
