-- Fix Incident Evidence Visibility Issue
-- This script addresses the problem where assignees upload images but reviewers can't see them
-- Run this in your Supabase SQL Editor

-- 1. Create the incident_evidences table if it doesn't exist
CREATE TABLE IF NOT EXISTS incident_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_assignment_id uuid REFERENCES incident_assignments(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- 2. Enable RLS on the table
ALTER TABLE incident_evidences ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "incident_evidence_insert_policy" ON incident_evidences;
DROP POLICY IF EXISTS "incident_evidence_read_policy" ON incident_evidences;
DROP POLICY IF EXISTS "incident_evidence_update_policy" ON incident_evidences;
DROP POLICY IF EXISTS "incident_evidence_delete_policy" ON incident_evidences;

-- 4. Create RLS policies for incident evidence

-- Policy for assignees to insert evidence for their assignments
CREATE POLICY "incident_evidence_insert_policy" ON incident_evidences
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM incident_assignments ia
      JOIN profiles p ON ia.assignee_id = p.id
      WHERE ia.id = incident_evidences.incident_assignment_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy for assignees and reviewers to read evidence
CREATE POLICY "incident_evidence_read_policy" ON incident_evidences
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM incident_assignments ia
      JOIN profiles p ON (ia.assignee_id = p.id OR ia.reviewer_id = p.id)
      WHERE ia.id = incident_evidences.incident_assignment_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy for assignees to update their own evidence
CREATE POLICY "incident_evidence_update_policy" ON incident_evidences
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM incident_evidences ie
      JOIN incident_assignments ia ON ie.incident_assignment_id = ia.id
      JOIN profiles p ON ia.assignee_id = p.id
      WHERE ie.id = incident_evidences.id
      AND p.user_id = auth.uid()
    )
  );

-- Policy for assignees to delete their own evidence
CREATE POLICY "incident_evidence_delete_policy" ON incident_evidences
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM incident_evidences ie
      JOIN incident_assignments ia ON ie.incident_assignment_id = ia.id
      JOIN profiles p ON ia.assignee_id = p.id
      WHERE ie.id = incident_evidences.id
      AND p.user_id = auth.uid()
    )
  );

-- 5. Ensure evidence-files storage bucket exists and has proper policies
-- Check if bucket exists
SELECT '=== CHECKING STORAGE BUCKETS ===' as info;
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'evidence-files';

-- Create storage policies for evidence-files bucket (if bucket exists)
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

-- 6. Verify the setup
SELECT '=== VERIFICATION ===' as info;

-- Check if incident_evidences table exists
SELECT '=== INCIDENT_EVIDENCES TABLE STATUS ===' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'incident_evidences';

-- Check RLS status
SELECT '=== RLS STATUS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'incident_evidences';

-- Check RLS policies
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

-- Check storage policies
SELECT '=== STORAGE POLICIES ===' as info;
SELECT 
    name,
    bucket_id,
    operation,
    definition
FROM storage.policies 
WHERE name LIKE '%evidence_files%'
ORDER BY name;

-- 7. Test evidence insertion capability
SELECT '=== EVIDENCE INSERTION TEST ===' as info;
SELECT 
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

-- 8. Show current incident evidence records (if any)
SELECT '=== CURRENT INCIDENT EVIDENCE RECORDS ===' as info;
SELECT 
    COUNT(*) as total_incident_evidence_records,
    COUNT(DISTINCT incident_assignment_id) as assignments_with_evidence
FROM incident_evidences;
