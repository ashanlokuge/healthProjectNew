-- Test Incident Workflow
-- Run this in your Supabase SQL Editor to test the incident reviewer workflow

-- 1. Check if we have the necessary tables
SELECT '=== CHECKING TABLES ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('incident_reports', 'incident_assignments', 'profiles')
ORDER BY table_name;

-- 2. Check if we have users with reviewer and assignee roles
SELECT '=== CHECKING USER ROLES ===' as info;
SELECT 
    id,
    full_name,
    email,
    role,
    user_id
FROM profiles 
WHERE role IN ('reviewer', 'assignee')
ORDER BY role, email;

-- 3. Create test incident report if none exist
INSERT INTO incident_reports (
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
    status,
    user_id
) 
SELECT 
    'Test Incident Report',
    'This is a test incident report to verify the workflow.',
    'Main Site',
    'Operations',
    'Building A - Floor 2',
    CURRENT_DATE - INTERVAL '2 days',
    '14:30',
    CURRENT_DATE,
    'John Doe',
    'Safety Incident',
    'Medium',
    'submitted',
    p.id
FROM profiles p 
WHERE p.role = 'user' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- 4. Create test incident assignment if none exist
INSERT INTO incident_assignments (
    incident_report_id,
    reviewer_id,
    assignee_id,
    action,
    target_completion_date,
    remark,
    review_status
)
SELECT 
    ir.id,
    reviewer.id,
    assignee.id,
    'Investigate and resolve the incident',
    CURRENT_DATE + INTERVAL '7 days',
    'Please investigate this incident and provide a detailed report.',
    'pending'
FROM incident_reports ir
CROSS JOIN profiles reviewer
CROSS JOIN profiles assignee
WHERE ir.status = 'submitted'
  AND reviewer.role = 'reviewer'
  AND assignee.role = 'assignee'
  AND NOT EXISTS (
    SELECT 1 FROM incident_assignments ia WHERE ia.incident_report_id = ir.id
  )
LIMIT 1;

-- 5. Show current incident reports
SELECT '=== CURRENT INCIDENT REPORTS ===' as info;
SELECT 
    id,
    incident_title,
    status,
    created_at
FROM incident_reports
ORDER BY created_at DESC;

-- 6. Show current incident assignments
SELECT '=== CURRENT INCIDENT ASSIGNMENTS ===' as info;
SELECT 
    a.id,
    a.incident_report_id,
    a.reviewer_id,
    a.assignee_id,
    a.completed_at,
    a.review_status,
    a.reviewed_at,
    ir.incident_title,
    ir.status as report_status,
    reviewer.email as reviewer_email,
    assignee.email as assignee_email
FROM incident_assignments a
LEFT JOIN incident_reports ir ON a.incident_report_id = ir.id
LEFT JOIN profiles reviewer ON a.reviewer_id = reviewer.id
LEFT JOIN profiles assignee ON a.assignee_id = assignee.id
ORDER BY a.created_at DESC;

-- 7. Test the queries that the reviewer dashboard uses
SELECT '=== TESTING REVIEWER DASHBOARD QUERIES ===' as info;

-- Test: Load unassigned incident reports
SELECT 'Unassigned reports count:' as query_type, COUNT(*) as count
FROM incident_reports
WHERE status = 'submitted';

-- Test: Load incident assignments (exclude approved/rejected tasks)
SELECT 'Active assignments count:' as query_type, COUNT(*) as count
FROM incident_assignments
WHERE review_status NOT IN ('approved', 'rejected') OR review_status IS NULL;

-- Test: Load tasks pending review
SELECT 'Pending review tasks count:' as query_type, COUNT(*) as count
FROM incident_assignments
WHERE completed_at IS NOT NULL AND (review_status IS NULL OR review_status = 'pending');

-- Test: Load reviewed tasks
SELECT 'Reviewed tasks count:' as query_type, COUNT(*) as count
FROM incident_assignments
WHERE review_status IN ('approved', 'rejected');

-- 8. Test RLS policies
SELECT '=== TESTING RLS POLICIES ===' as info;
SELECT 
    'Current user can read incident assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM incident_assignments 
            WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer')
        ) THEN 'YES'
        ELSE 'NO'
    END as read_permission,
    'Current user can update incident assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM incident_assignments 
            WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer')
        ) THEN 'YES'
        ELSE 'NO'
    END as update_permission;

-- 9. Show final summary
SELECT '=== WORKFLOW STATUS ===' as info;
SELECT 
    'Total incident reports: ' || (SELECT COUNT(*) FROM incident_reports) as reports_count,
    'Total incident assignments: ' || (SELECT COUNT(*) FROM incident_assignments) as assignments_count,
    'Pending review tasks: ' || (SELECT COUNT(*) FROM incident_assignments WHERE completed_at IS NOT NULL AND (review_status IS NULL OR review_status = 'pending')) as pending_review_count,
    'Reviewed tasks: ' || (SELECT COUNT(*) FROM incident_assignments WHERE review_status IN ('approved', 'rejected')) as reviewed_count; 