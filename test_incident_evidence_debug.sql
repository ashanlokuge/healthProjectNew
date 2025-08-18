-- Debug Incident Evidence System
-- Run this in your Supabase SQL Editor to see what's happening

-- 1. Check if all required tables exist
SELECT '=== TABLE EXISTENCE CHECK ===' as info;
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('incident_reports', 'incident_assignments', 'incident_evidences')
ORDER BY table_name;

-- 2. Check incident_reports table structure
SELECT '=== INCIDENT_REPORTS STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incident_reports'
ORDER BY ordinal_position;

-- 3. Check incident_assignments table structure
SELECT '=== INCIDENT_ASSIGNMENTS STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incident_assignments'
ORDER BY ordinal_position;

-- 4. Check incident_evidences table structure
SELECT '=== INCIDENT_EVIDENCES STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incident_evidences'
ORDER BY ordinal_position;

-- 5. Check if there are any incident reports
SELECT '=== INCIDENT REPORTS DATA ===' as info;
SELECT 
    id,
    incident_title,
    user_id,
    status,
    created_at
FROM incident_reports
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check if there are any incident assignments
SELECT '=== INCIDENT ASSIGNMENTS DATA ===' as info;
SELECT 
    id,
    incident_report_id,
    assignee_id,
    reviewer_id,
    review_status,
    created_at
FROM incident_assignments
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check if there are any incident evidences
SELECT '=== INCIDENT EVIDENCES DATA ===' as info;
SELECT 
    id,
    incident_assignment_id,
    file_url,
    file_name,
    file_type,
    uploaded_at
FROM incident_evidences
ORDER BY uploaded_at DESC
LIMIT 5;

-- 8. Check the complete relationship chain
SELECT '=== RELATIONSHIP CHAIN TEST ===' as info;
SELECT 
    ir.id as report_id,
    ir.incident_title,
    ir.status as report_status,
    ia.id as assignment_id,
    ia.review_status as assignment_status,
    ie.id as evidence_id,
    ie.file_name,
    ie.file_type
FROM incident_reports ir
LEFT JOIN incident_assignments ia ON ir.id = ia.incident_report_id
LEFT JOIN incident_evidences ie ON ia.id = ie.incident_assignment_id
ORDER BY ir.created_at DESC
LIMIT 10;

-- 9. Check RLS policies on incident_evidences
SELECT '=== INCIDENT_EVIDENCES RLS POLICIES ===' as info;
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

-- 10. Test current user access
SELECT '=== CURRENT USER ACCESS TEST ===' as info;
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;
