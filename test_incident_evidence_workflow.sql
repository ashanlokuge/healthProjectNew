-- Test Incident Evidence Workflow
-- This script will verify that the evidence visibility fix is working correctly
-- Run this in your Supabase SQL Editor after applying the fix

-- 1. Check if incident_evidences table exists and has proper structure
SELECT '=== INCIDENT_EVIDENCES TABLE STATUS ===' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'incident_evidences';

SELECT '=== INCIDENT_EVIDENCES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incident_evidences'
ORDER BY ordinal_position;

-- 2. Check RLS status and policies
SELECT '=== RLS STATUS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'incident_evidences';

SELECT '=== RLS POLICIES ===' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'incident_evidences'
ORDER BY policyname;

-- 3. Check storage bucket configuration
SELECT '=== STORAGE BUCKET STATUS ===' as info;
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'evidence-files';

SELECT '=== STORAGE POLICIES ===' as info;
SELECT 
    name,
    bucket_id,
    operation,
    definition
FROM storage.policies 
WHERE name LIKE '%evidence_files%'
ORDER BY name;

-- 4. Check current incident assignments that should have evidence
SELECT '=== INCIDENT ASSIGNMENTS STATUS ===' as info;
SELECT 
    ia.id as assignment_id,
    ia.incident_report_id,
    ia.assignee_id,
    ia.reviewer_id,
    ia.action,
    ia.completed_at,
    ia.review_status,
    ir.incident_title,
    COUNT(ie.id) as evidence_count
FROM incident_assignments ia
LEFT JOIN incident_reports ir ON ia.incident_report_id = ir.id
LEFT JOIN incident_evidences ie ON ia.id = ie.incident_assignment_id
WHERE ia.completed_at IS NOT NULL
GROUP BY ia.id, ia.incident_report_id, ia.assignee_id, ia.reviewer_id, ia.action, ia.completed_at, ia.review_status, ir.incident_title
ORDER BY ia.completed_at DESC;

-- 5. Check current incident evidence records
SELECT '=== INCIDENT EVIDENCE RECORDS ===' as info;
SELECT 
    ie.id as evidence_id,
    ie.incident_assignment_id,
    ie.file_name,
    ie.file_url,
    ie.file_type,
    ie.uploaded_at,
    ia.action,
    ir.incident_title
FROM incident_evidences ie
JOIN incident_assignments ia ON ie.incident_assignment_id = ia.id
JOIN incident_reports ir ON ia.incident_report_id = ir.id
ORDER BY ie.uploaded_at DESC;

-- 6. Test evidence insertion capability for current user
SELECT '=== EVIDENCE INSERTION TEST ===' as info;
SELECT 
    'Current user ID: ' || auth.uid() as user_info,
    'User has incident assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM incident_assignments ia
            JOIN profiles p ON ia.assignee_id = p.id
            WHERE p.user_id = auth.uid()
            LIMIT 1
        ) THEN 'YES'
        ELSE 'NO'
    END as user_assignment_status,
    'User can insert evidence: ' ||
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM incident_assignments ia
            JOIN profiles p ON ia.assignee_id = p.id
            WHERE p.user_id = auth.uid()
            LIMIT 1
        ) THEN 'YES (if RLS policies are correct)'
        ELSE 'NO (no assignments)'
    END as evidence_insert_capability;

-- 7. Check user's profile and role
SELECT '=== USER PROFILE ===' as info;
SELECT 
    id,
    user_id,
    email,
    full_name,
    role
FROM profiles 
WHERE user_id = auth.uid();

-- 8. Summary of expected workflow
SELECT '=== EXPECTED WORKFLOW ===' as info;
SELECT 
    '1. Assignee uploads evidence files when completing incident task' as step_1,
    '2. Files stored in evidence-files storage bucket' as step_2,
    '3. Evidence metadata saved in incident_evidences table' as step_3,
    '4. Reviewer can see evidence when clicking "Review Task"' as step_4,
    '5. Evidence files displayed with download links' as step_5;

-- 9. Check for any potential issues
SELECT '=== POTENTIAL ISSUES CHECK ===' as info;
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incident_evidences')
        THEN '❌ incident_evidences table does not exist'
        ELSE '✅ incident_evidences table exists'
    END as table_status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incident_evidences')
        THEN '❌ No RLS policies found'
        ELSE '✅ RLS policies configured'
    END as rls_status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'evidence-files')
        THEN '❌ evidence-files storage bucket not found'
        ELSE '✅ evidence-files storage bucket exists'
    END as storage_status;
