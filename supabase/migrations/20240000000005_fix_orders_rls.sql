-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;

-- Create more permissive policies for orders
CREATE POLICY "Enable insert access for authenticated users"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users"
ON orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update access for authenticated users"
ON orders FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Enable delete access for authenticated users"
ON orders FOR DELETE
TO authenticated
USING (true);

-- Drop existing order items policies
DROP POLICY IF EXISTS "Users can create their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can update their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can delete their own order items" ON order_items;

-- Create more permissive policies for order items
CREATE POLICY "Enable insert access for authenticated users"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users"
ON order_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update access for authenticated users"
ON order_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Enable delete access for authenticated users"
ON order_items FOR DELETE
TO authenticated
USING (true); 