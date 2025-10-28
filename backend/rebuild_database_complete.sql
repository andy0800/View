-- ============================================================================
-- COMPLETE DATABASE REBUILD - PRODUCTION SCHEMA
-- ============================================================================
-- This script creates ALL tables with correct production schema
-- Matches backend models exactly
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CREATE USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    civil_id VARCHAR(255) UNIQUE,
    phone VARCHAR(255) NOT NULL UNIQUE,
    role enum_users_role NOT NULL,
    kyc_status enum_users_kyc_status DEFAULT 'pending',
    civil_front_key VARCHAR(255),
    civil_back_key VARCHAR(255),
    company_name VARCHAR(255),
    license_number VARCHAR(255),
    signatory_name VARCHAR(255),
    license_doc_key VARCHAR(255),
    verified_at TIMESTAMP,
    email VARCHAR(255),
    commercial_registration_number VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE ADVERTISER_PACKAGES TABLE
-- ============================================================================
CREATE TABLE advertiser_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    price_per_view_micro BIGINT NOT NULL,
    viewer_reward_percentage DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    company_share_percentage DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    estimated_views INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE PURCHASED_PACKAGES TABLE
-- ============================================================================
CREATE TABLE purchased_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES advertiser_packages(id),
    purchased_budget_micro BIGINT NOT NULL,
    remaining_budget_micro BIGINT NOT NULL,
    used_budget_micro BIGINT NOT NULL DEFAULT 0,
    purchased_budget DECIMAL(10,3) NOT NULL,
    remaining_budget DECIMAL(10,3) NOT NULL,
    used_budget DECIMAL(10,3) NOT NULL DEFAULT 0,
    estimated_views INTEGER NOT NULL,
    views_completed INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE SECTIONS TABLE
-- ============================================================================
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: CREATE ADS TABLE
-- ============================================================================
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES advertiser_packages(id),
    purchased_package_id UUID NOT NULL REFERENCES purchased_packages(id),
    media_url VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    section VARCHAR(50) NOT NULL DEFAULT 'general',
    status enum_ad_status NOT NULL DEFAULT 'draft',
    is_active BOOLEAN NOT NULL DEFAULT true,
    verification_status enum_verification_status NOT NULL DEFAULT 'pending',
    image_key VARCHAR(255),
    link VARCHAR(255),
    cta_link VARCHAR(255),
    cta_text VARCHAR(100) DEFAULT 'Learn More',
    cta_enabled BOOLEAN NOT NULL DEFAULT true,
    budget DECIMAL(10,3) NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    spent DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: CREATE VIEW_EVENTS TABLE
-- ============================================================================
CREATE TABLE view_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id),
    user_id UUID NOT NULL REFERENCES users(id),
    purchased_package_id UUID NOT NULL REFERENCES purchased_packages(id),
    package_id INTEGER NOT NULL REFERENCES advertiser_packages(id),
    proof_token VARCHAR(255) NOT NULL UNIQUE,
    proof_token_expires_at TIMESTAMP NOT NULL,
    charged_micro BIGINT NOT NULL DEFAULT 0,
    viewer_reward_micro BIGINT NOT NULL DEFAULT 0,
    company_share_micro BIGINT NOT NULL DEFAULT 0,
    viewer_reward DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    company_fee DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    total_cost DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    watched_duration_ms INTEGER,
    required_duration_ms INTEGER NOT NULL,
    completion_duration INTEGER,
    required_duration INTEGER NOT NULL DEFAULT 10,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ============================================================================
-- STEP 7: CREATE WALLETS TABLE
-- ============================================================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance_micro BIGINT NOT NULL DEFAULT 0,
    balance DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 8: CREATE TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    from_wallet_id UUID,
    to_wallet_id UUID,
    amount_micro BIGINT NOT NULL,
    amount DECIMAL(10,3) NOT NULL,
    type enum_transactions_type NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    transaction_category VARCHAR(50),
    reference VARCHAR(255),
    reference_id VARCHAR(255),
    meta JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 9: CREATE COMPANY_WALLETS TABLE
-- ============================================================================
CREATE TABLE company_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance_micro BIGINT NOT NULL DEFAULT 0,
    balance DECIMAL(10,3) NOT NULL DEFAULT 0,
    total_fees_collected_micro BIGINT NOT NULL DEFAULT 0,
    total_fees_collected DECIMAL(10,3) NOT NULL DEFAULT 0,
    total_rewards_paid_micro BIGINT NOT NULL DEFAULT 0,
    total_rewards_paid DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 10: CREATE COMMENTS TABLE
-- ============================================================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 11: CREATE COMMENT_LIKES TABLE
-- ============================================================================
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- STEP 12: CREATE OTP_CODES TABLE
-- ============================================================================
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 13: CREATE WITHDRAWALS TABLE
-- ============================================================================
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,3) NOT NULL,
    amount_micro BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 14: CREATE ADMIN_SETTINGS TABLE
-- ============================================================================
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 15: CREATE NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 16: CREATE SESSIONS TABLE
-- ============================================================================
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- ============================================================================
-- STEP 17: CREATE AD_APPEALS TABLE
-- ============================================================================
CREATE TABLE ad_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    advertiser_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 18: CREATE AD_VERIFICATION_HISTORY TABLE
-- ============================================================================
CREATE TABLE ad_verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id),
    status enum_verification_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 19: CREATE VIDEOS TABLE (Legacy - for compatibility)
-- ============================================================================
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    size INTEGER,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 20: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_civil_id ON users(civil_id);
CREATE INDEX idx_users_role ON users(role);

-- Ads indexes
CREATE INDEX idx_ads_advertiser_id ON ads(advertiser_id);
CREATE INDEX idx_ads_section ON ads(section);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_verification_status ON ads(verification_status);
CREATE INDEX idx_ads_is_active ON ads(is_active);

-- View events indexes
CREATE INDEX idx_view_events_ad_id ON view_events(ad_id);
CREATE INDEX idx_view_events_user_id ON view_events(user_id);
CREATE INDEX idx_view_events_proof_token ON view_events(proof_token);
CREATE INDEX idx_view_events_is_completed ON view_events(is_completed);
CREATE INDEX idx_view_events_24hr_reward_check 
ON view_events(user_id, ad_id, is_completed, completed_at DESC) 
WHERE is_completed = true;
CREATE INDEX idx_view_events_user_completed_at 
ON view_events(user_id, completed_at DESC) 
WHERE is_completed = true;
CREATE INDEX idx_view_events_ad_completed 
ON view_events(ad_id, is_completed, completed_at DESC);

-- Wallets indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Transactions indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Purchased packages indexes
CREATE INDEX idx_purchased_packages_advertiser_id ON purchased_packages(advertiser_id);
CREATE INDEX idx_purchased_packages_status ON purchased_packages(status);

-- Comments indexes
CREATE INDEX idx_comments_ad_id ON comments(ad_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Withdrawals indexes
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Sessions index
CREATE INDEX idx_sessions_expire ON sessions(expire);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
SELECT 'Database rebuild complete!' AS message;
SELECT COUNT(*) AS total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

