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
