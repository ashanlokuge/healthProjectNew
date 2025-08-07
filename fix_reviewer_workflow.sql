-- Comprehensive Fix for Reviewer Workflow Issues
-- Run this in your Supabase SQL Editor

-- 1. Check current table structure
SELECT '=== CURRENT TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- 2. Ensure all necessary columns exist
DO $$ 
BEGIN
    -- Add review_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'review_status'
    ) THEN
        ALTER TABLE assignments ADD COLUMN review_status text DEFAULT 'pending';
        RAISE NOTICE 'Added review_status column to assignments table';
    ELSE
        RAISE NOTICE 'review_status column already exists in assignments table';
    END IF;

    -- Add reviewed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE assignments ADD COLUMN reviewed_at timestamptz;
        RAISE NOTICE 'Added reviewed_at column to assignments table';
    ELSE
        RAISE NOTICE 'reviewed_at column already exists in assignments table';
    END IF;

    -- Add review_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'review_reason'
    ) THEN
        ALTER TABLE assignments ADD COLUMN review_reason text;
        RAISE NOTICE 'Added review_reason column to assignments table';
    ELSE
        RAISE NOTICE 'review_reason column already exists in assignments table';
    END IF;
END $$;

-- 3. Update existing assignments to have proper review_status
UPDATE assignments 
SET review_status = 'pending' 
WHERE completed_at IS NOT NULL AND review_status IS NULL;

-- 4. Check current RLS policies
SELECT '=== CURRENT RLS POLICIES ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'assignments' 
AND schemaname = 'public'
ORDER BY policyname;

-- 5. Drop and recreate RLS policies for assignments table
-- First, drop all existing policies
DROP POLICY IF EXISTS "Reviewers can create assignments" ON assignments;
DROP POLICY IF EXISTS "Reviewers can read assignments they created" ON assignments;
DROP POLICY IF EXISTS "Assignees can read their assignments" ON assignments;
DROP POLICY IF EXISTS "Assignees can update their assignments" ON assignments;
DROP POLICY IF EXISTS "reviewers_can_update_review_status" ON assignments;
DROP POLICY IF EXISTS "reviewers_can_read_their_assignments" ON assignments;

-- Create comprehensive policies for assignments
-- Policy for reviewers to create assignments
CREATE POLICY "Reviewers can create assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- Policy for reviewers to read all assignments (needed for dashboard)
CREATE POLICY "Reviewers can read all assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- Policy for reviewers to update assignments they created
CREATE POLICY "Reviewers can update their assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    reviewer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  )
  WITH CHECK (
    reviewer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- Policy for assignees to read their assignments
CREATE POLICY "Assignees can read their assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policy for assignees to update their assignments
CREATE POLICY "Assignees can update their assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 6. Check current data to understand the state
SELECT '=== CURRENT ASSIGNMENTS DATA ===' as info;
SELECT 
    a.id,
    a.hazard_report_id,
    a.reviewer_id,
    a.assignee_id,
    a.completed_at,
    a.review_status,
    a.reviewed_at,
    hr.hazard_title,
    hr.status as report_status,
    reviewer.email as reviewer_email,
    assignee.email as assignee_email
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
LEFT JOIN profiles reviewer ON a.reviewer_id = reviewer.id
LEFT JOIN profiles assignee ON a.assignee_id = assignee.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 7. Test the policies by checking what the current user can see
SELECT '=== TESTING CURRENT USER PERMISSIONS ===' as info;
SELECT 
    'Current user can read assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assignments 
            WHERE reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            OR assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer')
        ) THEN 'YES'
        ELSE 'NO'
    END as read_permission,
    'Current user can update assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assignments 
            WHERE reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            OR assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        ) THEN 'YES'
        ELSE 'NO'
    END as update_permission;

-- 8. Show final table structure
SELECT '=== FINAL TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- 9. Show final RLS policies
SELECT '=== FINAL RLS POLICIES ===' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'assignments' 
AND schemaname = 'public'
ORDER BY policyname; 