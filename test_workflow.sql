-- Test the complete workflow
-- Run this in your Supabase SQL Editor

-- Step 1: Check if we have the right users
SELECT '=== USERS CHECK ===' as step;
SELECT id, email, full_name, role FROM profiles ORDER BY role, email;

-- Step 2: Check if we have assignments
SELECT '=== ASSIGNMENTS CHECK ===' as step;
SELECT 
    a.id,
    a.hazard_report_id,
    a.reviewer_id,
    a.assignee_id,
    a.completed_at,
    a.review_status,
    hr.hazard_title,
    hr.status as report_status,
    reviewer.email as reviewer_email,
    assignee.email as assignee_email
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
LEFT JOIN profiles reviewer ON a.reviewer_id = reviewer.id
LEFT JOIN profiles assignee ON a.assignee_id = assignee.id
ORDER BY a.created_at DESC;

-- Step 3: Manually create a test assignment if none exist
-- (Uncomment the lines below if you need to create a test assignment)

/*
INSERT INTO assignments (
    hazard_report_id,
    reviewer_id,
    assignee_id,
    action,
    target_completion_date,
    remark,
    assigned_at
) VALUES (
    (SELECT id FROM hazard_reports LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'reviewer' LIMIT 1),
    (SELECT id FROM profiles WHERE email LIKE '%test22%' LIMIT 1),
    'Test action for test22',
    '2024-12-31',
    'Test assignment for workflow testing',
    NOW()
);
*/

-- Step 4: Check completed assignments that need review
SELECT '=== COMPLETED ASSIGNMENTS FOR REVIEW ===' as step;
SELECT 
    a.id,
    a.hazard_report_id,
    a.completed_at,
    a.review_status,
    hr.hazard_title,
    hr.status as report_status,
    assignee.email as assignee_email
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
LEFT JOIN profiles assignee ON a.assignee_id = assignee.id
WHERE a.completed_at IS NOT NULL
ORDER BY a.completed_at DESC; 