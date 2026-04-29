-- UNIVERSAL APP ACCESS POLICY (COMMAND POLICY) - FORCE CLEAR VERSION
-- This script WIPE all existing RLS policies and grants UNRESTRICTED access 
-- to all authenticated users for development and testing.

-- 1. DROP ALL RESTRICTIVE TRIGGERS & FUNCTIONS
DROP TRIGGER IF EXISTS prevent_wallet_balance_update ON public.wallets;
DROP FUNCTION IF EXISTS protect_wallet_balance();
DROP TRIGGER IF EXISTS protect_transactions_update ON public.transactions;
DROP TRIGGER IF EXISTS protect_transactions_delete ON public.transactions;
DROP FUNCTION IF EXISTS prevent_transaction_modification();

-- 2. SIMPLIFY LEDGER FUNCTION (REMOVES ALTER TABLE)
CREATE OR REPLACE FUNCTION public.process_ledger_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.wallets 
  SET balance = balance + NEW.amount, 
      updated_at = NOW()
  WHERE id = NEW.wallet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. APPLY PERMISSIVE RLS POLICIES (FORCE CLEAR MODE)
DO $$
DECLARE
    t text;
    p_cmd text;
    tables text[] := ARRAY[
        'users', 'wallets', 'transactions', 'advertiser_packages', 
        'purchased_packages', 'ads', 'view_events', 'withdrawals', 'kyc_documents'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- Temporarily disable RLS to clear the air
            EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
            
            -- Drop EVERY policy that exists on this table
            FOR p_cmd IN (
                SELECT format('DROP POLICY IF EXISTS %I ON public.%I', policyname, tablename)
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = t
            ) LOOP
                EXECUTE p_cmd;
            END LOOP;

            -- Re-enable RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

            -- Create the Universal "Allow All" policy
            EXECUTE format('CREATE POLICY "Universal App Access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
            
            -- Special case: allow public to view ads and packages
            IF t IN ('ads', 'advertiser_packages') THEN
                 EXECUTE format('CREATE POLICY "Public Read Access" ON public.%I FOR SELECT TO public USING (true)', t);
            END IF;
        END IF;
    END LOOP;
END $$;

-- 4. GRANT MASTER PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
