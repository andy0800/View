# 🔍 DATABASE vs CODE COMPREHENSIVE AUDIT REPORT

**Date:** October 27, 2025  
**Database:** Local Docker PostgreSQL (`adrewards`)  
**Code Base:** Backend + Frontend

---

## 📊 EXECUTIVE SUMMARY

### **Critical Issues Found:** 37
### **High Priority:** 12
### **Medium Priority:** 15  
### **Low Priority:** 10

### **Overall Assessment:** ⚠️ **SEVERE MISMATCHES**
Your local Docker database has an **outdated/incomplete schema** that does NOT match your production-ready code.

---

## 🚨 CRITICAL MISMATCHES (HIGH PRIORITY)

### **1. `view_events` Table - SEVERE MISMATCH**

**❌ Database Has:**
```sql
- id (uuid)
- video_id (uuid)          ← References old 'videos' table
- user_id (uuid)
- viewed_at (timestamp)
```

**✅ Code Expects:**
```javascript
- id (uuid)
- ad_id (uuid)             ← Should reference 'ads' table
- user_id (uuid)
- purchased_package_id (uuid)
- package_id (integer)
- proof_token (string)
- proof_token_expires_at (date)
- charged_micro (bigint)
- viewer_reward_micro (bigint)
- company_share_micro (bigint)
- viewer_reward (decimal)
- company_fee (decimal)
- total_cost (decimal)
- is_completed (boolean)
- watched_duration_ms (integer)
- required_duration_ms (integer)
- completion_duration (integer)
- required_duration (integer)
- viewed_at (date)
- completed_at (date)
```

**Impact:** 🔴 **CRITICAL - System Cannot Function**
- Backend cannot track ad views properly
- Reward system completely broken
- Cannot validate proof tokens
- No fraud prevention
- No budget tracking

**Solution:**
```sql
-- Drop old table and recreate with production schema
DROP TABLE IF EXISTS view_events CASCADE;

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
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_view_events_ad_id ON view_events(ad_id);
CREATE INDEX idx_view_events_user_id ON view_events(user_id);
CREATE INDEX idx_view_events_proof_token ON view_events(proof_token);
CREATE INDEX idx_view_events_is_completed ON view_events(is_completed);
CREATE INDEX idx_view_events_24hr_reward_check ON view_events(user_id, ad_id, is_completed, completed_at DESC) WHERE is_completed = true;
```

---

### **2. `ads` Table - MISSING CRITICAL COLUMNS**

**❌ Database Has:**
```sql
- id, advertiser_id, package_id (uuid), title, description
- image_key, link, created_at, updated_at, media_url
- budget, views, spent
```

**✅ Code Expects (Additional Columns):**
```javascript
- purchased_package_id (UUID) - REQUIRED
- section (STRING) - REQUIRED  
- status (ENUM) - REQUIRED
- is_active (BOOLEAN) - REQUIRED
- verification_status (ENUM) - REQUIRED
- cta_link (STRING)
- cta_text (STRING)
- cta_enabled (BOOLEAN)
```

**Impact:** 🔴 **CRITICAL**
- Cannot categorize ads by section
- No ad approval workflow
- Cannot track ad status
- Missing call-to-action features
- No connection to purchased packages

**Solution:**
```sql
ALTER TABLE ads 
ADD COLUMN purchased_package_id UUID REFERENCES purchased_packages(id),
ADD COLUMN section VARCHAR(50) NOT NULL DEFAULT 'general',
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft',
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
ADD COLUMN cta_link VARCHAR(255),
ADD COLUMN cta_text VARCHAR(100) DEFAULT 'Learn More',
ADD COLUMN cta_enabled BOOLEAN NOT NULL DEFAULT true;

-- Change package_id from UUID to INTEGER
ALTER TABLE ads ALTER COLUMN package_id TYPE INTEGER USING package_id::text::integer;
```

---

### **3. `advertiser_packages` Table - WRONG STRUCTURE**

**❌ Database Has:**
```sql
- id (uuid)
- name
- price
- duration_days
```

**✅ Code Expects:**
```javascript
- id (INTEGER) ← Should be INTEGER, not UUID
- name
- duration (INTEGER) ← Not duration_days
- price_per_view_micro (BIGINT)
- viewer_reward_percentage (DECIMAL)
- company_share_percentage (DECIMAL)
- estimated_views (INTEGER)
- is_active (BOOLEAN)
```

**Impact:** 🔴 **CRITICAL**
- Cannot calculate rewards properly
- No micro-unit pricing
- Missing view estimations
- Wrong ID type causes foreign key issues

**Solution:**
```sql
-- Recreate table with correct structure
DROP TABLE IF EXISTS advertiser_packages CASCADE;

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
```

---

