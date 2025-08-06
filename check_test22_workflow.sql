-- Check test22 assignee workflow status
-- Run this in your Supabase SQL Editor

-- 1. Check if test22 user exists and their role
SELECT '=== TEST22 USER PROFILE ===' as info;
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email LIKE '%test22%' OR full_name LIKE '%test22%';

-- 2. Check all assignments for test22
SELECT '=== TEST22 ASSIGNMENTS ===' as info;
SELECT 
    a.id,
    a.hazard_report_id,
    a.reviewer_id,
    a.assignee_id,
    a.action,
    a.target_completion_date,
    a.completed_at,
    a.review_status,
    a.reviewed_at,
    a.created_at,
    hr.hazard_title,
    hr.status as report_status,
    p.email as assignee_email,
    p.full_name as assignee_name
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
LEFT JOIN profiles p ON a.assignee_id = p.id
WHERE p.email LIKE '%test22%' OR p.full_name LIKE '%test22%'
ORDER BY a.created_at DESC;

-- 3. Check all completed assignments that need review
SELECT '=== COMPLETED ASSIGNMENTS NEEDING REVIEW ===' as info;
SELECT 
    a.id,
    a.hazard_report_id,
    a.reviewer_id,
    a.assignee_id,
    a.action,
    a.completed_at,
    a.review_status,
    hr.hazard_title,
    hr.status as report_status,
    p.email as assignee_email,
    p.full_name as assignee_name
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
LEFT JOIN profiles p ON a.assignee_id = p.id
WHERE a.completed_at IS NOT NULL 
  AND (a.review_status IS NULL OR a.review_status = 'pending')
ORDER BY a.completed_at DESC;

-- 4. Check all hazard reports status
SELECT '=== ALL HAZARD REPORTS STATUS ===' as info;
SELECT 
    id,
    hazard_title,
    status,
    created_at,
    updated_at
FROM hazard_reports 
ORDER BY created_at DESC; 