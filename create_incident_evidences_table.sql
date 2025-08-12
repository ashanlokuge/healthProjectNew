-- Create Incident Evidences Table
-- This table stores evidence files uploaded by assignees for incident assignments
-- Run this in your Supabase SQL Editor

-- Create the incident_evidences table
CREATE TABLE IF NOT EXISTS incident_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_assignment_id uuid REFERENCES incident_assignments(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE incident_evidences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for incident evidence

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

-- Verify the table was created
SELECT '=== INCIDENT_EVIDENCES TABLE CREATED ===' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'incident_evidences';

-- Verify RLS is enabled
SELECT '=== RLS STATUS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'incident_evidences';

-- Verify policies were created
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
