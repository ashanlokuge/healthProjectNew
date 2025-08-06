-- Check RLS Status and Debug the Issue
-- Run this in your Supabase SQL Editor

-- 1. Check if RLS is actually disabled on evidences table
SELECT '=== EVIDENCES TABLE RLS STATUS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'evidences';

-- 2. Check if there are any policies still on the table
SELECT '=== EVIDENCE POLICIES ===' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'evidences';

-- 3. Check if the evidences table exists and has the right structure
SELECT '=== EVIDENCES TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'evidences' 
ORDER BY ordinal_position;

-- 4. Check current user context
SELECT '=== CURRENT USER ===' as info;
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;

-- 5. Check user's profile
SELECT '=== USER PROFILE ===' as info;
SELECT 
    id,
    user_id,
    email,
    full_name,
    role
FROM profiles 
WHERE user_id = auth.uid();

-- 6. Test manual insertion to see the exact error
SELECT '=== TESTING MANUAL INSERTION ===' as info;
-- This will help us see the exact error message
DO $$
DECLARE
    test_assignment_id uuid;
    test_error text;
BEGIN
    -- Get a test assignment ID
    SELECT id INTO test_assignment_id 
    FROM assignments 
    WHERE assignee_id = auth.uid() 
    LIMIT 1;
    
    IF test_assignment_id IS NOT NULL THEN
        BEGIN
            INSERT INTO evidences (
                assignment_id,
                file_url,
                file_name,
                file_type
            ) VALUES (
                test_assignment_id,
                'https://test.com/test.jpg',
                'test.jpg',
                'image/jpeg'
            );
            RAISE NOTICE 'Manual insertion SUCCESSFUL';
        EXCEPTION WHEN OTHERS THEN
            test_error := SQLERRM;
            RAISE NOTICE 'Manual insertion FAILED: %', test_error;
        END;
    ELSE
        RAISE NOTICE 'No assignments found for current user';
    END IF;
END $$;

-- 7. Check if there are any triggers on the evidences table
SELECT '=== EVIDENCES TABLE TRIGGERS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'evidences'; 