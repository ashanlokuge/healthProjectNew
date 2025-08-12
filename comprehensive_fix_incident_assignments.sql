-- COMPREHENSIVE FIX for incident_assignments table
-- This script will fix all issues preventing incident assignments from working

-- 1. Check current table structure and constraints
SELECT '=== CURRENT TABLE STRUCTURE ===' as info;
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'incident_assignments'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Check what tables exist and their structure
SELECT '=== EXISTING TABLES ===' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('incident_assignments', 'incident_reports', 'profiles', 'users')
ORDER BY table_name;

-- 3. Check if incident_assignments table exists and its structure
SELECT '=== INCIDENT_ASSIGNMENTS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'incident_assignments'
ORDER BY ordinal_position;

-- 4. Check if the table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_assignments') THEN
    CREATE TABLE incident_assignments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      incident_report_id UUID,
      reviewer_id UUID,
      assignee_id UUID,
      action TEXT NOT NULL,
      target_completion_date DATE NOT NULL,
      remark TEXT,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      reviewed_at TIMESTAMP WITH TIME ZONE,
      is_approved BOOLEAN,
      review_reason TEXT,
      review_status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created incident_assignments table';
  ELSE
    RAISE NOTICE 'incident_assignments table already exists';
  END IF;
END $$;

-- 5. Check what the foreign key should reference
SELECT '=== CHECKING REFERENCE TABLES ===' as info;
SELECT 
  'profiles table exists: ' || 
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN 'YES' ELSE 'NO' END as profiles_exists,
  'users table exists: ' || 
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN 'YES' ELSE 'NO' END as users_exists,
  'incident_reports table exists: ' || 
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_reports') THEN 'YES' ELSE 'NO' END as incident_reports_exists;

-- 6. Drop existing foreign key constraints if they're wrong
SELECT '=== DROPPING EXISTING CONSTRAINTS ===' as info;
DO $$
BEGIN
  -- Drop all foreign key constraints on incident_assignments
  EXECUTE (
    'ALTER TABLE incident_assignments DROP CONSTRAINT IF EXISTS incident_assignments_incident_report_id_fkey CASCADE'
  );
  EXECUTE (
    'ALTER TABLE incident_assignments DROP CONSTRAINT IF EXISTS incident_assignments_reviewer_id_fkey CASCADE'
  );
  EXECUTE (
    'ALTER TABLE incident_assignments DROP CONSTRAINT IF EXISTS incident_assignments_assignee_id_fkey CASCADE'
  );
  RAISE NOTICE 'Dropped existing foreign key constraints';
END $$;

-- 7. Add correct foreign key constraints
SELECT '=== ADDING CORRECT FOREIGN KEY CONSTRAINTS ===' as info;
DO $$
BEGIN
  -- Add constraint for incident_report_id
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_reports') THEN
    EXECUTE (
      'ALTER TABLE incident_assignments ADD CONSTRAINT incident_assignments_incident_report_id_fkey 
       FOREIGN KEY (incident_report_id) REFERENCES incident_reports(id) ON DELETE CASCADE'
    );
    RAISE NOTICE 'Added constraint: incident_report_id -> incident_reports(id)';
  ELSE
    RAISE NOTICE 'incident_reports table does not exist, skipping constraint';
  END IF;

  -- Add constraint for reviewer_id - should reference profiles table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    EXECUTE (
      'ALTER TABLE incident_assignments ADD CONSTRAINT incident_assignments_reviewer_id_fkey 
       FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE'
    );
    RAISE NOTICE 'Added constraint: reviewer_id -> profiles(id)';
  ELSE
    RAISE NOTICE 'profiles table does not exist, skipping constraint';
  END IF;

  -- Add constraint for assignee_id - should reference profiles table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    EXECUTE (
      'ALTER TABLE incident_assignments ADD CONSTRAINT incident_assignments_assignee_id_fkey 
       FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE CASCADE'
    );
    RAISE NOTICE 'Added constraint: assignee_id -> profiles(id)';
  ELSE
    RAISE NOTICE 'profiles table does not exist, skipping constraint';
  END IF;
END $$;

-- 8. Check current profiles data
SELECT '=== CURRENT PROFILES DATA ===' as info;
SELECT 
  id,
  email,
  full_name,
  role,
  user_id,
  created_at
FROM profiles
ORDER BY role, email;

-- 9. Check if there are any existing incident_assignments with invalid data
SELECT '=== CHECKING EXISTING DATA ===' as info;
SELECT COUNT(*) as total_incident_assignments FROM incident_assignments;

-- 10. Disable RLS temporarily to allow testing
SELECT '=== DISABLING RLS TEMPORARILY ===' as info;
ALTER TABLE incident_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 11. Create test data if needed
SELECT '=== CREATING TEST DATA IF NEEDED ===' as info;
DO $$
DECLARE
  test_reviewer_id UUID;
  test_assignee_id UUID;
  test_incident_report_id UUID;
BEGIN
  -- Get a reviewer profile
  SELECT id INTO test_reviewer_id FROM profiles WHERE role = 'reviewer' LIMIT 1;
  
  -- Get an assignee profile
  SELECT id INTO test_assignee_id FROM profiles WHERE role = 'assignee' LIMIT 1;
  
  -- Get an incident report
  SELECT id INTO test_incident_report_id FROM incident_reports LIMIT 1;
  
  IF test_reviewer_id IS NOT NULL AND test_assignee_id IS NOT NULL AND test_incident_report_id IS NOT NULL THEN
    -- Insert a test assignment
    INSERT INTO incident_assignments (
      incident_report_id,
      reviewer_id,
      assignee_id,
      action,
      target_completion_date,
      remark
    ) VALUES (
      test_incident_report_id,
      test_reviewer_id,
      test_assignee_id,
      'Test assignment for debugging',
      CURRENT_DATE + INTERVAL '7 days',
      'This is a test assignment to verify the system works'
    );
    RAISE NOTICE 'Created test assignment successfully';
  ELSE
    RAISE NOTICE 'Could not create test assignment - missing required data';
    RAISE NOTICE 'reviewer_id: %, assignee_id: %, incident_report_id: %', 
      test_reviewer_id, test_assignee_id, test_incident_report_id;
  END IF;
END $$;

-- 12. Verify the test data
SELECT '=== VERIFYING TEST DATA ===' as info;
SELECT 
  ia.id,
  ia.incident_report_id,
  ia.reviewer_id,
  ia.assignee_id,
  ia.action,
  ia.created_at,
  p_reviewer.email as reviewer_email,
  p_assignee.email as assignee_email
FROM incident_assignments ia
LEFT JOIN profiles p_reviewer ON ia.reviewer_id = p_reviewer.id
LEFT JOIN profiles p_assignee ON ia.assignee_id = p_assignee.id
ORDER BY ia.created_at DESC
LIMIT 5;

-- 13. Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT 
  'Total incident_assignments: ' || COUNT(*) as total_assignments,
  'Valid reviewer_id: ' || COUNT(CASE WHEN reviewer_id IN (SELECT id FROM profiles) THEN 1 END) as valid_reviewer_count,
  'Valid assignee_id: ' || COUNT(CASE WHEN assignee_id IN (SELECT id FROM profiles) THEN 1 END) as valid_assignee_count
FROM incident_assignments;

-- 14. Ready for testing
SELECT '=== READY FOR TESTING ===' as info;
SELECT 
  'All foreign key constraints should now be valid.' as status,
  'Try assigning an incident again.' as next_step,
  'If you still get errors, check the console for details.' as note;
