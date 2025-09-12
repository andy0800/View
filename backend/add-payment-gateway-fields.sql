-- Add payment gateway fields to transactions table
-- This script adds the necessary fields for MYFATOORH payment integration

-- Add reference_id field
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255);
COMMENT ON COLUMN transactions.reference_id IS 'External reference ID (e.g., MyFatoorah session ID, Stripe payment intent ID)';

-- Add payment_gateway field
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_gateway_enum') THEN
        CREATE TYPE payment_gateway_enum AS ENUM ('stripe', 'myfatoorah', 'manual', 'internal');
    END IF;
END $$;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_gateway payment_gateway_enum DEFAULT 'internal';
COMMENT ON COLUMN transactions.payment_gateway IS 'Payment gateway used for the transaction';

-- Add payment_method field
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
COMMENT ON COLUMN transactions.payment_method IS 'Payment method used (card, bank_transfer, etc.)';

-- Add gateway_transaction_id field
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gateway_transaction_id VARCHAR(255);
COMMENT ON COLUMN transactions.gateway_transaction_id IS 'Transaction ID from payment gateway';

-- Add gateway_response field
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gateway_response JSONB;
COMMENT ON COLUMN transactions.gateway_response IS 'Full response from payment gateway';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_gateway ON transactions(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_transaction_id ON transactions(gateway_transaction_id);

-- Update existing transactions to have 'internal' as payment_gateway
UPDATE transactions 
SET payment_gateway = 'internal' 
WHERE payment_gateway IS NULL;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Payment gateway fields added successfully to transactions table';
END $$;