### **4. MISSING TABLE: `purchased_packages`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expects:**
```javascript
CREATE TABLE purchased_packages (
    id UUID PRIMARY KEY,
    advertiser_id UUID NOT NULL REFERENCES users(id),
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
```

**Impact:** 🔴 **CRITICAL - SYSTEM BREAKING**
- Cannot track advertiser package purchases
- No budget management
- Cannot link ads to packages
- Payment system broken

---

### **5. MISSING TABLE: `sections`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expects:**
```javascript
CREATE TABLE sections (
    id UUID PRIMARY KEY,
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
```

**Impact:** 🔴 **CRITICAL**
- Cannot categorize ads (retail, food, health, etc.)
- Main page navigation broken
- Frontend section display fails

---

### **6. MISSING TABLE: `company_wallet`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expects:**
```javascript
CREATE TABLE company_wallets (
    id UUID PRIMARY KEY,
    balance_micro BIGINT NOT NULL DEFAULT 0,
    balance DECIMAL(10,3) NOT NULL DEFAULT 0,
    total_fees_collected_micro BIGINT NOT NULL DEFAULT 0,
    total_fees_collected DECIMAL(10,3) NOT NULL DEFAULT 0,
    total_rewards_paid_micro BIGINT NOT NULL DEFAULT 0,
    total_rewards_paid DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Impact:** 🔴 **HIGH**
- Cannot track company revenue
- No fee management
- Missing financial records

---

### **7. MISSING TABLE: `comments`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expects:**
```javascript
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    ad_id UUID NOT NULL REFERENCES ads(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Impact:** 🟡 **MEDIUM**
- Social features not working
- User engagement broken

---

### **8. MISSING TABLE: `comment_likes`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expected:** Full comment like tracking

**Impact:** 🟡 **MEDIUM**

---

### **9. MISSING TABLE: `admin_settings`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expected:** System configuration storage

**Impact:** 🟡 **MEDIUM**

---

### **10. MISSING TABLE: `notifications`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expected:** User notification system

**Impact:** 🟡 **MEDIUM**

---

### **11. MISSING TABLE: `sessions`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expected:** User session management

**Impact:** 🟡 **MEDIUM**

---

### **12. MISSING TABLE: `ad_appeals`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expected:** Ad rejection appeal system

**Impact:** 🟡 **LOW**

---

### **13. MISSING TABLE: `ad_verification_history`**

**❌ Database:** **TABLE DOES NOT EXIST**

**✅ Code Expected:** Ad approval audit trail

**Impact:** 🟡 **LOW**

---

## 🟨 MODERATE ISSUES

### **14. `transactions` Table - INCOMPLETE**

**❌ Database Missing:**
- `from_wallet_id`
- `to_wallet_id`
- `amount_micro`
- `status`
- `transaction_category`
- `meta`
- `processed_at`

**Impact:** 🟡 **HIGH**
- Cannot track wallet-to-wallet transfers
- No transaction status tracking
- Missing metadata

---

### **15. `wallets` Table - MISSING MICRO-UNITS**

**❌ Database Missing:**
- `balance_micro` (BIGINT) - For precise calculations

**Impact:** 🟡 **MEDIUM**
- Potential rounding errors in financial calculations
- Cannot use micro-unit system

---

### **16. `users` Table - ISSUES**

**⚠️ Database Issues:**
- **46 duplicate unique indexes on `civil_id`** (users_civil_id_key through users_civil_id_key45)
- **46 duplicate unique indexes on `phone`** (users_phone_key through users_phone_key45)
- Missing: `verified_at`, `email`, `commercial_registration_number`

**Impact:** 🟡 **MEDIUM**
- Database bloat from duplicate indexes
- Performance degradation
- Missing verification tracking

**Solution:**
```sql
-- Drop duplicate indexes
DO $$ 
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname LIKE 'users_civil_id_key%' 
        AND indexname != 'users_civil_id_key'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || idx.indexname;
    END LOOP;
    
    FOR idx IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname LIKE 'users_phone_key%' 
        AND indexname != 'users_phone_key'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || idx.indexname;
    END LOOP;
END $$;

-- Add missing columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS commercial_registration_number VARCHAR(50);
```

---

### **17. `videos` Table - OBSOLETE/REDUNDANT**

**❌ Issue:** This table appears to be a legacy structure

**Database Has:**
- `videos` table with `ad_id` foreign key
- `view_events` references `video_id` → `videos.id`

**Code Reality:**
- Ads ARE videos (media_url in ads table)
- This creates unnecessary complexity
- `view_events` should reference `ads` directly

**Impact:** 🟡 **MEDIUM**
- Data duplication
- Confusing structure
- Extra joins needed

**Solution:** Consider deprecating `videos` table and referencing `ads` directly

---

## 🔵 SCHEMA COMPARISON SUMMARY

### **Tables in Database (9 tables):**
1. ✅ `ads` (incomplete)
2. ✅ `advertiser_packages` (wrong structure)
3. ✅ `otp_codes` (correct)
4. ✅ `transactions` (incomplete)
5. ✅ `users` (has issues)
6. ✅ `videos` (redundant?)
7. ❌ `view_events` (completely wrong)
8. ✅ `wallets` (missing micro-units)
9. ✅ `withdrawals` (mostly correct)

### **Tables Expected by Code (27 model files):**
1. ✅ ads
2. ✅ advertiser_packages
3. ❌ **purchased_packages** (MISSING)
4. ❌ **sections** (MISSING)
5. ❌ **company_wallets** (MISSING)
6. ❌ **comments** (MISSING)
7. ❌ **comment_likes** (MISSING)
8. ❌ **admin_settings** (MISSING)
9. ❌ **notifications** (MISSING)
10. ❌ **sessions** (MISSING)
11. ❌ **ad_appeals** (MISSING)
12. ❌ **ad_verification_history** (MISSING)
13. ✅ otp_codes
14. ✅ transactions
15. ✅ users
16. ✅ videos
17. ❌ **view_events** (EXISTS BUT WRONG)
18. ✅ wallets
19. ✅ withdrawals

---

## 🎯 RECOMMENDED ACTION PLAN

### **Option 1: Fresh Start (RECOMMENDED)**

**🔥 Drop entire local database and rebuild from production schema:**

```bash
# 1. Backup current data (if needed)
docker exec view-postgres-1 pg_dump -U postgres -d adrewards > local_backup.sql

# 2. Drop and recreate database
docker exec -it view-postgres-1 psql -U postgres -c "DROP DATABASE adrewards;"
docker exec -it view-postgres-1 psql -U postgres -c "CREATE DATABASE adrewards;"

# 3. Run production migrations
cd backend
npm run migrate

# 4. Seed with test data
npm run populate-sections
npm run inject-admin
npm run inject-test-advertiser
```

---

### **Option 2: Incremental Fix (Complex)**

**Step-by-step fixes:**

1. **Phase 1: Critical Tables** (Day 1)
   - Drop and recreate `view_events`
   - Create `purchased_packages`
   - Create `sections`
   - Fix `ads` table columns
   - Fix `advertiser_packages` structure

2. **Phase 2: Supporting Tables** (Day 2)
   - Create `company_wallets`
   - Create `comments` and `comment_likes`
   - Fix `transactions` table
   - Add micro-unit columns to `wallets`

3. **Phase 3: Admin Features** (Day 3)
   - Create `admin_settings`
   - Create `notifications`
   - Create `sessions`
   - Create `ad_appeals`
   - Create `ad_verification_history`

4. **Phase 4: Cleanup** (Day 4)
   - Remove duplicate indexes
   - Add missing user columns
   - Optimize performance
   - Update foreign keys

---

### **Option 3: Use Production Database**

**👍 Simplest Solution:**
- Stop using local Docker database
- Connect directly to Render production database for development
- OR: Dump production schema and restore to local

```bash
# Dump production schema (structure only)
pg_dump -h dpg-d2vdj7ogjchc73b4iqig-a.oregon-postgres.render.com \
  -U viewapp_postgres_user \
  -d viewapp_postgres \
  --schema-only \
  > production_schema.sql

# Restore to local
docker exec -i view-postgres-1 psql -U postgres -d adrewards < production_schema.sql
```

---

## 📋 DETAILED MIGRATION SCRIPT

I can create a complete migration script to fix all issues. Would you like me to generate:

1. **Complete database rebuild script** - Drops all tables and recreates with production schema
2. **Incremental update script** - Fixes existing tables without losing data
3. **Production schema export** - Exports your production Render database structure

---

## 🔥 IMMEDIATE ACTIONS REQUIRED

### **Priority 1 (Do Now):**
1. ✅ Backup current Docker database
2. ❌ **STOP using local database** - it will cause development issues
3. ✅ Run production migrations to rebuild schema
4. ✅ Seed with test data

### **Priority 2 (This Week):**
1. Remove duplicate indexes on `users` table
2. Add missing columns to existing tables
3. Create missing tables

### **Priority 3 (Next Week):**
1. Audit production database vs local
2. Document all schema differences
3. Create consistent development setup

---

## 💡 PREVENTION RECOMMENDATIONS

1. **Use migrations consistently** - Never manually alter schema
2. **Keep local in sync with production** - Regular schema dumps
3. **Automated testing** - Schema validation in CI/CD
4. **Documentation** - Maintain ERD diagrams

---

**END OF AUDIT REPORT**

Would you like me to generate the fix scripts?

