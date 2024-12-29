-- Add updated_at column to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at(); 