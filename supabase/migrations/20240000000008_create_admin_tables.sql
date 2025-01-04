-- Drop all existing policies first
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "dishes_public_read" ON dishes;
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "dishes_admin_all" ON dishes;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- Drop legacy policies if they exist
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to dishes" ON dishes;
DROP POLICY IF EXISTS "Allow admin full access to categories" ON categories;
DROP POLICY IF EXISTS "Allow admin full access to dishes" ON dishes;
DROP POLICY IF EXISTS "Allow admin full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- Enable RLS on tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple public read policies for categories and dishes
CREATE POLICY "categories_public_read" ON categories
    FOR SELECT TO PUBLIC
    USING (true);

CREATE POLICY "dishes_public_read" ON dishes
    FOR SELECT TO PUBLIC
    USING (true);

-- Create simple profile policies
CREATE POLICY "profiles_read_own" ON profiles
    FOR SELECT TO PUBLIC
    USING (true);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create simple admin policies for full access
CREATE POLICY "categories_admin_all" ON categories
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "dishes_admin_all" ON dishes
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "profiles_admin_all" ON profiles
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin'); 