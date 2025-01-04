-- Add payment_method column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'card'));

-- Update existing orders to have a default value
UPDATE orders 
SET payment_method = 'card' 
WHERE payment_method IS NULL; 