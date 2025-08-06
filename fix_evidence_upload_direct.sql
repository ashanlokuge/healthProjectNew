-- Fix Evidence Upload Issues - Run this directly in Supabase SQL Editor
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. Check if evidence-files storage bucket exists
SELECT '=== CHECKING STORAGE BUCKETS ===' as info;
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'evidence-files';

-- 2. Create storage policies for evidence-files bucket (only if bucket exists)
-- This allows authenticated users to upload files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 
    'evidence_files_upload_policy',
    id,
    'INSERT',
    'auth.role() = ''authenticated'''
FROM storage.buckets 
WHERE name = 'evidence-files'
ON CONFLICT (name, bucket_id, operation) DO NOTHING;

-- Create storage policy for reading evidence files
-- This allows public read access to evidence files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 
    'evidence_files_read_policy',
    id,
    'SELECT',
    'true'
FROM storage.buckets 
WHERE name = 'evidence-files'
ON CONFLICT (name, bucket_id, operation) DO NOTHING;

-- 3. Fix RLS policies on evidences table
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Assignees can create evidence" ON evidences;
DROP POLICY IF EXISTS "Users can read evidence for their assignments" ON evidences;
DROP POLICY IF EXISTS "allow_evidence_insert_for_assignees" ON evidences;
DROP POLICY IF EXISTS "allow_evidence_read_for_assignment_participants" ON evidences;
DROP POLICY IF EXISTS "evidence_insert_policy" ON evidences;
DROP POLICY IF EXISTS "evidence_read_policy" ON evidences;

-- Create more permissive policies for evidence
CREATE POLICY "evidence_insert_policy"
  ON evidences FOR INSERT
  TO authenticated
  WITH CHECK (
    assignment_id IN (
      SELECT id FROM assignments 
      WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "evidence_read_policy"
  ON evidences FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN profiles p ON (a.assignee_id = p.id OR a.reviewer_id = p.id)
      WHERE p.user_id = auth.uid()
    )
  );

-- 4. Ensure assignments table has review_status column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'review_status'
    ) THEN
        ALTER TABLE assignments ADD COLUMN review_status text DEFAULT 'pending';
        RAISE NOTICE 'Added review_status column to assignments table';
    ELSE
        RAISE NOTICE 'review_status column already exists in assignments table';
    END IF;
END $$;

-- 5. Check current evidence records
SELECT '=== CURRENT EVIDENCE STATUS ===' as info;
SELECT 
    COUNT(*) as total_evidence_records,
    COUNT(DISTINCT assignment_id) as assignments_with_evidence
FROM evidences;

-- 6. Check assignments that should have evidence
SELECT '=== COMPLETED ASSIGNMENTS WITHOUT EVIDENCE ===' as info;
SELECT 
    a.id as assignment_id,
    a.hazard_report_id,
    a.assignee_id,
    a.completed_at,
    a.review_status,
    COUNT(e.id) as evidence_count
FROM assignments a
LEFT JOIN evidences e ON a.id = e.assignment_id
WHERE a.completed_at IS NOT NULL
GROUP BY a.id, a.hazard_report_id, a.assignee_id, a.completed_at, a.review_status
HAVING COUNT(e.id) = 0
ORDER BY a.completed_at DESC;

-- 7. Test evidence insertion capability
SELECT '=== EVIDENCE INSERTION TEST ===' as info;
SELECT 
    'User has assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assignments 
            WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            LIMIT 1
        ) THEN 'YES'
        ELSE 'NO'
    END as user_assignment_status,
    'User can insert evidence: ' ||
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assignments 
            WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            LIMIT 1
        ) THEN 'YES (if RLS policies are correct)'
        ELSE 'NO (no assignments)'
    END as evidence_insert_capability;

-- 8. Check storage policies
SELECT '=== STORAGE POLICIES ===' as info;
SELECT 
    p.name,
    b.name as bucket_name,
    p.operation,
    p.definition
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'evidence-files'; 