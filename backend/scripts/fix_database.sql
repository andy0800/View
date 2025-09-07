-- Fix database script for advertiser with phone +96550000000

-- 1. Add the missing column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS commercial_registration_number VARCHAR(255);

-- 2. Update the advertiser with fake data
UPDATE users 
SET 
  company_name = 'Fake Company Ltd.',
  license_number = 'LIC-2024-001',
  commercial_registration_number = 'CR-2024-001',
  signatory_name = 'John Doe',
  role = 'advertiser',
  kyc_status = 'verified',
  is_active = true,
  verified_at = NOW()
WHERE phone = '+96550000000';

-- 3. Verify the update
SELECT 
  id, 
  phone, 
  role, 
  company_name, 
  license_number, 
  commercial_registration_number, 
  signatory_name, 
  kyc_status,
  is_active,
  verified_at
FROM users 
WHERE phone = '+96550000000';

-- 4. Show all users for verification
SELECT 
  id, 
  phone, 
  role, 
  company_name, 
  license_number, 
  kyc_status
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
