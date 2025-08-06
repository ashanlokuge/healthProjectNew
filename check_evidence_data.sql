-- Check evidence data to see if files were uploaded
-- Run this in your Supabase SQL Editor

-- Check if evidences table exists
SELECT '=== EVIDENCES TABLE EXISTS ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'evidences';

-- Check evidences table structure
SELECT '=== EVIDENCES TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'evidences' 
ORDER BY ordinal_position;

-- Check all evidence records
SELECT '=== ALL EVIDENCE RECORDS ===' as info;
SELECT 
    id,
    assignment_id,
    file_name,
    file_url,
    file_type,
    created_at
FROM evidences 
ORDER BY created_at DESC;

-- Check assignments that should have evidence
SELECT '=== ASSIGNMENTS WITH EVIDENCE ===' as info;
SELECT 
    a.id as assignment_id,
    a.hazard_report_id,
    a.completed_at,
    COUNT(e.id) as evidence_count,
    STRING_AGG(e.file_name, ', ') as file_names
FROM assignments a
LEFT JOIN evidences e ON a.id = e.assignment_id
WHERE a.completed_at IS NOT NULL
GROUP BY a.id, a.hazard_report_id, a.completed_at
ORDER BY a.completed_at DESC;

-- Check specific assignment evidence (replace with actual assignment ID)
SELECT '=== SPECIFIC ASSIGNMENT EVIDENCE ===' as info;
SELECT 
    e.id,
    e.assignment_id,
    e.file_name,
    e.file_url,
    e.file_type,
    e.created_at,
    a.hazard_report_id,
    a.completed_at
FROM evidences e
JOIN assignments a ON e.assignment_id = a.id
WHERE a.completed_at IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 5; 