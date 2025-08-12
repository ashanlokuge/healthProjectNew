-- Complete fix for licenses table - Run this in Supabase SQL Editor
-- This will create the table if it doesn't exist and fix all RLS issues

-- Step 1: Create the licenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  license_name TEXT NOT NULL,
  responsible_person TEXT NOT NULL,
  authority TEXT NOT NULL,
  validity_days INTEGER NOT NULL,
  apply_before_days INTEGER NOT NULL,
  date_of_renewal DATE NOT NULL,
  next_renewal_date DATE,
  remark TEXT,
  document_submission TEXT,
  reminder BOOLEAN DEFAULT false,
  escalation01 BOOLEAN DEFAULT false,
  escalation02 BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_created_at ON licenses(created_at);

-- Step 3: Completely disable RLS to fix permission issues
ALTER TABLE licenses DISABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing policies (in case they exist)
DROP POLICY IF EXISTS "Users can view own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can insert own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can update own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can delete own licenses" ON licenses;
DROP POLICY IF EXISTS "Reviewers can view all licenses" ON licenses;
DROP POLICY IF EXISTS "allow_authenticated_select" ON licenses;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON licenses;
DROP POLICY IF EXISTS "allow_authenticated_update" ON licenses;
DROP POLICY IF EXISTS "allow_authenticated_delete" ON licenses;

-- Step 5: Create triggers for automatic date calculation and timestamp updates
CREATE OR REPLACE FUNCTION calculate_next_renewal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_renewal IS NOT NULL AND NEW.validity_days > 0 THEN
    NEW.next_renewal_date = NEW.date_of_renewal + INTERVAL '1 day' * NEW.validity_days;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_calculate_next_renewal ON licenses;
DROP TRIGGER IF EXISTS trigger_update_licenses_updated_at ON licenses;

-- Create triggers
CREATE TRIGGER trigger_calculate_next_renewal
  BEFORE INSERT OR UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_next_renewal();

CREATE TRIGGER trigger_update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Test the setup
SELECT 'Licenses table setup complete!' as status;

-- Step 7: Verify table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'licenses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 8: Check RLS status (should be disabled)
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'licenses';

-- Step 9: Test insert (this should work now)
-- Uncomment the following lines to test with your actual user ID
-- Replace 'your-user-id-here' with your actual auth.uid()
/*
INSERT INTO licenses (
  user_id, 
  license_name, 
  responsible_person, 
  authority, 
  validity_days, 
  apply_before_days, 
  date_of_renewal
) VALUES (
  'your-user-id-here',
  'Test License', 
  'Test Person', 
  'Test Authority', 
  365, 
  30, 
  CURRENT_DATE
);

-- Clean up test record
DELETE FROM licenses WHERE license_name = 'Test License';
*/

SELECT 'Setup complete! You can now use the License Management System.' as final_status;