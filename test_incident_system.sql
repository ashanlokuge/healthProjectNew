-- TEST INCIDENT REPORTING SYSTEM
-- Run this in your Supabase SQL Editor to verify everything is working

-- 1. Check if tables exist
SELECT '=== CHECKING TABLES ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('incident_reports', 'incident_assignments', 'profiles', 'evidences')
ORDER BY table_name;

-- 2. Check current user
SELECT '=== CURRENT USER ===' as info;
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 3. Check current user profile
SELECT '=== CURRENT USER PROFILE ===' as info;
SELECT 
  id,
  full_name,
  email,
  role,
  user_id,
  created_at
FROM profiles 
WHERE user_id = auth.uid();

-- 4. Check incident_reports table structure
SELECT '=== INCIDENT_REPORTS STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'incident_reports' 
ORDER BY ordinal_position;

-- 5. Check incident_assignments table structure
SELECT '=== INCIDENT_ASSIGNMENTS STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'incident_assignments' 
ORDER BY ordinal_position;

-- 6. Check RLS policies
SELECT '=== RLS POLICIES ===' as info;
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('incident_reports', 'incident_assignments')
ORDER BY tablename, policyname;

-- 7. Test inserting a sample incident report (if user is authenticated)
SELECT '=== TESTING INSERT ===' as info;
-- This will only work if you're logged in and have a profile
DO $$
DECLARE
  user_profile_id uuid;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO user_profile_id 
  FROM profiles 
  WHERE user_id = auth.uid();
  
  IF user_profile_id IS NOT NULL THEN
    -- Insert a test incident report
    INSERT INTO incident_reports (
      user_id,
      incident_title,
      description,
      site,
      department,
      location,
      date_of_incident,
      time_of_incident,
      date_of_reporting,
      reporter_name,
      incident_category,
      severity_level,
      status
    ) VALUES (
      user_profile_id,
      'Test Incident Report',
      'This is a test incident report to verify the system is working.',
      'Test Site',
      'Test Department',
      'Test Location',
      CURRENT_DATE,
      '10:00:00',
      CURRENT_DATE,
      'Test Reporter',
      'safety',
      'medium',
      'submitted'
    );
    
    RAISE NOTICE 'Test incident report inserted successfully';
  ELSE
    RAISE NOTICE 'No user profile found - cannot insert test data';
  END IF;
END $$;

-- 8. Check if test data was inserted
SELECT '=== TEST DATA VERIFICATION ===' as info;
SELECT 
  id,
  incident_title,
  status,
  created_at
FROM incident_reports 
ORDER BY created_at DESC 
LIMIT 5; 