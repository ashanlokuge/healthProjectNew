-- Debug Review Status Issue
-- Run this in your Supabase SQL Editor to see what's happening

-- 1. Check all assignments and their review status
SELECT '=== ALL ASSIGNMENTS ===' as info;
SELECT 
    a.id,
    hr.hazard_title,
    a.completed_at,
    a.review_status,
    a.reviewed_at,
    p.full_name as assignee_name
FROM assignments a
JOIN hazard_reports hr ON a.hazard_report_id = hr.id
JOIN profiles p ON a.assignee_id = p.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 2. Check specifically for approved/rejected tasks
SELECT '=== APPROVED/REJECTED TASKS ===' as info;
SELECT 
    a.id,
    hr.hazard_title,
    a.review_status,
    a.reviewed_at,
    p.full_name as assignee_name
FROM assignments a
JOIN hazard_reports hr ON a.hazard_report_id = hr.id
JOIN profiles p ON a.assignee_id = p.id
WHERE a.review_status IN ('approved', 'rejected')
ORDER BY a.reviewed_at DESC;

-- 3. Check for tasks that should be excluded from "My Assignments"
SELECT '=== TASKS THAT SHOULD BE EXCLUDED ===' as info;
SELECT 
    a.id,
    hr.hazard_title,
    a.review_status,
    a.completed_at,
    a.reviewed_at,
    CASE 
        WHEN a.review_status IN ('approved', 'rejected') THEN 'Should be excluded'
        ELSE 'Should be included'
    END as should_be_excluded
FROM assignments a
JOIN hazard_reports hr ON a.hazard_report_id = hr.id
WHERE a.review_status IN ('approved', 'rejected')
ORDER BY a.created_at DESC;

-- 4. Check the exact query that should work for "My Assignments"
SELECT '=== MY ASSIGNMENTS QUERY TEST ===' as info;
SELECT 
    a.id,
    hr.hazard_title,
    a.review_status,
    a.completed_at,
    p.full_name as assignee_name
FROM assignments a
JOIN hazard_reports hr ON a.hazard_report_id = hr.id
JOIN profiles p ON a.assignee_id = p.id
WHERE a.review_status NOT IN ('approved', 'rejected') 
   OR a.review_status IS NULL
ORDER BY a.created_at DESC;