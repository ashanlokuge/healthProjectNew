-- Check RLS policies for assignments table
-- Run this in your Supabase SQL Editor

-- Check if RLS is enabled on assignments table
SELECT '=== RLS STATUS ===' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'assignments';

-- Check all RLS policies on assignments table
SELECT '=== RLS POLICIES ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'assignments';

-- Check if the review_status and reviewed_at columns exist
SELECT '=== TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
  AND column_name IN ('review_status', 'reviewed_at')
ORDER BY ordinal_position;

-- Test if we can update assignments (run as authenticated user)
SELECT '=== TEST UPDATE ===' as info;
-- This will show if there are any constraints preventing updates
SELECT 
    a.id,
    a.reviewer_id,
    a.review_status,
    a.reviewed_at
FROM assignments a
WHERE a.completed_at IS NOT NULL
LIMIT 1; 