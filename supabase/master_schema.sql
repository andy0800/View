-- INITIAL SCHEMA FOR VIEW APP (AD-REWARD FINTECH LEDGER)

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('viewer', 'advertiser', 'admin');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE transaction_type AS ENUM ('reward', 'ad_spend', 'company_share', 'withdrawal', 'deposit');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. TABLES

-- Users (Extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL,
  status account_status DEFAULT 'pending',
  full_name TEXT,
  username TEXT UNIQUE,
  phone_number TEXT UNIQUE,
  civil_id_number TEXT UNIQUE,
  company_name TEXT,
  commercial_license_number TEXT,
  authorized_signatory TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KYC Documents
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- e.g., 'civil_id_front', 'commercial_license'
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  balance BIGINT DEFAULT 0 NOT NULL, -- Cached balance in micro-units
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert System Company Wallet
INSERT INTO public.wallets (id, balance) VALUES ('00000000-0000-0000-0000-000000000000', 0);

-- Ledger Transactions (APPEND ONLY)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE RESTRICT NOT NULL,
  amount BIGINT NOT NULL, -- Positive for credit, Negative for debit
  type transaction_type NOT NULL,
  reference_id UUID, -- References ad_id, withdrawal_id, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Advertiser Packages
CREATE TABLE public.advertiser_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_seconds INTEGER NOT NULL UNIQUE,
  price_per_view BIGINT NOT NULL, -- micro-units
  reward_amount BIGINT NOT NULL,  -- micro-units
  company_amount BIGINT NOT NULL, -- micro-units
  min_budget BIGINT NOT NULL DEFAULT 300000000, -- 300 KWD in micro
  budget_increment BIGINT NOT NULL DEFAULT 100000000, -- 100 KWD
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Packages
INSERT INTO public.advertiser_packages (duration_seconds, price_per_view, reward_amount, company_amount) VALUES
(10, 10000, 5000, 5000),
(15, 14000, 7000, 7000),
(20, 16000, 8000, 8000),
(30, 24000, 12000, 12000);

-- Purchased Packages (Advertiser Budgets)
CREATE TABLE public.purchased_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  package_id UUID REFERENCES public.advertiser_packages(id) ON DELETE RESTRICT NOT NULL,
  total_budget BIGINT NOT NULL,
  remaining_budget BIGINT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ads
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchased_package_id UUID REFERENCES public.purchased_packages(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'pending_review', -- pending_review, active, completed, paused
  target_views INTEGER,
  current_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View Events (Fraud Prevention)
CREATE TABLE public.view_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE RESTRICT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_rewarded BOOLEAN DEFAULT false
);

-- Withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  amount BIGINT NOT NULL,
  status withdrawal_status DEFAULT 'pending',
  bank_details JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRIGGERS & CONSTRAINTS (THE LEDGER SYSTEM)

-- Prevent direct updates to wallets.balance
CREATE OR REPLACE FUNCTION protect_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance IS DISTINCT FROM OLD.balance THEN
    RAISE EXCEPTION 'Direct updates to wallet balance are forbidden. Must use transactions table.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_wallet_balance_update
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION protect_wallet_balance();

-- Function to safely update wallet balance when a transaction is inserted
CREATE OR REPLACE FUNCTION process_ledger_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Disable the protection trigger temporarily for this operation
  ALTER TABLE public.wallets DISABLE TRIGGER prevent_wallet_balance_update;
  
  -- Update the balance
  UPDATE public.wallets 
  SET balance = balance + NEW.amount, 
      updated_at = NOW()
  WHERE id = NEW.wallet_id;
  
  -- Re-enable the protection trigger
  ALTER TABLE public.wallets ENABLE TRIGGER prevent_wallet_balance_update;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on transactions to update wallet balance
CREATE TRIGGER on_transaction_inserted
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_ledger_transaction();

-- Prevent updates or deletes on transactions (Immutable Ledger)
CREATE OR REPLACE FUNCTION prevent_transaction_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Transactions are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_transactions_update
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_transaction_modification();

CREATE TRIGGER protect_transactions_delete
  BEFORE DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_transaction_modification();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
-- More detailed RLS policies to follow based on app needs.


-- RPC FUNCTIONS FOR ATOMIC OPERATIONS (FINTECH LEDGER)

-- 1. Complete Ad View (Atomic)
CREATE OR REPLACE FUNCTION public.rpc_complete_ad_view(
    p_viewer_id UUID,
    p_ad_id UUID,
    p_view_event_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_ad RECORD;
    v_package RECORD;
    v_viewer_wallet_id UUID;
    v_company_wallet_id UUID;
BEGIN
    -- 1. Lock the Ad row
    SELECT * INTO v_ad FROM public.ads WHERE id = p_ad_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Ad not found'); END IF;
    IF v_ad.status != 'active' THEN RETURN jsonb_build_object('success', false, 'error', 'Ad is not active'); END IF;
    IF v_ad.current_views >= v_ad.target_views THEN RETURN jsonb_build_object('success', false, 'error', 'Ad reached target views'); END IF;

    -- 2. Lock the Purchased Package row
    SELECT pp.*, ap.reward_amount, ap.company_amount, ap.price_per_view 
    INTO v_package 
    FROM public.purchased_packages pp
    JOIN public.advertiser_packages ap ON pp.package_id = ap.id
    WHERE pp.id = v_ad.purchased_package_id FOR UPDATE;

    IF v_package.remaining_budget < v_package.price_per_view THEN
        -- Auto pause ad if budget is depleted
        UPDATE public.ads SET status = 'paused' WHERE id = p_ad_id;
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient package budget');
    END IF;

    -- 3. Get Viewer Wallet
    SELECT id INTO v_viewer_wallet_id FROM public.wallets WHERE user_id = p_viewer_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Viewer wallet not found'); END IF;

    -- 4. Get Company Wallet (System Wallet ID)
    v_company_wallet_id := '00000000-0000-0000-0000-000000000000'::UUID;

    -- 5. Mark View Event as Rewarded
    UPDATE public.view_events 
    SET is_rewarded = true, completed_at = NOW() 
    WHERE id = p_view_event_id AND is_rewarded = false AND viewer_id = p_viewer_id;
    
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'View event already rewarded or invalid'); END IF;

    -- 6. Update Ad Views & Package Budget
    UPDATE public.ads SET current_views = current_views + 1 WHERE id = p_ad_id;
    UPDATE public.purchased_packages SET remaining_budget = remaining_budget - v_package.price_per_view WHERE id = v_package.id;

    -- 7. Insert Ledger Transactions (Double Entry conceptually: Escrow -> Viewer & Company)
    INSERT INTO public.transactions (wallet_id, amount, type, reference_id, description) VALUES
    (v_viewer_wallet_id, v_package.reward_amount, 'reward', p_ad_id, 'Ad view reward'),
    (v_company_wallet_id, v_package.company_amount, 'company_share', p_ad_id, 'Company share for ad view');

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;


-- 2. Request Withdrawal (Atomic)
CREATE OR REPLACE FUNCTION public.rpc_request_withdrawal(
    p_user_id UUID,
    p_amount BIGINT,
    p_bank_details JSONB
) RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_withdrawal_id UUID;
BEGIN
    -- 1. Lock Wallet
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Wallet not found'); END IF;

    IF v_wallet.balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- 2. Create Withdrawal Record
    INSERT INTO public.withdrawals (user_id, amount, status, bank_details)
    VALUES (p_user_id, p_amount, 'pending', p_bank_details)
    RETURNING id INTO v_withdrawal_id;

    -- 3. Insert Ledger Transaction (Debit)
    INSERT INTO public.transactions (wallet_id, amount, type, reference_id, description)
    VALUES (v_wallet.id, -p_amount, 'withdrawal', v_withdrawal_id, 'Withdrawal request hold');

    RETURN jsonb_build_object('success', true, 'withdrawal_id', v_withdrawal_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;



-- 5. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc_documents', 'kyc_documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ads_videos', 'ads_videos', true) ON CONFLICT (id) DO NOTHING;



-- 6. BASIC STORAGE RLS POLICIES
-- Allow authenticated users to upload their own KYC docs
CREATE POLICY "Allow authenticated uploads KYC" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc_documents');
CREATE POLICY "Allow users to read their own KYC docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow everyone to read ad videos
CREATE POLICY "Allow public read Ads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'ads_videos');
-- Allow authenticated advertisers to upload
CREATE POLICY "Allow authenticated uploads Ads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads_videos');
