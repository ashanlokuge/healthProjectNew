-- Debug the review issue
-- Run this in your Supabase SQL Editor

-- Check if assignments table has the right columns
SELECT '=== ASSIGNMENTS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- Check if evidences table exists and has data
SELECT '=== EVIDENCES TABLE CHECK ===' as info;
SELECT 
    COUNT(*) as total_evidences,
    COUNT(DISTINCT assignment_id) as assignments_with_evidence
FROM evidences;

-- Check recent assignments that should be reviewable
SELECT '=== RECENT ASSIGNMENTS ===' as info;
SELECT 
    a.id,
    a.hazard_report_id,
    a.reviewer_id,
    a.assignee_id,
    a.completed_at,
    a.review_status,
    a.reviewed_at,
    hr.hazard_title,
    hr.status as report_status,
    reviewer.email as reviewer_email,
    assignee.email as assignee_email
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
LEFT JOIN profiles reviewer ON a.reviewer_id = reviewer.id
LEFT JOIN profiles assignee ON a.assignee_id = assignee.id
WHERE a.completed_at IS NOT NULL
ORDER BY a.completed_at DESC
LIMIT 5;

-- Check if there are any RLS policies blocking access
SELECT '=== RLS POLICIES ON ASSIGNMENTS ===' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'assignments'; 