-- Check evidence table structure and data
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

-- Check if there are any evidence records
SELECT '=== EVIDENCES DATA ===' as info;
SELECT 
    id,
    assignment_id,
    file_name,
    file_url,
    created_at
FROM evidences 
ORDER BY created_at DESC 
LIMIT 10;

-- Check assignments that have evidence
SELECT '=== ASSIGNMENTS WITH EVIDENCE ===' as info;
SELECT 
    a.id as assignment_id,
    a.hazard_report_id,
    a.completed_at,
    COUNT(e.id) as evidence_count
FROM assignments a
LEFT JOIN evidences e ON a.id = e.assignment_id
WHERE a.completed_at IS NOT NULL
GROUP BY a.id, a.hazard_report_id, a.completed_at
HAVING COUNT(e.id) > 0
ORDER BY a.completed_at DESC; 