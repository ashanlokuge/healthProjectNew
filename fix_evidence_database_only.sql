-- Fix Evidence Upload Database Issues Only
-- Run this in your Supabase SQL Editor
-- This script only fixes database issues, not storage policies

-- 1. Check if evidence-files storage bucket exists
SELECT '=== CHECKING STORAGE BUCKETS ===' as info;
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'evidence-files';

-- 2. Fix RLS policies on evidences table
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

-- 3. Ensure assignments table has review_status column
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

-- 4. Check current evidence records
SELECT '=== CURRENT EVIDENCE STATUS ===' as info;
SELECT 
    COUNT(*) as total_evidence_records,
    COUNT(DISTINCT assignment_id) as assignments_with_evidence
FROM evidences;

-- 5. Check assignments that should have evidence
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

-- 6. Test evidence insertion capability
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

-- 7. Check evidence table RLS policies
SELECT '=== EVIDENCE TABLE RLS POLICIES ===' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'evidences'
ORDER BY policyname; 