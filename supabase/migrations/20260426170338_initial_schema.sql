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
