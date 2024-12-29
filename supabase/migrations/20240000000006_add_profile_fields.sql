-- Add phone number and address columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS address text; 