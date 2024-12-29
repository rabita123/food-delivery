-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON cart_items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON cart_items;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON cart_items;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON cart_items;
DROP TABLE IF EXISTS cart_items;

-- Create cart_items table
CREATE TABLE cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert access for authenticated users"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for authenticated users"
ON cart_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable update access for authenticated users"
ON cart_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete access for authenticated users"
ON cart_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON cart_items TO authenticated;

-- Create trigger for updated_at
CREATE TRIGGER cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at(); 